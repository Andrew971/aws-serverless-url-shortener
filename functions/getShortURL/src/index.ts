import { APIGatewayProxyResult } from 'aws-lambda';
import { GetEvent, HttpRedirect, getPath, httpResponse } from '../../../utils/nodejsLambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommandInput,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";

const REGION = "us-east-1";
const ddbClient = new DynamoDBClient({
  region: REGION,
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

const { LINK_TABLE } = process.env

interface RequestParam {

}

type PathParam = {
  id: string
}

export async function handler(event: GetEvent<RequestParam>): Promise<APIGatewayProxyResult> {

  console.log('event', event)

  try {
    const path = getPath<PathParam>(event)
    console.log(path)
    if (!path) throw `Provide a querystring parameter`

    const { id } = path
    const params: QueryCommandInput = {
      TableName: LINK_TABLE,
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeValues: {
        ":id": id,
      },
      ExpressionAttributeNames: {
        '#id': "id",
      },
    };

    const results: QueryCommandOutput = await ddbDocClient.send(new QueryCommand(params));

    if ((results.Count || 0) === 0 || !results.Items) throw new Error('ShortID already exist, try again')

    const item = results.Items[0]
    return HttpRedirect(item.destination)

  } catch (err) {
    return httpResponse(404, err)
  }
}