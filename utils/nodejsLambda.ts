import { APIGatewayProxyEvent, APIGatewayProxyEventPathParameters, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult } from 'aws-lambda'



export interface IParam extends APIGatewayProxyEventQueryStringParameters{
  action: string
}
export type IPath<P extends any> = P
export type PostEvent<T extends any> = APIGatewayProxyEvent & {
    body: T
}
export type GetEvent<T extends any> = APIGatewayProxyEvent & {
    body: T
}

export function getBody(event: APIGatewayProxyEvent): any {
    let body = event.body
    try{
        if (body && typeof body === 'string') {
            console.log('parsing body')
            body = JSON.parse(event?.body as string)
        }
        console.log('returned body', body)
        return body
    }catch(err){
        console.log('error body', body)
        throw 'Could not parse request body'
    }
    
}

export function getParam(event: APIGatewayProxyEvent): IParam | null{
  let param = event.queryStringParameters as IParam
  try {
      return param
  } catch (err) {
    console.log('error param', param)
    throw 'Could not get request param'
  }

}

export function getPath<P extends any>(event: APIGatewayProxyEvent): P | undefined{
  let path = event.pathParameters as P | undefined
  try {
      return path
  } catch (err) {
    console.log('error param', path)
    throw 'Could not get request param'
  }

}

export function httpResponse<responseType>(statusCode: number, response: responseType) : APIGatewayProxyResult {
    console.log('statusCode', statusCode)
    console.log('response', response)

    return {
        headers: {
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS 
        },
        statusCode: statusCode,
        body: JSON.stringify(response)
    }
}
export function httpHTMLResponse(statusCode: number, response: string) : APIGatewayProxyResult {
    console.log('statusCode', statusCode)
    console.log('response', response)

    return {
        headers: {
            'Content-Type': 'text/html',
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS 
        },
        statusCode: statusCode,
        body: response
    }
}
export function HttpRedirect(Location: string) : APIGatewayProxyResult {

    return {
        headers: {
            "Location": Location,
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS 
        },
        statusCode: 302,
        body: ''
    }
}

export type TResponse = ReturnType<typeof httpResponse>
