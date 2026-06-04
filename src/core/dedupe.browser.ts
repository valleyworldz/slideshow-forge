/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SAMPLE_BYTES = 64 * 1024;

export async function hashBrowserFile(file: File): Promise<string> {
  const slice = file.slice(0, Math.min(file.size, SAMPLE_BYTES));
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let h = 2166136261;
  const fnv = (n: number) => {
    h ^= n;
    h = Math.imul(h, 16777619);
  };
  fnv(file.size);
  for (let i = 0; i < file.name.length; i++) fnv(file.name.charCodeAt(i));
  for (let i = 0; i < bytes.length; i++) fnv(bytes[i]);
  return `w${(h >>> 0).toString(16)}-${file.size}`;
}
