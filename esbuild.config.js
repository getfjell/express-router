import { build } from 'esbuild';
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// Get all TypeScript files from src directory recursively
function getAllTsFiles(dir, baseDir = dir) {
  const files = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllTsFiles(fullPath, baseDir));
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(relative(baseDir, fullPath));
    }
  }

  return files;
}

const entryPoints = getAllTsFiles('./src');

await build({
  entryPoints: entryPoints.map(file => `./src/${file}`),
  bundle: false,
  outdir: './dist',
  format: 'esm',
  target: 'es2022',
  platform: 'node',
  sourcemap: true,
  minify: false,
  preserveSymlinks: false,
  outExtension: {
    '.js': '.js'
  },
  metafile: true
}).then(() => {
  console.log('✅ Build completed successfully');
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
