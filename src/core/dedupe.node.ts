/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";

const SAMPLE_BYTES = 64 * 1024;

export async function hashFileContent(filePath: string, fileSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    hash.update(String(fileSize));
    hash.update(filePath.split(/[/\\]/).pop() ?? "");

    const stream = createReadStream(filePath, { start: 0, end: SAMPLE_BYTES - 1 });
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex").slice(0, 16)));
  });
}

export async function hashFileFull(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex").slice(0, 16);
}
