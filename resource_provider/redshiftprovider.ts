import { RedshiftCluster } from "@cdktf/provider-aws/lib/redshift-cluster";
import { ResourceProvider } from "./endresourceprovider";
import { Construct } from "constructs";
// import { DEFAULT_VPC_CONFIG } from "../constants/constants";
// import { VpcConfig } from "../constants/vpcconfig";

export class RedshiftProvider implements ResourceProvider<RedshiftCluster> {
    resource: RedshiftCluster;
    statements: any[];
    constructor(input: Construct, name: string, configOverride?: any) {
        // const vpcConfig = (configOverride?.vpcConfig as VpcConfig)?? DEFAULT_VPC_CONFIG;
        const cluster = new RedshiftCluster(input, name, {
            clusterIdentifier: name,
            nodeType: "",
            ...configOverride
        })
        this.resource = cluster;
     
        this.statements = [
          {
            Effect: 'Allow',
            Action: "kafka-cluster:*",
            Resource: "*" //[ cluster.arn ]
          }
        ]
    }
}