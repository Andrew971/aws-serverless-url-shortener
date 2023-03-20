import { APIGatewayRequestAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  console.log('event', event)
  const authHeader = event.headers?.Authorization;
  if (!authHeader) {
    return generateDenyResponse('Missing Authorization header');
  }

  const authHeaderParts = authHeader.split(' ');
  if (authHeaderParts.length !== 2 || authHeaderParts[0] !== 'Bearer') {
    return generateDenyResponse('Invalid Authorization header format');
  }

  const token = authHeaderParts[1];

  if (token !== 'admin') { 
    return generateDenyResponse('Invalid token');
  }

  return {
    principalId: 'me',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: event.methodArn
      }]
    },
  };
};

function generateDenyResponse(reason: string): APIGatewayAuthorizerResult {
  return {
    principalId: 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: 'Deny',
        Resource: '*'
      }]
    },
    context: {
      reason
    }
  };
}
