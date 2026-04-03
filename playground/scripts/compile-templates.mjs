import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as markoCompiler from '@marko/compiler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));

const templatesDir = path.join(__dirname, 'src/templates');
const outputDir = path.join(__dirname, 'server/templates');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function compileTemplates() {
  const files = fs
    .readdirSync(templatesDir)
    .filter((f) => f.endsWith('.marko'));

  for (const file of files) {
    const inputPath = path.join(templatesDir, file);
    const outputPath = path.join(outputDir, file.replace('.marko', '.js'));

    console.log(`Compiling ${file}...`);

    const result = await markoCompiler.compileFile(inputPath, {
      translator: '@marko/runtime-tags/translator',
      modules: 'cjs',
      output: 'html',
      writeVersionComment: false,
    });

    let code = result.code;
    code = code.replace(
      /require\(['"](\.\/[^'"]+)\.marko(['"])\)/g,
      "require('$1.js')",
    );

    fs.writeFileSync(outputPath, code);
  }

  console.log('Templates compiled successfully!');
}

compileTemplates().catch(console.error);
