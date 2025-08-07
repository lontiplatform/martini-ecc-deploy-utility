import fs from "fs";
import path from "path";
import process from "process";
import * as core from "@actions/core";
import * as inputHelper from "./input-helper";
import * as eccHelper from "./ecc-helper";
import archiver from "archiver";

function determineBaseDir(baseDirInput: string): string {
  const fallbackDir =
    process.env.BITBUCKET_CLONE_DIR ||
    process.env.GITHUB_WORKSPACE ||
    process.env.CI_BUILDS_DIR ||
    process.env.CODEBUILD_SRC_DIR ||
    process.cwd();

  const chosenDir =
    baseDirInput && baseDirInput !== process.cwd() ? baseDirInput : fallbackDir;
  core.debug(`Base directory determined: ${chosenDir}`);
  return chosenDir;
}

function determineTags(tagsInput: string): string {
  const fallbackTag =
    process.env.BITBUCKET_TAG ||
    process.env.GITHUB_REF_NAME ||
    process.env.CI_COMMIT_REF_NAME ||
    process.env.CODEBUILD_SOURCE_VERSION ||
    "latest";

  const chosenTag =
    tagsInput && tagsInput !== "latest" ? tagsInput : fallbackTag;
  core.debug(`Tag determined: ${chosenTag}`);
  return chosenTag;
}

function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
  core.debug(`Zipping directory: ${sourceDir} -> ${outPath}`);
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      core.debug(`Archive finalized: ${archive.pointer()} bytes written`);
      resolve();
    });
    archive.on("error", (err) => {
      core.debug(`Archiver error: ${err.message}`);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function main(): Promise<void> {
  core.debug("Starting main function");

  const inputs = inputHelper.getInputs();

  try {
    inputHelper.validateInputs(inputs);
  } catch (error) {
    core.setFailed(`Input validation failed: ${(error as Error).message}`);
    return;
  }

  const BASE_DIR = determineBaseDir(inputs.base_dir);
  const TAGS = determineTags(inputs.tags);

  core.debug(
    `Inputs summary:
      BASE_DIR=${BASE_DIR}
      PACKAGE_DIR=${inputs.package_dir}
      INSTANCE_NAME=${inputs.instance_name}
      TAGS=${TAGS}
      DESCRIPTION=${inputs.description}`,
  );

  const fullPackagePath = path.join(BASE_DIR, inputs.package_dir);

  if (!fs.existsSync(fullPackagePath)) {
    core.setFailed(`${inputs.package_dir} directory doesn't exist.`);
    return;
  }

  const entries = fs.readdirSync(fullPackagePath, { withFileTypes: true });
  const packageDirs = entries.filter((entry) => entry.isDirectory());

  core.debug(
    `Found ${entries.length} entries; ${packageDirs.length} package directories`,
  );

  if (packageDirs.length === 0) {
    core.setFailed(`${inputs.package_dir} contains no packages.`);
    return;
  }

  core.info(
    `Found ${packageDirs.length} package(s) in /${inputs.package_dir}:`,
  );
  packageDirs.forEach((dir) => core.info(`- ${dir.name}`));

  const zipPath = path.join(BASE_DIR, "packages.zip");
  core.info(`Archiving packages to ${zipPath}...`);
  await zipDirectory(fullPackagePath, zipPath);

  core.info("Uploading packages to ECC...");
  const result = await eccHelper.uploadPackages(
    inputs.access_token,
    inputs.instance_name,
    TAGS,
    inputs.description,
    zipPath,
  );

  if (result.code >= 200 && result.code < 300) {
    core.notice(
      `Code: ${result.code} | Message: ${result.message} | Content: ${result.content}`,
    );
  } else {
    core.setFailed(
      `Code: ${result.code} | Message: ${result.message} | Content: ${result.content}`,
    );
  }
}

main();
