import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Resource } from "./abstract/resource";

export class S3 extends Resource {
  private scope: Construct;
  public s3bucket: s3.Bucket;
  public originAccessId: cloudfront.OriginAccessIdentity;

  constructor(scope: Construct) {
    super();
    this.scope = scope;
  }
  public createResources() {
    // s3作成
    this.s3bucket = new s3.Bucket(this.scope, "s3bucket", {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    // OAI作成
    this.originAccessId = new cloudfront.OriginAccessIdentity(
      this.scope,
      "s3OriginAccessIdentity",
      {
        comment: this.s3bucket.bucketName,
      }
    );
    //　バケットポリシー作成
    const s3BucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      resources: [this.s3bucket.bucketArn + "/*"],
      principals: [
        new iam.CanonicalUserPrincipal(
          this.originAccessId.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
    });
    // パケットポリシーをS3バケットに紐付け
    this.s3bucket.addToResourcePolicy(s3BucketPolicy);
  }
}
