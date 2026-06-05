/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import os from "node:os";

/** Default Sharp normalize pool size — capped to avoid memory spikes on large libraries. */
export function defaultNormalizeConcurrency(): number {
  const cpus = os.cpus().length || 4;
  return Math.max(1, Math.min(8, cpus));
}

/** Run async work over items with a fixed concurrency limit. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}
