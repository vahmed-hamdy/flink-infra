import { type Construct } from 'constructs'
import { type ResourceProvider } from './endresourceprovider'
import { KinesisStream } from '@cdktf/provider-aws/lib/kinesis-stream'

export class KinesisProvider implements ResourceProvider<KinesisStream> {
  resource: KinesisStream
  statements: any[]

  constructor (input: Construct, name: string, configOverride?: any) {
    this.resource = new KinesisStream(input, name, {
      name,
      shardCount: 1,
      retentionPeriod: 24,
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
}
