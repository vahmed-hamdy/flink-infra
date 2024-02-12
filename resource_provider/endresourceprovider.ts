import { TerraformOutput } from "cdktf"

export interface ResourceProvider<Type> {
  resource: Type
  statements: any[],
  output?: TerraformOutput
}
