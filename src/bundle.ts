import esbuild from 'esbuild';
import { GasPlugin } from 'esbuild-gas-plugin';
import fs from 'fs';
import path from 'path';
import { Config } from './types.js';

export async function bundle(config: Required<Config>, watch = false) {
  const { appsScriptJsonPath, entryPoint, outputFile } = config;

  const bundleEntries = [entryPoint];

  const buildOptions = {
    entryPoints: bundleEntries,
    bundle: true,
    outfile: outputFile,
    plugins: [GasPlugin as any],
  };

  if (watch) {
    // Watch mode
    const context = await esbuild.context(buildOptions);
    await context.watch();

    // Initial build
    await context.rebuild();

    // Copy files after initial build
    copyFiles(config);

    console.log('👀 Watching for changes... (Press Ctrl+C to stop)');

    // Keep the process running
    process.on('SIGINT', () => {
      context.dispose();
      process.exit(0);
    });
  } else {
    // Normal build
    await esbuild.build(buildOptions);
    copyFiles(config);
  }
}

function copyFiles(config: Required<Config>) {
  const { appsScriptJsonPath, entryPoint, outputFile } = config;
  const distDir = path.dirname(outputFile);

  // Copy appsscript.json
  fs.copyFileSync(appsScriptJsonPath, path.join(distDir, 'appsscript.json'));

  // Copy HTML files to dist directory
  const entryDir = path.dirname(entryPoint);
  try {
    const htmlFiles = fs.readdirSync(entryDir).filter(file => file.endsWith('.html'));
    for (const htmlFile of htmlFiles) {
      fs.copyFileSync(path.join(entryDir, htmlFile), path.join(distDir, htmlFile));
    }
  } catch (error) {
    // Directory might not exist or be readable, ignore
  }
}
