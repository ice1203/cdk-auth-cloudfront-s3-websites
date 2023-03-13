import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Resource } from "./abstract/resource";

export class IAM extends Resource {
  private scope: Construct;
  public lambdaRole: iam.IRole;

  constructor(scope: Construct) {
    super();
    this.scope = scope;
  }
  public createResources() {
    // IAMロール作成
    this.lambdaRole = new iam.Role(this.scope, "lambdaRole", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
        new iam.ServicePrincipal("edgelambda.amazonaws.com")
      ),
    });
    this.lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    this.lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSQSFullAccess")
    );
  }
}
