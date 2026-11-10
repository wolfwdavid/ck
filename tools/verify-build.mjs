import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BUILD = 'build';
const BASE = '/ck';
let failed = false;
const check = (ok, label) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
	if (!ok) failed = true;
};

console.log(`verify-build: checking build/ for GitHub Pages at ${BASE}/ (build with BASE_PATH=${BASE})\n`);

const index = join(BUILD, 'index.html');
check(existsSync(index), 'build/index.html exists');
check(existsSync(join(BUILD, '404.html')), 'build/404.html exists');
check(existsSync(join(BUILD, '.nojekyll')), 'build/.nojekyll exists');

const html = existsSync(index) ? readFileSync(index, 'utf8') : '';
check(html.includes(`${BASE}/_app/`), `index.html references ${BASE}/_app/ (BASE_PATH applied)`);
check(!html.includes('"/_app/'), 'index.html has no root-absolute "/_app/ references');

console.log(failed ? '\nverify-build: FAILED' : '\nverify-build: PASSED');
process.exit(failed ? 1 : 0);
