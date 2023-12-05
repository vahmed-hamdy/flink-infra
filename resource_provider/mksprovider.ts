import { MskCluster} from '@cdktf/provider-aws/lib/msk-cluster';
import { Construct } from 'constructs';
import { ResourceProvider } from './endresourceprovider';

export class MSkProvider implements ResourceProvider {

  readonly resource: any;
  readonly statements: any[];

  constructor(input: Construct, name: string, configOverride?: any) {
    const cluster = new MskCluster(input, name, {
      clusterName: name,
      kafkaVersion: configOverride?.kafkaVersion?? "3.2.0",
      numberOfBrokerNodes:  configOverride?.numberOfBrokerNodes?? 2,
      brokerNodeGroupInfo: {
        instanceType: "kafka.t3.small",
        clientSubnets: [
          "subnet-0b9dc8692583b8076",
          "subnet-06f5a7b661a09041f"
        ],
        securityGroups: [
          "sg-0d7d8b76e5892e999"
        ]
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
        Action: [
            "ec2:AcceptVpcEndpointConnections",
            "ec2:DescribeVpcEndpointServices"
        ],
        Resource: "*"
      },
      {
        Effect: 'Allow',
        Action: "kafka-cluster:*",
        Resource: "*" //[ cluster.arn ]
      }

    ]
  }
}