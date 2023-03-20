import { Duration, Stack } from "aws-cdk-lib"
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";

export interface TableProps {
  tableName: string
}


export default (stack: Stack, { tableName }: TableProps) => {

  const table = new Table(stack, `${tableName}RestApi`, {
    tableName:tableName,
    partitionKey: { name: 'id', type: AttributeType.STRING },
    billingMode: BillingMode.PAY_PER_REQUEST,
    replicationRegions: ['us-east-1'],
    replicationTimeout: Duration.hours(2), 
  });
  
  return table
}