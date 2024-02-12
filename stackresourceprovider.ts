import { type Construct } from 'constructs'
import { KinesisProvider } from './resource_provider/kinesisprovider'
import { DynamoDbProvider } from './resource_provider/dynamodbprovider'
import { S3Provider } from './resource_provider/s3bucketprovider'
import { MSKProvider } from './resource_provider/mksprovider'
import { PrivateConnectionConfig, PrivateConnectionProvider } from './resource_provider/privateconnectionprovider'
import { VpcProvider } from './resource_provider/vpcprovider'
import { TerraformOutput } from 'cdktf'

export enum ResourceType {
  KINESIS,
  DYNAMODB,
  S3,
  ELASTICACHE_REDIS,
  MSK,
  PRIVATE_CONNECTION,
  VPC
}

export interface ResourceParameters {
  type: ResourceType
  name: string
  overrideConfigs?: any
}

export class StackResourceProvider {
  readonly outputs?: TerraformOutput
  readonly statements: any[]

  constructor (construct: Construct, resources: ResourceParameters[]) {
    let statements: any[] = []
    let outputs: TerraformOutput | undefined
    resources.forEach(resource => {
      if(resource) {
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
  
          case ResourceType.VPC: {
            const vpcprovider = new VpcProvider(construct, resource.name, resource.overrideConfigs);
            statements = [...statements, ...vpcprovider.statements]
            outputs = vpcprovider.output
            break
          }
          case ResourceType.PRIVATE_CONNECTION: {
            if(resource.overrideConfigs?.privateConnectionConfigs == null) {
              throw new Error("Invalid private connection configs")
            }
  
            const privateConnectionProvider = new PrivateConnectionProvider(construct, resource.name, resource.overrideConfigs.privateConnectionConfigs as PrivateConnectionConfig);
            statements = [...statements, ...privateConnectionProvider.statements]
            break
          }
  
          default:{
          }
        }
      }
    })
    this.outputs = outputs
    this.statements = statements
  }
}
