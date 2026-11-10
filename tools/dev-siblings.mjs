import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const port = Number(process.env.PORT ?? 8743);
const types = {
	'.html': 'text/html; charset=utf-8',
	'.json': 'application/json',
	'.csv': 'text/csv; charset=utf-8',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.pdf': 'application/pdf'
};

createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Cache-Control', 'no-store');
	const url = new URL(req.url ?? '/', 'http://x');
	let file = join(root, normalize(decodeURIComponent(url.pathname)));
	if (!file.startsWith(root)) {
		res.writeHead(403).end();
		return;
	}
	try {
		if (statSync(file).isDirectory()) file = join(file, 'index.html');
		statSync(file);
	} catch {
		res.writeHead(404).end('not found');
		return;
	}
	res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
	createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${root} with CORS at http://localhost:${port}/`));
