import { APIGatewayProxyResult } from 'aws-lambda';
import { PostEvent, getBody, httpResponse } from '../../../utils/nodejsLambda';
import { nanoid } from 'nanoid'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommandInput, QueryCommand, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
interface RequestBody {
  url: string
}
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
const { LINK_TABLE, CF_DOMAIN_NAME } = process.env
export async function handler(event: PostEvent<RequestBody>): Promise<APIGatewayProxyResult> {
  console.log('event', event)
  try {
    const param = getBody(event)
    const today = Date.now()
    const { url } = param
    if (!url) throw `Provide a url`
    const shortID = nanoid(12)
    await doesShortLinkExist(shortID)
    const item = {
      id: shortID,
      destination: url,
      createdAt: today,
      updatedAt: today,
    }
    const params = {
      TableName: LINK_TABLE,
      Item: item,
    };
    console.log(params)
    await ddbDocClient.send(new PutCommand(params));
    return httpResponse(202, {
      shortlink: `https://${event.requestContext.domainName}/${event.requestContext.stage}/${shortID}`,
      cdnShortLink: `https://${CF_DOMAIN_NAME}/${shortID}`
    })
  } catch (err) {
    return httpResponse(404, err)
  }
}


async function doesShortLinkExist(id: string) {
  try {

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
    if ((results.Count || 0) > 0) throw new Error('ShortID already exist, try again')
    return false
  } catch (err) {
    throw err
  }
}