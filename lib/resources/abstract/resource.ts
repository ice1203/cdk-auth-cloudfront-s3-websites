import { Construct } from "constructs";

export abstract class Resource {
  constructor() {}

  abstract createResources(scope: Construct): void;
}
