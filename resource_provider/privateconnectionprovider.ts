import { Construct } from "constructs";
import { VpcSecurityGroupIngressRule } from '@cdktf/provider-aws/lib/vpc-security-group-ingress-rule';
// import { DataDnsARecordSet } from '@cdktf/provider-dns/lib/data-dns-a-record-set'
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { VpcEndpointService } from '@cdktf/provider-aws/lib/vpc-endpoint-service';
import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
import { ResourceProvider } from "./endresourceprovider";
// import { Fn } from "cdktf";
export interface PrivateConnectionConfig {
    vpcId: string,
    securityGroup : string,
    cidrIpv4?: string,
    port: number,
    ipProtocol? :string,
    endpointsWithSubnets?: { endpoint: string, subnet: string }[]
}

export class PrivateConnectionProvider implements ResourceProvider<VpcEndpointService[]> {
    resource: VpcEndpointService[];
    statements: any[];
    constructor(construct : Construct, prefix: string, ruleConfig: PrivateConnectionConfig) {
        new VpcSecurityGroupIngressRule(construct, `${prefix}-ingress-rule`, {
            securityGroupId: ruleConfig.securityGroup,
            fromPort: ruleConfig.port,
            toPort: ruleConfig.port,
            ipProtocol: ruleConfig.ipProtocol?? "TCP",
            cidrIpv4: ruleConfig.cidrIpv4?? "0.0.0.0/0"
        });
        let i = 0;
        let vpcEndpointServices = ruleConfig.endpointsWithSubnets?.map(epWithSubnet => {
            let ep = this.createPrivateLink(construct, prefix, i.toString(), epWithSubnet, ruleConfig);
            i++;
            return ep;
        });
       
        this.resource = vpcEndpointServices?? [];
        this.statements = [
            {
                Effect: 'Allow',
                Action: [
                    "ec2:AcceptVpcEndpointConnections",
                    "ec2:DescribeVpcEndpointServices"
                ],
                Resource: "*"
              }
        ]
    }

    private createPrivateLink(construct: Construct, prefix: string, suffix: string, epWithSubnet: { endpoint: string, subnet: string }, ruleConfig : PrivateConnectionConfig) : VpcEndpointService {
        
        // const epDnsLookup = new DataDnsARecordSet(construct, `dnsLookup${suffix}`, {
        //     host: epWithSubnet.endpoint
        // });
        const targetGp = new LbTargetGroup(construct,  `${prefix}-target-group${suffix}`, {
            name:  `${prefix}-target-group${suffix}`,
            port: ruleConfig.port,
            protocol:  ruleConfig.ipProtocol?? "TCP",
            targetType: "ip",
            vpcId: ruleConfig.vpcId,
            ipAddressType: "ipv4"
        }); 

        new LbTargetGroupAttachment(construct, `${prefix}-tg-attach${suffix}`, {
            targetGroupArn: targetGp.arn,
            targetId : epWithSubnet.endpoint,
            port: ruleConfig.port
        });

        const loadBalancer = new Lb(construct, `${prefix}-lb${suffix}`, {
            name: `${prefix}-load-balancer${suffix}`,
            internal: true,
            loadBalancerType: "network",
            securityGroups: [ruleConfig.securityGroup],
            subnets: [epWithSubnet.subnet],
            ipAddressType: "ipv4"
        });

        new LbListener(construct, `${prefix}-nlb-tg-ls${suffix}`, {
          loadBalancerArn: loadBalancer.arn,
          port: ruleConfig.port,
          protocol: ruleConfig.ipProtocol?? "TCP",
          defaultAction: [
                {
                    type: "forward",
                    targetGroupArn: targetGp.arn
                }
            ]
        });

        return new VpcEndpointService(construct, `${prefix}-ep-service${suffix}`, {
            networkLoadBalancerArns: [ loadBalancer.arn ],    
            acceptanceRequired: true,
            allowedPrincipals: ["arn:aws:iam::794031221915:root"]
        });
    }
}
