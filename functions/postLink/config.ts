
import { Duration } from "aws-cdk-lib";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { basename } from 'path'
import { IAuthorizer, Stage } from "aws-cdk-lib/aws-apigateway";
import { LambdaDeploymentConfig } from "aws-cdk-lib/aws-codedeploy";

const functionName: string = basename(__dirname)
type IConfig = {
  defaultStage: Stage
  environment:{
    LINK_TABLE:string
  }
}
export default ({ defaultStage, environment }: IConfig) => {


  return {
    lambda: {
      environment: environment,
      runtime: Runtime.NODEJS_18_X,
      functionName: functionName,
      memorySize: 512,
      timeout: Duration.seconds(60),
      maxEventAge: Duration.seconds(60),
      retryAttempts: 0,
      description: 'Responsible for enerating short urls and storing them into dynamodb',
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
        description: 'Responsible for enerating short urls and storing them into dynamodb',
      },
    },
    deploymentConfig: LambdaDeploymentConfig.ALL_AT_ONCE,
    defaultAlias: `${functionName}-${defaultStage.stageName}`
  }
}