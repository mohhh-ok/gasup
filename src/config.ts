import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import { Config } from './types.js';

const configFileName = 'gasup.config.ts';

export const defaultConfig: Required<Config> = {
  entryPoint: 'src/index.ts',
  outputFile: 'dist/bundle.js',
  appsScriptJsonPath: 'appsscript.json',
};

export async function loadConfigWithDefault(): Promise<Required<Config>> {
  const configPath = path.join(process.cwd(), configFileName);
  const config = await loadConfig(configPath);
  return {
    entryPoint: config.entryPoint ?? defaultConfig.entryPoint,
    outputFile: config.outputFile ?? defaultConfig.outputFile,
    appsScriptJsonPath: config.appsScriptJsonPath ?? defaultConfig.appsScriptJsonPath,
  };
}

async function loadConfig(configPath: string): Promise<Config> {
  try {
    const configString = fs.readFileSync(configPath, 'utf-8');

    // メモリ上でTypeScriptをJavaScriptに変換
    const result = await esbuild.transform(configString, {
      loader: 'ts',
      format: 'esm',
    });

    // 動的にモジュールとして実行
    const moduleCode = result.code;
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`;
    const data = await import(moduleUrl);

    return data.default;
  } catch (err: any) {
    return {};
  }
}
