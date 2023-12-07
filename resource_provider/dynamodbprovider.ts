import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table'
import { type ResourceProvider } from './endresourceprovider'
import { type Construct } from 'constructs'

export class DynamoDbProvider implements ResourceProvider<DynamodbTable> {
  resource: DynamodbTable
  statements: any[]
  constructor (input: Construct, name: string, configOverride?: any) {
    const table = new DynamodbTable(input, 'TestTable', {
      name,
      hashKey: 'temp',
      attribute: [{ name: configOverride.hash_key ?? 'id', type: 'S' }],
      billingMode: 'PAY_PER_REQUEST',
      ...configOverride
    })

    table.addOverride('hash_key', configOverride.hash_key ?? 'id')
    table.addOverride('lifecycle', { create_before_destroy: true })
    this.resource = table
    this.statements = [
      {
        Effect: 'Allow',
        Action: 'dynamodb:*',
        Resource: [
          table.arn
        ]
      }
    ]
  }
}
