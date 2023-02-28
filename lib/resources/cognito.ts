import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Resource } from "./abstract/resource";
import { OAuthScope } from "aws-cdk-lib/aws-cognito";

export interface CognitoProps {}

export class Cognito extends Resource {
  private scope: Construct;
  private props: CognitoProps;
  public UserPool: cognito.UserPool;

  constructor(scope: Construct) {
    super();
    this.scope = scope;
  }
  public createResources() {
    // Cognito User Pool
    this.UserPool = new cognito.UserPool(this.scope, "UserPool", {
      userPoolName: "MyUserPool",
      selfSignUpEnabled: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.UserPool.addDomain("m2mAuthDomain", {
      cognitoDomain: {
        domainPrefix: "m2m-auth-sample",
      },
    });
    const cfnRscSV = new cognito.CfnUserPoolResourceServer(
      this.scope,
      "dev-userpool-resource-server",
      {
        identifier: "https://resource-server/",
        name: "dev-userpool-resource-server",
        userPoolId: this.UserPool.userPoolId,
        scopes: [
          {
            scopeDescription: "corpA read",
            scopeName: "corpA.read",
          },
          {
            scopeDescription: "corpB read",
            scopeName: "corpB.read",
          },
        ],
      }
    );

    // App Client1 for the User Pool
    const appclient1 = new cognito.UserPoolClient(
      this.scope,
      "UserPoolClient1",
      {
        userPool: this.UserPool,
        userPoolClientName: "MyUserPoolClient1",
        generateSecret: true,
        oAuth: {
          flows: {
            clientCredentials: true,
          },
          scopes: [OAuthScope.custom(`${cfnRscSV.identifier}/corpA.read`)],
        },
      }
    );
    /* 依存関係を明示しないとリソースサーバ作成前にuserPoolClientを作成してしまい、
       ScopeDoesNotExistExceptionとなる場合があるため依存関係を明示する。
    */
    appclient1.node.addDependency(cfnRscSV);

    // App Client2 for the User Pool
    const appclient2 = new cognito.UserPoolClient(
      this.scope,
      "UserPoolClient2",
      {
        userPool: this.UserPool,
        userPoolClientName: "MyUserPoolClient2",
        generateSecret: true,
        oAuth: {
          flows: {
            clientCredentials: true,
          },
          scopes: [OAuthScope.custom(`${cfnRscSV.identifier}/corpB.read`)],
        },
      }
    );
    /* 依存関係を明示しないとリソースサーバ作成前にuserPoolClientを作成してしまい、
       ScopeDoesNotExistExceptionとなる場合があるため依存関係を明示する。
    */
    appclient2.node.addDependency(cfnRscSV);
  }
}
