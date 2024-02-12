import { Vpc } from '@cdktf/provider-aws/lib/vpc'
import { type ResourceProvider } from './endresourceprovider'
import { type Construct } from 'constructs'
// import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group'
// import { Subnet } from '@cdktf/provider-aws/lib/subnet'
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones'
import { TerraformOutput } from 'cdktf/lib/terraform-output'
import { Fn } from 'cdktf/lib/terraform-functions'
import { Subnet } from '@cdktf/provider-aws/lib/subnet'
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway'
import { RouteTable } from '@cdktf/provider-aws/lib/route-table'
import { Route } from '@cdktf/provider-aws/lib/route'
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association'
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group'
import { VpcConfig } from '../constants/vpcconfig'
// import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association'
// import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint'
// import { Subnet } from '@cdktf/provider-aws/lib/subnet'

export class VpcProvider implements ResourceProvider<Vpc> {
    
    resource: Vpc
    statements: any[]
    output?: TerraformOutput
    // securityGpId: String
    // subnetIds: String[]
    constructor(input: Construct, name: string, configOverride?: any) {
        const cidrBlock = "10.0.0.0/16";
        this.resource = this._createVpc(input, name, {
            cidrBlock: cidrBlock,
            ...configOverride
        })
        this.statements = [
            {
              Effect: 'Allow',
              Action: 'kinesis:*',
              Resource: [
                this.resource?.arn
              ]
            }
          ]
    }


    _createVpc(input: Construct, prefix: string , configOverride?: any) : Vpc {
        const publicSubnetsCidrBlocks = this._getPublicSubnetCidrBlocks(configOverride.cidrBlock)
        const subnetCidrBlocks = this._getPrivateSubnetCidrBlocks(
            configOverride.cidrBlock,
            2,
            2
        );

        const zones = new DataAwsAvailabilityZones(input, 'zones', {
            state: 'available'
        });


        const vpc =  new Vpc(input, prefix + "-VPC", {
            cidrBlock: configOverride.cidrBlock,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags:{"Name":"cdktf-vpc"}
        });

        const [privateSubnets, publicSubnets] = this._createVpcSubnets(input, vpc, prefix, publicSubnetsCidrBlocks, subnetCidrBlocks, zones.names)

        let igw = new InternetGateway(input, "igw", {
            vpcId: vpc.id,
            tags: {"name": "cdktf-igw"},
        });

        let publicRtb = new RouteTable(input, "public-rtb", {
            vpcId: vpc.id,
            tags: {"name": "cdktf_public_route_table"}
        });

        new Route(input, "public-igw-route", {
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: igw.id,
            routeTableId: publicRtb.id
        })

        publicSubnets.forEach((subnet, index) => {
            new RouteTableAssociation(input, `rtb_association_${index}`, {
                routeTableId: publicRtb.id,
                dependsOn: [subnet],
                subnetId: subnet.id
            })
        })

        const securityGroup = new SecurityGroup(input, 'vpcSecGpr', {
            vpcId: vpc.id,
            name: 'vpcSecGpr',
          });

        this.output =  new TerraformOutput(input, "vpc-configs-output", {
            value: {
                vpcId: vpc.id,
                privateSubnetIds: privateSubnets.map(subnet => subnet.id),
                publicSubnetIds: publicSubnets.map(subnet => subnet.id),
                subnetIds: privateSubnets.map(subnet => subnet.id),
                securityGroupId: securityGroup.id
            } as VpcConfig,
            // dependsOn: [...privateSubnets, ...publicSubnets, vpc, securityGroup]
        })

        return vpc
    }

    

    _getPrivateSubnetCidrBlocks(cidrPrefix: string, privateSubnetCount: number, netNumStart: number) {
        const privateSubnetCidrBlocks: string[] = [];
    
        for (let index = 0; index < privateSubnetCount; index++) {
            privateSubnetCidrBlocks[index] = Fn.cidrsubnet(cidrPrefix, 8, netNumStart + index);
        }
    
        return privateSubnetCidrBlocks;
    }
    
    _getPublicSubnetCidrBlocks(cidrPrefix: string) {
        return [
            Fn.cidrsubnet(cidrPrefix, 8, 0),
            Fn.cidrsubnet(cidrPrefix, 8, 1)
        ]
    }

    _createVpcSubnets(input: Construct, vpc: Vpc, prefix: string , publicCidrBlocks: string[],  cidrBlocks: string[], azs: string[], configOverride?: any): [Subnet[], Subnet[]] {
        const privateSubnets = this._createSubnets(input, vpc, prefix + "-private", cidrBlocks, azs, {
            ...configOverride,
            isPublic: false
        })

        const publicSubnets = this._createSubnets(input, vpc, prefix + "-public", publicCidrBlocks, azs, {
            ...configOverride,
            isPublic: true
        })
        
        return [privateSubnets, publicSubnets]
    }

    _createSubnets(input: Construct, vpc: Vpc, prefix: string , privateSubnetCidrBlocks: string[], azs: string[], configOverride?: any): Subnet[] {
        let subnets : Subnet[] = []
        let currentMask = 0
        for(let cidrI = 0; cidrI <  2 ; cidrI ++){
            let subnet = new Subnet(input, prefix + "-subnet-" + (currentMask), {
                vpcId: vpc.id,
                availabilityZone: Fn.element(azs, currentMask),
                mapPublicIpOnLaunch: configOverride.isPublic,
                cidrBlock: Fn.element(privateSubnetCidrBlocks, cidrI)
            });

            subnets = [...subnets, subnet]
            currentMask=currentMask+1
        }
        return subnets
    }

    // createSecurtyGp(input: Construct, prefix: string , configOverride?: any) : SecurityGroup {
    //     return new SecurityGroup(input, prefix + "-scgp", {

    //     });

    // }
}

// def createSubnets(self,**kwargs):
//     global currentMask
//     subnets = []
//     for i in range(kwargs["subnetCount"]):
//             cidr= "${cidrsubnet(\"10.12.0.0/16\","+str(kwargs["maskNumer"])+","+str(currentMask)+")}"
//             subnet = vpc.Subnet(self, "{prefix}_subnet_{number}".format(prefix=kwargs["prefix"],number=str(i+1)),
//                             vpc_id=kwargs["vpcid"],
//                             availability_zone= azs[i % len(azs) ],
//                             map_public_ip_on_launch=kwargs["isPublic"],
//                             cidr_block=cidr,
//                             tags={"Name": "{prefix}_subnet_{number}".format(prefix=kwargs["prefix"],number=str(currentMask+1))})
//             subnets.append({"id":subnet.id, "cidr":cidr})
//             currentMask=currentMask+1
//     return subnets

// class MyStack(TerraformStack):
//     def __init__(self, scope: Construct, ns: str):
//         super().__init__(scope, ns)

//         # define resources here
//         AwsProvider(self, "aws", region="us-east-1")
//         custom_vpc= vpc.Vpc(self, "vpc", 
//                     cidr_block="10.12.0.0/16",
//                     enable_dns_hostnames=True,
//                     enable_dns_support=True,
//                     tags={"Name":"cdktf-vpc"})
                    
//         # create subnets
//         publicSubnets= createSubnets(self,vpcid=custom_vpc.id, subnetCount=3, prefix= "public", maskNumer=8, isPublic=True)
//         privateSubnets= createSubnets(self,vpcid=custom_vpc.id, subnetCount=3, prefix= "private", maskNumer=8, isPublic=False)
//         databaseSubnets=createSubnets(self,vpcid=custom_vpc.id, subnetCount=3, prefix= "database", maskNumer=8, isPublic=False)

