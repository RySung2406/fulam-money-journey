import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
function check(directory) {
  for (const file of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, file.name);
    if (file.isDirectory()) check(path);
    else if (file.name.endsWith('.js') && !file.name.endsWith('.bundle.js')) execFileSync(process.execPath, ['--check', path], { stdio: 'inherit' });
  }
}
check('site');
