import { CloudFrontResponseEvent } from 'aws-lambda';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommandInput,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";

const replicatedRegions: { [key: string]: boolean } = {
  'us-east-1': true,
  'us-east-2': false,
  'us-west-2': false,
  'eu-west-2': false,
  'eu-central-1': false,
};
const { AWS_REGION } = process.env;

const REGION = "us-east-1";
const ddbClient = new DynamoDBClient({
  region: replicatedRegions[AWS_REGION || REGION] ? AWS_REGION : REGION,

});
const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
  convertClassInstanceToMap: false,
};

const unmarshallOptions = {
  wrapNumbers: false
};
const translateConfig = { marshallOptions, unmarshallOptions };
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);



export async function handler(event: CloudFrontResponseEvent): Promise<any> {
  console.log('event', event)
  const cfRecords = event.Records[0].cf
  const request = cfRecords.request;
  try {
    console.log(request)
    const { uri } = request;
    console.log('uri', uri)
    const formatedUri = uri.includes('/beta') ? uri.replace('/beta/', '') : uri.substring(1)
    const params: QueryCommandInput = {
      TableName: 'ShortLinkTable',
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": formatedUri,
      },
    };
    const results: QueryCommandOutput = await ddbDocClient.send(new QueryCommand(params));
    if ((results.Count || 0) === 0 || !results.Items || results.Items.length === 0) {
      request.uri = '/404.html'
      return request;
    }
    const item = results.Items[0]
    return {
      status: '302',
      statusDescription: 'found',
      headers: {
        'cache-control': [{
          key: 'Cache-Control',
          value: 'max-age=3600'
        }],
        'Location': [{
          key: 'Location',
          value: item.destination
        }]
      }
    };
  } catch (err) {
    console.log('err', err)
    request.uri = '/404.html'
    return request;
  }
}

// dpclrrq07aujm.cloudfront.net/s88I2Wn3n9TY