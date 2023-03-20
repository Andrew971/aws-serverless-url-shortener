import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import link from './table/links'
import restApi from './api/restApi'

export class Service extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)
    const ShortLinkTable = link(this, {
      tableName: 'ShortLinkTable'
    })
    restApi(this, {
      restApiName: 'ShortURLServiceApi',
      description: 'Restful api for the URL Shortener Service',
      resources: {
        database: {
          ShortLinkTable: ShortLinkTable
        }
      }
    })
  }

}