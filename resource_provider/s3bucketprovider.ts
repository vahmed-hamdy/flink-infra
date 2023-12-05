import { type Construct } from 'constructs'
import { type ResourceProvider } from './endresourceprovider'
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket'

export class S3Provider implements ResourceProvider {
  resource: any
  statements: any[]

  constructor (input: Construct, name: string, configOverride?: any) {
    new S3Bucket(input, name, {
      bucket: name,
      forceDestroy: true,
      versioning: {
        enabled: true,
        mfaDelete: false
      },
      ...configOverride
    })
    this.statements = [
      {
        Effect: 'Allow',
        Action: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
        Resource: `arn:aws:s3:::${name}/*`
      },
      {
        Effect: 'Allow',
        Action: ['s3:ListBucket'],
        Resource: `arn:aws:s3:::${name}`
      }
    ]
  }
}
