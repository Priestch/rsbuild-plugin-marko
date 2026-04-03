import fs from 'node:fs';
import * as markoCompiler from '@marko/compiler';
import type { LoaderContext } from '@rspack/core';

interface MarkoLoaderOptions {
  compiler?: string;
  translator?: string;
  modules?: 'esm' | 'cjs';
  output?: 'html' | 'dom' | 'hydrate';
  babelConfig?: any;
  virtualFiles?: boolean;
  sourceMaps?: boolean;
}

export default function markoLoader(
  this: LoaderContext<MarkoLoaderOptions>,
  source: string,
): void {
  const callback = this.async();
  const options = this.getOptions() || {};

  const filename = this.resourcePath;
  const outputFormat = options.output || 'dom';

  markoCompiler
    .compileFile(filename, {
      translator: options.translator || '@marko/runtime-tags/translator',
      modules: options.modules || 'esm',
      output: outputFormat,
      babelConfig: options.babelConfig,
      sourceMaps: options.sourceMaps ?? false,
      writeVersionComment: false,
      fileSystem: fs,
    })
    .then((result) => {
      callback(null, result.code, result.map as any);
    })
    .catch((err) => {
      callback(err as Error);
    });
}
