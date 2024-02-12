import { type Construct } from 'constructs'
import { App, TerraformStack, TerraformVariable } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws/lib/provider'
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy'
import { IamRole } from '@cdktf/provider-aws/lib/iam-role'
import { IamPolicyAttachment } from '@cdktf/provider-aws/lib/iam-policy-attachment'
import { ResourceParameters, ResourceType, StackResourceProvider } from './stackresourceprovider'
import privateConnectionConfigurations = require('./privateConnectionConfigs.json')
import defaultVpcConfigs = require('./vpcConfigs.json')
function defineVariable (stack: TerraformStack): Record<string, TerraformVariable> {
  const variableMap: Record<string, TerraformVariable> = {}

  variableMap.workspace = new TerraformVariable(stack, 'workspaceId', {
    type: 'string',
    default: 'workspaceId',
    description: 'VVC workspace Id'
  })

  variableMap.region = new TerraformVariable(stack, 'region', {
    type: 'string',
    default: 'eu-central-1',
    description: 'AWS region to create stack in'
  })

  return variableMap
}

class ResourceStack extends TerraformStack {
  constructor (scope: Construct, id: string, props: any) {
    super(scope, id)
    const variables = defineVariable(this)

    new AwsProvider(this, 'AWS', {
      region: variables.region.stringValue
    })

    let vpcProvider = undefined
    let overrideConfigs = {}
    if(props.createVpc) {
      vpcProvider = new StackResourceProvider(this, [
        {
          type: ResourceType.VPC,
          name: 'testVpc'
        }
      ]);
      overrideConfigs = {
        ...overrideConfigs,
        vpcConfig: vpcProvider.outputs!.value
      }
    } else if(props.useDefaultVps) {
      overrideConfigs = {
        ...overrideConfigs,
        vpcConfig: defaultVpcConfigs
      }
    }

    let resources: ResourceParameters[] = [this.getResourceToCreate(props.resourceType, overrideConfigs)]

    if(props.createprivateConnection) {
      overrideConfigs = {
        ...overrideConfigs,
        privateConnectionConfigs: privateConnectionConfigurations 
      }
      resources = [...resources, {
        type: ResourceType.PRIVATE_CONNECTION,
        name: 'resource-pc',
        overrideConfigs: overrideConfigs
      }]
    }

    const provider = new StackResourceProvider(this, resources)

    this.createIamRoleWithPolicyStatements(provider.statements, variables.workspace)
  }

  private getResourceToCreate(resourceTypeAsString : string, overrideConfigs?: any) : ResourceParameters {
    switch(resourceTypeAsString) {
      case 'kinesis':
        return {
          type: ResourceType.KINESIS,
          name: "cdktf-kinesis",
          overrideConfigs: overrideConfigs
        }
      case 'msk':
        return {
          type: ResourceType.MSK,
          name: "cdktf-msk",
          overrideConfigs: overrideConfigs
        }
      case 's3':
        return {
          type: ResourceType.S3,
          name: "cdktf-s3",
          overrideConfigs: overrideConfigs
        }
      case 'dynamodb':
        return {
          type: ResourceType.DYNAMODB,
          name: "cdktf-dynamodb",
          overrideConfigs: overrideConfigs
        }
      case 'elasticache':
      default:
        return {
          type: ResourceType.ELASTICACHE_REDIS,
          name: "cdktf-elasticache-redis",
          overrideConfigs: overrideConfigs
        }        
    }
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
new ResourceStack(app, 'vvc_infra', {
  createVpc: true,
  useDefaultVps: false,
  resourceType: 'msk',
  createPrivateConnection: true
})
app.synth()
