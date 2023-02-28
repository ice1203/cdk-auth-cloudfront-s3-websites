# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

# install

## 構築手順

cdk bootstrap aws://<AWS アカウント ID>/us-east-1
cd <git clone したディレクトリ>
npm install
cdk deploy -O output.json CdkAuthCloudfrontS3WebsitesStatefulStack
cdk deploy CdkAuthCloudfrontS3WebsitesStatelessStack

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
