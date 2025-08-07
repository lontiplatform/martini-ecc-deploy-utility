import * as core from "@actions/core";

export interface Inputs {
  instance_name: string;
  access_token: string;
  base_dir: string;
  package_dir: string;
  description: string;
  tags: string;
}

export function getInputs(): Inputs {
  const inputs: Inputs = {
    instance_name:
      core.getInput("instance_name") || process.env["INSTANCE_NAME"] || "",
    access_token:
      core.getInput("access_token") || process.env["ACCESS_TOKEN"] || "",
    base_dir: core.getInput("base_dir") || process.env["BASE_DIR"] || "",
    package_dir:
      core.getInput("package_dir") || process.env["PACKAGE_DIR"] || "packages",
    description:
      core.getInput("description") ||
      process.env["DESCRIPTION"] ||
      "Deployment using Martini ECC Deploy Utility",
    tags: core.getInput("tags") || process.env["TAGS"] || "",
  };

  return inputs;
}

function checkRequiredInput(input: string, name: string): void {
  if (!input) {
    core.debug(`Required input missing: ${name}`);
    throw new Error(`Required input '${name}' is missing.`);
  }
}

export function validateInputs(inputs: Inputs): void {
  core.debug("Validating required inputs");
  checkRequiredInput(inputs.instance_name, "instance_name");
  checkRequiredInput(inputs.access_token, "access_token");
  core.debug("All required inputs are present");
}
