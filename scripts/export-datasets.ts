import { generateCrescents } from '../src/shared-utils';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Generating crescent dataset...');
const data = generateCrescents();

const output = {
  points: data.map(d => ({
    x1: d.x1,
    x2: d.x2,
    y: d.y
  }))
};

const outputDir = path.join(__dirname, '../python/datasets');
const outputPath = path.join(outputDir, 'crescent.json');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Exported ${data.length} points to ${outputPath}`);
