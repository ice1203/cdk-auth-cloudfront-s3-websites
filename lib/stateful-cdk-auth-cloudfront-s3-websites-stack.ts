import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Cognito } from "./resources/cognito";

export class StatefulStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Cognito
    const cognito = new Cognito(this);
    cognito.createResources();
    new cdk.CfnOutput(this, "CognitoUserPoolID", {
      value: cognito.UserPool.userPoolId,
    });
  }
}
