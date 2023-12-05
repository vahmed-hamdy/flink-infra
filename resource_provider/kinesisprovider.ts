import { type Construct } from 'constructs'
import { type ResourceProvider } from './endresourceprovider'
import { KinesisStream } from '@cdktf/provider-aws/lib/kinesis-stream'

export class KinesisProvider implements ResourceProvider {
  resource: any
  statements: any[]

  private readonly stream?: KinesisStream
  constructor (input: Construct, name: string, configOverride?: any) {
    this.stream = new KinesisStream(input, name, {
      name,
      shardCount: 1,
      retentionPeriod: 24,
      ...configOverride
    })
    this.resource = this.stream!
    this.statements = [
      {
        Effect: 'Allow',
        Action: 'kinesis:*',
        Resource: [
          this.stream?.arn
        ]
      }
    ]
  }
}
