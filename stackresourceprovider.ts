import { type Construct } from 'constructs'
import { KinesisProvider } from './resource_provider/kinesisprovider'
import { DynamoDbProvider } from './resource_provider/dynamodbprovider'
import { S3Provider } from './resource_provider/s3bucketprovider'
import { MSkProvider } from './resource_provider/mksprovider'

export enum ResourceType {
  KINESIS,
  DYNAMODB,
  S3,
  ELASTICACHE_REDIS,
  MSK
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
          const mskProvider = new MSkProvider(construct, resource.name, resource.overrideConfigs);
          statements = [...statements, ...mskProvider.statements]
          break
        }

        default:{
        }
      }
    })
    this.statements = statements
  }
}
