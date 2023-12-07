import { type Construct } from 'constructs'
import { KinesisProvider } from './resource_provider/kinesisprovider'
import { DynamoDbProvider } from './resource_provider/dynamodbprovider'
import { S3Provider } from './resource_provider/s3bucketprovider'
import { MSKProvider } from './resource_provider/mksprovider'
import { PrivateConnectionConfig, PrivateConnectionProvider } from './resource_provider/privateconnectionprovider'

export enum ResourceType {
  KINESIS,
  DYNAMODB,
  S3,
  ELASTICACHE_REDIS,
  MSK,
  PRIVATE_CONNECTION
}

export interface ResourceParameters {
  type: ResourceType
  name: string
  overrideConfigs?: any
}

export class StackResourceProvider {
  readonly statements: any[]

  constructor (construct: Construct, resources: ResourceParameters[]) {
    let statements: any[] = []
    resources.forEach(resource => {
      switch (resource.type) {
        case ResourceType.KINESIS: {
          const kinesisProvider = new KinesisProvider(construct, resource.name, resource.overrideConfigs)
          statements = [...statements, ...kinesisProvider.statements]
          break
        }
        case ResourceType.DYNAMODB: {
          const dynamoDbProvider = new DynamoDbProvider(construct, resource.name, resource.overrideConfigs)
          statements = [...statements, ...dynamoDbProvider.statements]
          break
        }
        case ResourceType.S3: {
          const s3Provider = new S3Provider(construct, resource.name, resource.overrideConfigs)
          statements = [...statements, ...s3Provider.statements]
          break
        }
        case ResourceType.ELASTICACHE_REDIS: {
          break
        }
        case ResourceType.MSK: {
          const mskProvider = new MSKProvider(construct, resource.name, resource.overrideConfigs);
          statements = [...statements, ...mskProvider.statements]
          break
        }

        case ResourceType.PRIVATE_CONNECTION: {
          if(!resource.overrideConfigs != null) {
            throw new Error("Invalid private connection configs")
          }
          
          const privateConnectionProvider = new PrivateConnectionProvider(construct, resource.name, resource.overrideConfigs as PrivateConnectionConfig);
          statements = [...statements, ...privateConnectionProvider.statements]
          break
        }

        default:{
        }
      }
    })
    this.statements = statements
  }
}
