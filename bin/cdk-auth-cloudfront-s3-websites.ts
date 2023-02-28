#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StatelessStack } from "../lib/stateless-cdk-auth-cloudfront-s3-websites-stack";
import { StatefulStack } from "../lib/stateful-cdk-auth-cloudfront-s3-websites-stack";

const app = new cdk.App();
const statefulstack = new StatefulStack(
  app,
  "CdkAuthCloudfrontS3WebsitesStatefulStack",
  {
    env: { region: "us-east-1" },
  }
);

new StatelessStack(app, "CdkAuthCloudfrontS3WebsitesStatelessStack", {
  env: { region: "us-east-1" },
});
