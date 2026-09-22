import { createRequire } from 'node:module';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const runtimeRequire = createRequire(require.resolve('@wp-playground/cli'));
const { loadNodeRuntime } = await import(pathToFileURL(runtimeRequire.resolve('@php-wasm/node')));
const { PHP } = await import(pathToFileURL(runtimeRequire.resolve('@php-wasm/universal')));
const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: 1 } }));
let count = 0;
async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await checkDirectory(path);
    else if (entry.name.endsWith('.php')) {
      php.writeFile('/syntax-check.php', await readFile(path));
      const result = await php.run({ code: "<?php token_get_all(file_get_contents('/syntax-check.php'), TOKEN_PARSE); echo 'OK';" });
      if (result.text !== 'OK' || result.errors) throw new Error(path + ': ' + result.text + result.errors);
      count++;
    }
  }
}
try {
  await checkDirectory(resolve('theme/rp-usados'));
  console.log(`PHP 8.3: ${count} archivos sin errores de sintaxis.`);
} finally {
  php.exit();
}
