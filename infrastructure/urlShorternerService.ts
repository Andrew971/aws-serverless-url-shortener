import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import restApi from './api/restApi'
import link from './table/links'
import cfDistribtuion from './cdn/distribution'


export class Service extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)
    const ShortLinkTable = link(this, {
      tableName: 'ShortLinkTable'
    })

    const distribution = cfDistribtuion(this, {
      resources: {
        database: {
          ShortLinkTable: ShortLinkTable
        }
      }
    })

    restApi(this, {
      restApiName: 'ShortURLServiceApi',
      description: 'Restful api for the URL Shortener Service',
      resources: {
        distribution: distribution,
        database: {
          ShortLinkTable: ShortLinkTable
        }
      }
    })
  }

}