import { type Construct } from 'constructs'
import { App, TerraformStack, TerraformVariable } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws/lib/provider'
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy'
import { IamRole } from '@cdktf/provider-aws/lib/iam-role'
import { IamPolicyAttachment } from '@cdktf/provider-aws/lib/iam-policy-attachment'
import { ResourceType, StackResourceProvider } from './stackresourceprovider'
class DDBInfra extends TerraformStack {
  constructor (scope: Construct, id: string) {
    super(scope, id)

    const variables = this.defineVariable()

    new AwsProvider(this, 'AWS', {
      region: variables.region.stringValue
    })

    const provider = new StackResourceProvider(this, [
      {
        type: ResourceType.MSK,
        name: 'KafkaVVCClusterA7a'
      }
    ])

    this.createIamRoleWithPolicyStatements(provider.statements, variables.workspace)
  }

  private defineVariable (): Record<string, TerraformVariable> {
    const variableMap: Record<string, TerraformVariable> = {}

    variableMap.workspace = new TerraformVariable(this, 'workspaceId', {
      type: 'string',
      default: 'ueeqalg5dz39hgq8',
      description: 'VVC workspace Id'
    })

    variableMap.region = new TerraformVariable(this, 'region', {
      type: 'string',
      default: 'eu-central-1',
      description: 'AWS region to create stack in'
    })

    return variableMap
  }

  private createIamRoleWithPolicyStatements (statements: any[], workspace: TerraformVariable) {
    const policy = new IamPolicy(this, 'ConnectorAccessPolicy', {
      name: 'ConnectorAccessPolicy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: statements
      })
    })

    const iamRole = new IamRole(this, 'VvcTestAccessRole', {
      name: 'VvcTestAccessRole',
      assumeRolePolicy: JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: 'arn:aws:iam::794031221915:root'
              },
              Action: 'sts:AssumeRole',
              Condition: {
                StringEquals: {
                  'sts:ExternalId': workspace.stringValue
                }
              }
            }
          ]
        }
      )
    })

    new IamPolicyAttachment(this, 'VvcAccessPolicy', {
      roles: [iamRole.name],
      name: 'VvcAccessPolicy',
      policyArn: policy.arn
    })
  }
}

const app = new App()
new DDBInfra(app, 'vvc_infra')
app.synth()
