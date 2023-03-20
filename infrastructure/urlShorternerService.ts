import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import link from './table/links'

export class Service extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)
    const ShortLinkTable = link(this, {
      tableName: 'ShortLinkTable'
    })
  
  }

}