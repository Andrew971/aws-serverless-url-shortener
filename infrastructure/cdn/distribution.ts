import { RemovalPolicy, Stack } from "aws-cdk-lib";
import {
  AllowedMethods,
  CachePolicy,
  CachedMethods,
  Distribution,
  DistributionProps,
  LambdaEdgeEventType,
  OriginAccessIdentity,
  OriginRequestPolicy,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin,HttpOriginProps } from "aws-cdk-lib/aws-cloudfront-origins";
import getShortURLEdgeConfig from "../../functions/originRequestEdge/config"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";

export interface TableProps {
  resources: {
    database: {
      [key: string]: Table
    }
  }
}


export default (stack: Stack, { resources }: TableProps) => {
  const cfBucket = new Bucket(stack, 'cloudfrontDistributionBucket', {
    removalPolicy: RemovalPolicy.DESTROY,

    cors: [
      {
        allowedMethods: [
          HttpMethods.GET,
          HttpMethods.POST,
          HttpMethods.PUT,

        ],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      },

    ],
  });
  const bucketPolicy = new PolicyStatement()
  bucketPolicy.addAnyPrincipal()
  bucketPolicy.addActions("s3:GetObject")
  bucketPolicy.addResources(`${cfBucket.bucketArn}/*`)
  cfBucket.addToResourcePolicy(bucketPolicy)

  const accessIdentity = new OriginAccessIdentity(stack, "OriginAccessIdentity", {
    comment: `${cfBucket.bucketName}-access-identity`,
  })
  cfBucket.grantRead(accessIdentity)
  const originResponseConfig = getShortURLEdgeConfig({}).lambda
  const originResponseLambda = new NodejsFunction(stack, `${originResponseConfig.functionName}-EDGE`, {
    ...originResponseConfig,
  })

  originResponseLambda.addToRolePolicy(new PolicyStatement({
    actions: [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:DeleteItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:UpdateItem"
    ],
    resources: [`arn:aws:dynamodb:*:${stack.account}:table/${resources.database.ShortLinkTable.tableName}`],
    effect: Effect.ALLOW
  }))


  const cfConfig: DistributionProps = {
    defaultBehavior: {
      origin: new S3Origin(cfBucket, {
        originAccessIdentity: accessIdentity,
      }),
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      compress: true,
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      edgeLambdas: [
        {
          eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
          functionVersion: originResponseLambda.currentVersion
        }
      ]
    },
    minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2019,
  }

  const distribution = new Distribution(
    stack,
    "cloudfrontDistribution",
    cfConfig
  )
  return distribution
}