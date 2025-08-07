import fetch, { BodyInit } from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import * as core from "@actions/core";

interface ECCUploadResponse {
  code: number;
  message: string;
  content: string;
}

export async function uploadPackages(
  accessToken: string,
  instanceName: string,
  tags: string,
  description: string,
  zipFilePath: string,
): Promise<ECCUploadResponse> {
  core.debug(`Preparing to upload packages. Zip path: ${zipFilePath}`);

  const form = new FormData();
  form.append("instanceName", instanceName);
  form.append("tags", tags);
  form.append("description", description);
  form.append("file", fs.createReadStream(zipFilePath));

  core.debug(
    `Form data prepared with instanceName: ${instanceName}, tags: ${tags}`,
  );

  const response = await fetch(
    "https://console.lonti.com/api/v2/managed-hosting/deploy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...form.getHeaders(),
      },
      body: form as unknown as BodyInit,
    },
  );

  core.debug(`HTTP response status: ${response.status}`);

  const status = response.status;
  let responseBody: ECCUploadResponse | null = null;
  let rawText: string | null = null;

  try {
    responseBody = (await response.json()) as ECCUploadResponse;
    core.debug(`Response JSON parsed: ${JSON.stringify(responseBody)}`);
  } catch (error) {
    core.debug(
      `Response JSON parse failed: ${(error as Error).message}, reading as text`,
    );
    rawText = await response.text();
    core.debug(`Response raw text: ${rawText}`);
  }

  if (responseBody) {
    return responseBody;
  }

  return {
    code: status,
    message: rawText ? "Non-JSON error" : "Unknown error",
    content: rawText ?? "No response body available",
  };
}
