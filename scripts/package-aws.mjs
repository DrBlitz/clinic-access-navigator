import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, '.aws-package');
for (const dir of ['aws', 'lib']) await mkdir(resolve(out, dir), { recursive: true });
for (const file of ['aws/handler.mjs', 'lib/clinic-mcp.mjs', 'lib/clinic-routing.mjs']) await copyFile(resolve(root, file), resolve(out, file));
await copyFile(resolve(root, 'aws/template.yaml'), resolve(out, 'template.yaml'));
console.log('Prepared .aws-package/template.yaml; no AWS resources created.');
