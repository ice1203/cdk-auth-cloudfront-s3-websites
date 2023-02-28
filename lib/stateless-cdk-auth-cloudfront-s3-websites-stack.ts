import * as path from "path";
import * as fs from "fs";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { S3 } from "./resources/s3";
import { CloudFront } from "./resources/cloudfront";

export class StatelessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // スタック作成実行リージョンの取得
    const region: string = cdk.Stack.of(this).region;
    // cognitoPoolIDの取得
    if (!fs.existsSync(path.join(__dirname, "../") + "output.json")) {
      console.log(
        "output.jsonが存在しないためCdkAuthCloudfrontS3WebsitesStatelessStackのデプロイは行われません"
      );
      return;
    }
    const outputJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../") + "output.json", "utf8")
    );

    let cognitoUserPoolID: string = "";
    for (const key in outputJson) {
      if ("CognitoUserPoolID" in outputJson[key]) {
        cognitoUserPoolID = outputJson[key].CognitoUserPoolID;
      }
      // ファイルには１つの親キーしか存在しない想定
      break;
    }
    // S3
    const s3 = new S3(this);
    s3.createResources();
    // cloudfront
    const cloudfront = new CloudFront(this, {
      s3Bucket: s3.s3bucket,
      originAccessIdentiry: s3.originAccessId,
      region: region,
      userPoolID: cognitoUserPoolID,
    });
    cloudfront.createResources();
  }
}
