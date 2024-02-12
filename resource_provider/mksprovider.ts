import { MskCluster} from '@cdktf/provider-aws/lib/msk-cluster';
import { Construct } from 'constructs';
import { ResourceProvider } from './endresourceprovider';
import { VpcConfig } from '../constants/vpcconfig';
import { DEFAULT_VPC_CONFIG } from '../constants/constants';

export class MSKProvider implements ResourceProvider<MskCluster> {

  readonly resource: MskCluster;
  readonly statements: any[];

  constructor(input: Construct, name: string, configOverride?: any) {
    const vpcConfig = (configOverride?.vpcConfig as VpcConfig)?? DEFAULT_VPC_CONFIG;
    const cluster = new MskCluster(input, name, {
      clusterName: name,
      kafkaVersion: configOverride?.kafkaVersion?? "3.2.0",
      numberOfBrokerNodes: configOverride?.numberOfBrokerNodes?? 2,
      brokerNodeGroupInfo: {
        instanceType: "kafka.t3.small",
        clientSubnets: vpcConfig.subnetIds,
        securityGroups: [vpcConfig.securityGroupId]
      },
      clientAuthentication: {
        unauthenticated: false,
        sasl: {
          iam: true
        }
      }
    });
    this.resource = cluster;
 
    this.statements = [
      {
        Effect: 'Allow',
        Action: "kafka-cluster:*",
        Resource: "*" //[ cluster.arn ]
      }
    ]
  }

  public static getBrokerEndpointsFromBrokers(bootStrapBrokers : string) : string[] {
    let bootStrapBrokerList = bootStrapBrokers.split(",");
    return bootStrapBrokerList.map(bootStrapBroker => bootStrapBroker.substring(0, bootStrapBroker.indexOf(":")));
  }
}