
import { Duration } from "aws-cdk-lib";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { basename } from 'path'
import { Stage } from "aws-cdk-lib/aws-apigateway";
import { LambdaDeploymentConfig } from "aws-cdk-lib/aws-codedeploy";

const functionName: string = basename(__dirname)
type IConfig = {
  
}
export default ({ }: IConfig) => {


  return {
    lambda: {
      runtime: Runtime.NODEJS_18_X,
      functionName: functionName,
      memorySize: 512,
      timeout: Duration.seconds(30),
      maxEventAge: Duration.seconds(60),
      retryAttempts: 0,
      description: 'Responsible for retrieving the shorturl from dynamodb and redirecting the request to the original destination  at the EDGE',
      tracing: Tracing.ACTIVE,
      
      bundling: {
        
        externalModules: [
          '@aws-cdk/aws-lambda',
        ],
        minify: true,
        sourceMap: true,
        target: "es2020",
        keepNames: true,
        tsconfig: `${__dirname}/tsconfig.json`,
        metafile: true,
      },
      
      entry: `${__dirname}/src/index.ts`,
      handler: "handler",
      currentVersionOptions: {
        description: 'Responsible for retrieving the shorturl from dynamodb and redirecting the request to the original destination at the EDGE',
      },
    },
    deploymentConfig: LambdaDeploymentConfig.ALL_AT_ONCE,
  }
}