import * as path from "path";
import * as fs from "fs";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Resource } from "./abstract/resource";
import * as lambda from "aws-cdk-lib/aws-lambda";
export interface CfProps {
  s3Bucket: s3.IBucket;
  originAccessIdentiry: cloudfront.IOriginAccessIdentity;
  region: string;
  userPoolID: string;
}

export class CloudFront extends Resource {
  private scope: Construct;
  private props: CfProps;

  constructor(scope: Construct, props: CfProps) {
    super();
    this.scope = scope;
    this.props = props;
  }
  public createResources() {
    // .env作成
    const a = [];
    a.push(`USERPOOLID=${this.props.userPoolID}`);
    const text = a.join("\n");
    fs.writeFileSync(
      path.join(__dirname, "../../lambda/verifyToken/") + ".env",
      text
    );

    // lambda作成
    const edgeLambda = new cloudfront.experimental.EdgeFunction(
      this.scope,
      "myEdgeLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "lambda_function.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../lambda/verifyToken/"),
          {
            bundling: {
              image: lambda.Runtime.NODEJS_18_X.bundlingImage,
              command: [
                "bash",
                "-c",
                [
                  "export npm_config_cache=$(mktemp -d)",
                  "npm install",
                  "cp -r * .env /asset-output/",
                ].join(" && "),
              ],
            },
          }
        ),
        timeout: Duration.seconds(30),
        retryAttempts: 0,
        memorySize: 1024,
      }
    );
    // CloudFront
    new cloudfront.Distribution(this.scope, "cfdistribution", {
      defaultRootObject: "index.html",
      enabled: true,
      defaultBehavior: {
        origin: new origins.S3Origin(this.props.s3Bucket, {
          originAccessIdentity: this.props.originAccessIdentiry,
        }),
        edgeLambdas: [
          {
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            functionVersion: edgeLambda.currentVersion,
          },
        ],
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        /* AllViewerExceptHostHeaderのポリシーを設定
      HostヘッダをOriginにわたすとそのHost名の証明書を要求しようとするので「SignatureDoesNotMatch」となるため
      */
        originRequestPolicy:
          cloudfront.OriginRequestPolicy.fromOriginRequestPolicyId(
            this.scope,
            "orpExceptHost",
            "b689b0a8-53d0-40ab-baf2-68738e2966ac"
          ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      enableLogging: false,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });
  }
}
