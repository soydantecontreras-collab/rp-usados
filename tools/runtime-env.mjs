/** Keep Playground's temporary cleanup inside this suite's ignored workspace. */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
export async function isolatedRuntimeEnv(output) {
  const temp = resolve(output, 'tmp', randomUUID());
  await mkdir(temp, { recursive: true });
  return { ...process.env, TMP: temp, TEMP: temp, TMPDIR: temp };
}
