import { type Construct } from 'constructs'
import { type ResourceProvider } from './endresourceprovider'
import { ElasticacheCluster } from '@cdktf/provider-aws/lib/elasticache-cluster'

export class ElasticacheProvider implements ResourceProvider {
  resource: any
  statements: any[]
  constructor (input: Construct, name: string, configOverride?: any) {
    new ElasticacheCluster(input, name, {
      clusterId: name,
      engine: 'redis', // currently we only support redis as this is the only connector we have
      nodeType: 'cache.t4g.micro',
      numCacheNodes: 1,
      parameterGroupName: 'default.redis7.cluster.on',
      engineVersion: '7.1.0',
      port: 6379,
      ...configOverride
    })

    this.statements = [
      {
        Effect: 'Allow',
        Action: [
          'ec2:AcceptVpcEndpointConnections',
          'ec2:DescribeVpcEndpointServices'
        ],
        Resource: '*'
      },
      {
        Effect: 'Allow',
        Action: 'elasticache:*',
        Resource: '*'
      }
    ]
  }
}
