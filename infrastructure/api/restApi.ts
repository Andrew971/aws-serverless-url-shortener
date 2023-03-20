import { RemovalPolicy, Stack } from "aws-cdk-lib";
import {
  AccessLogFormat,
  AuthorizationType,
  Cors,
  EndpointType,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RequestAuthorizer,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Alias } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import postLinkConfig from "../../functions/postLink/config"
import getShortURLConfig from "../../functions/getShortURL/config"
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { ILambdaDeploymentConfig, LambdaDeploymentGroup } from "aws-cdk-lib/aws-codedeploy";
import { Distribution } from "aws-cdk-lib/aws-cloudfront";

export interface ILambdaProxyIntegration {
  lambda: NodejsFunctionProps,
  defaultAlias: string
  integretionConfig?: any
  deploymentConfig?: ILambdaDeploymentConfig,
}
export interface ILambdaRequestAuthorizer {
  lambda: NodejsFunctionProps,
  defaultAlias: string
  auhtorizerConfig?: any
  deploymentConfig?: ILambdaDeploymentConfig,
}

interface ApiProps {
  restApiName: string
  description: string
  resources: {
    distribution: Distribution
    database: {
      [key: string]: Table
    }
  }
}

export default (stack: Stack, { restApiName, description, resources }: ApiProps) => {
  const apiBetaLogGroup = new LogGroup(stack, `${restApiName}BetaLogGroup`);
  const api = new RestApi(stack, `${restApiName}RestApi`, {
    restApiName: restApiName,
    endpointTypes: [EndpointType.EDGE],
    cloudWatchRole: true,
    deploy: true,
    description: description,
    retainDeployments: true,
    defaultCorsPreflightOptions: {
      allowOrigins: Cors.ALL_ORIGINS,
      allowCredentials: false,
      allowHeaders: Cors.DEFAULT_HEADERS,
      allowMethods: Cors.ALL_METHODS,
      disableCache: false,
      statusCode: 200,
    },
    deployOptions: {
      metricsEnabled: true,
      loggingLevel: MethodLoggingLevel.INFO,
      dataTraceEnabled: true,
      tracingEnabled: true,
      stageName: "beta",
      accessLogDestination: new LogGroupLogDestination(apiBetaLogGroup),
      accessLogFormat: AccessLogFormat.jsonWithStandardFields({
        caller: false,
        httpMethod: true,
        ip: true,
        protocol: true,
        requestTime: true,
        resourcePath: true,
        responseLength: true,
        status: true,
        user: true,
      }),
    }
  });
  api.metricClientError();
  api.deploymentStage.metricServerError();

  const rootResource = api.root
  const shortenedURLResource = rootResource.addResource('{id}');


  const postLink = getLambdaProxyIntegration(stack, postLinkConfig({
    defaultStage: api.deploymentStage, environment: {
      LINK_TABLE: resources.database.ShortLinkTable.tableName,
      CF_DOMAIN_NAME: resources.distribution.domainName
    },

  }))
  const getShortURL = getLambdaProxyIntegration(stack, getShortURLConfig({
    defaultStage: api.deploymentStage, environment: {
      LINK_TABLE: resources.database.ShortLinkTable.tableName
    }
  }))

  const postLinkMethod = rootResource.addMethod("POST", postLink.integration)

  resources.database.ShortLinkTable.grantReadWriteData(postLink.alias)
  postLinkMethod.metricLatency(api.deploymentStage);

  const getShortURLMethod = shortenedURLResource.addMethod("GET", getShortURL.integration)
  resources.database.ShortLinkTable.grantReadWriteData(getShortURL.alias)
  getShortURLMethod.metricLatency(api.deploymentStage);


  return api
}


function getLambdaProxyIntegration(stack: Stack, config: ILambdaProxyIntegration) {
  const { lambda, defaultAlias, deploymentConfig, integretionConfig } = config
  const lambdaHandler = new NodejsFunction(stack, `${lambda.functionName}`, lambda)
  const lambdaAlias = new Alias(stack, `${defaultAlias.split('-')[0]}Alias`, {
    aliasName: defaultAlias,
    version: lambdaHandler.currentVersion,
  })

  new LambdaDeploymentGroup(stack, `${lambda.functionName}-DeploymentGroup`, {
    alias: lambdaAlias,
    deploymentConfig: deploymentConfig,
  });

  lambdaAlias.applyRemovalPolicy(RemovalPolicy.RETAIN)
  const integration = new LambdaIntegration(lambdaAlias.lambda, {
    proxy: true,
    ...integretionConfig
  })

  return { integration, function: lambdaHandler, alias: lambdaAlias }
}
function getLambdaRequestAuthorizer(stack: Stack, config: ILambdaRequestAuthorizer) {
  const { lambda, auhtorizerConfig } = config
  const lambdaHandler = new NodejsFunction(stack, `${lambda.functionName}`, lambda)
  lambdaHandler.applyRemovalPolicy(RemovalPolicy.RETAIN)

  const requestAuthorizer = new RequestAuthorizer(stack, `${lambda.functionName}-Authorizer`, {
    handler: lambdaHandler,
    ...auhtorizerConfig

  });

  return { requestAuthorizer, function: lambdaHandler }
}


