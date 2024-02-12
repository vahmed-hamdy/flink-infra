### Prerequisites
install cdktf for typescript: https://developer.hashicorp.com/terraform/tutorials/cdktf/cdktf-install
install aws cli: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
set up your aws creadentials: 
```
export AWS_ACCESS_KEY_ID="XXXXXXXXXX"
export AWS_SECRET_ACCESS_KEY="**********"
export AWS_SESSION_TOKEN=".............."
```

### Install resources
- Edit `main.ts` to modify resource type of the stack and if VPC is needed to be created. 
- setup your vpc configs in `vpcConfigs.json` and your private connection configs in `privateConnectionConfigs.json` to enable wiring of these configs.
- run `npm run buuld` then `npm run deploy vvc_infra` or `cdktf deploy vvc_infra`
