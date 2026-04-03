import { fileURLToPath } from 'node:url';

import type { RsbuildPluginAPI } from '@rsbuild/core';
import { sources } from '@rspack/core';
import type {
  Compilation as CompilationType,
  Compiler as CompilerType,
  Configuration,
} from '@rspack/core';
import moduleName from '../helpers/module-name';

interface ResolvablePromise<T> extends Promise<T> {
  resolve(value: T): void;
}

interface ResourceModule {
  resource?: string;
}

declare module '@rspack/core' {
  interface Compiler {
    watching?: Compiler['watching'];
    markoAssetsPending?: ResolvablePromise<void>;
    markoEntriesPending?: ResolvablePromise<void>;
  }
}

export interface MarkoPluginOptions {
  isBrowser?: boolean;
  runtimeId?: string;
}

export default class MarkoRspackPlugin {
  private options: MarkoPluginOptions;
  private serverCompiler: CompilerType | null = null;
  private browserCompilers: CompilerType[] = [];
  private clientEntries: Record<string, string> = {};
  private clientAssets: Record<
    string,
    Record<string, Record<string, string[]>>
  > = {};
  private rsbuildApi: RsbuildPluginAPI | null = null;

  constructor(options: MarkoPluginOptions = {}) {
    this.options = { ...options };

    if (this.options.runtimeId) {
      this.options.runtimeId = this.normalizeRuntimeId(this.options.runtimeId);
    }
  }

  browserApply(compiler: CompilerType) {
    this.browserCompilers.push(compiler);
    this.applyBrowser(compiler);
    this.setupRules(compiler);
    compiler.options.entry = this.getEntryPoints(compiler);
  }

  serverApply(compiler: CompilerType) {
    this.serverCompiler = compiler;
    this.applyServer(compiler);
    this.setupRules(compiler);
    compiler.options.entry = this.getEntryPoints(compiler);
  }

  setup(api: RsbuildPluginAPI) {
    this.rsbuildApi = api;
  }

  private getEntryPoints(compiler: CompilerType): Configuration['entry'] {
    if (!this.rsbuildApi) {
      throw new Error('Rsbuild API not initialized');
    }

    const rsbuildConfig = this.rsbuildApi.getRsbuildConfig();
    const environments = rsbuildConfig.environments || {};
    const source = rsbuildConfig.source || {};

    if (environments.node && environments.web) {
      if (compiler.options.target === 'node') {
        return environments.node.source.entry || {};
      }

      return environments.web.source.entry || {};
    }

    if (environments.node) {
      return environments.node.source.entry || {};
    }

    if (environments.web) {
      return environments.web.source.entry || {};
    }

    return source.entry || {};
  }

  private setupRules(compiler: CompilerType) {
    const target = compiler.options.target;
    const isBrowser =
      target === 'web' || (Array.isArray(target) && target.includes('web'));
    const loaderPath = fileURLToPath(
      new URL('../dist/marko-loader.js', import.meta.url),
    );

    compiler.options.module = compiler.options.module || { rules: [] };
    compiler.options.module.rules = compiler.options.module.rules || [];

    compiler.options.module.rules.push(
      {
        test: /\.marko$/,
        type: 'javascript/auto',
        use: [
          {
            loader: loaderPath,
            options: {
              translator: '@marko/runtime-tags/translator',
              modules: 'esm',
              output: isBrowser ? 'dom' : 'html',
              babelConfig: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      targets: isBrowser ? 'defaults' : { node: 'current' },
                    },
                  ],
                ],
                plugins: [
                  [
                    '@babel/plugin-transform-runtime',
                    {
                      regenerator: true,
                    },
                  ],
                ],
                comments: false,
                compact: false,
                babelrc: false,
                configFile: false,
                browserslistConfigFile: false,
              },
              sourceMaps: true,
            },
          },
        ],
      },
      {
        test: /\.(jpg|jpeg|gif|png|svg)$/,
        type: 'asset',
      },
    );
  }

  private applyServer(compiler: CompilerType) {
    compiler.markoEntriesPending = this.createDeferredPromise<void>();
    this.serverCompiler = compiler;

    compiler.hooks.thisCompilation.tap(
      'MarkoRspackServer',
      (compilation: CompilationType) => {
        if (!this.options.runtimeId && compilation.outputOptions.uniqueName) {
          this.options.runtimeId = this.normalizeRuntimeId(
            compilation.outputOptions.uniqueName,
          );
        }

        compilation.hooks.finishModules.tap(
          'MarkoRspackServer:finishModules',
          (modules: Iterable<ResourceModule>) => {
            let hasChangedEntries = false;
            const removedEntryIds = new Set(Object.keys(this.clientEntries));

            for (const mod of modules) {
              const resource = mod.resource;
              if (!resource?.endsWith('.marko?server-entry')) {
                continue;
              }

              const filename = resource.replace(/\?server-entry$/, '');
              const entryTemplateId = moduleName(filename);

              if (!removedEntryIds.delete(entryTemplateId)) {
                hasChangedEntries = true;
                this.clientEntries[entryTemplateId] =
                  `${filename}?browser-entry`;
              }
            }

            for (const removedEntryId of removedEntryIds) {
              hasChangedEntries = true;
              delete this.clientEntries[removedEntryId];
              for (const compilerName in this.clientAssets) {
                delete this.clientAssets[compilerName][removedEntryId];
              }
            }

            if (hasChangedEntries) {
              for (const browserCompiler of this.browserCompilers) {
                browserCompiler.watching?.invalidate();
              }
            }
          },
        );

        compilation.hooks.processAssets.tapPromise(
          {
            name: 'MarkoRspackServer:processAssets',
            stage: -100,
          },
          async () => {
            try {
              await Promise.all(
                this.browserCompilers.map(
                  (browserCompiler) => browserCompiler.markoAssetsPending,
                ),
              );

              const clientAssets = this.sortKeys(this.clientAssets);
              let placeholderFound = false;

              for (const chunk of compilation.chunks) {
                if (!chunk.canBeInitial()) {
                  continue;
                }

                for (const file of chunk.files) {
                  compilation.updateAsset(file, (old: sources.Source) => {
                    const placeholder = 'MARKO_MANIFEST_PLACEHOLDER';
                    const placeholderPosition = old
                      .source()
                      .toString()
                      .indexOf(placeholder);

                    if (placeholderPosition < 0) {
                      return old;
                    }

                    placeholderFound = true;
                    const hasMultipleBuilds = this.browserCompilers.length > 1;
                    const defaultBuild =
                      this.browserCompilers.length > 0 &&
                      this.browserCompilers[0].name
                        ? clientAssets[this.browserCompilers[0].name] || {}
                        : {};

                    const content = hasMultipleBuilds
                      ? `{
            getAssets(entry, buildName) {
              const buildAssets = this.builds[buildName];
              if (!buildAssets) {
                throw new Error("Unable to load assets for build with a '$global.buildName' of '" + buildName + "'.");
              }
              return buildAssets[entry] || {};
            },
            builds: ${JSON.stringify(clientAssets)}
          }`
                      : `{
            getAssets(entry) {
              return this.build[entry] || {};
            },
            build: ${JSON.stringify(defaultBuild)}
          }`;

                    const newSource = new sources.ReplaceSource(old);
                    newSource.replace(
                      placeholderPosition,
                      placeholderPosition + placeholder.length - 1,
                      content,
                    );

                    return newSource;
                  });
                }
              }

              if (
                Object.keys(this.clientEntries).length > 0 &&
                !placeholderFound
              ) {
                throw new Error(
                  'Unable to inject the Marko manifest because the server bundle did not contain MARKO_MANIFEST_PLACEHOLDER.',
                );
              }
            } finally {
              compiler.markoEntriesPending?.resolve();
            }
          },
        );
      },
    );
  }

  private applyBrowser(compiler: CompilerType) {
    const compilerName = compiler.options.name || 'default';
    const entryOption = compiler.options.entry;

    compiler.options.entry = async () => {
      if (!this.serverCompiler) {
        throw new Error('Server compiler not initialized');
      }

      await this.serverCompiler.markoEntriesPending;

      const normalizedEntries: Record<string, { import: string[] }> = {};
      for (const key in this.clientEntries) {
        normalizedEntries[key] = {
          import: [this.clientEntries[key]],
        };
      }

      if (typeof entryOption === 'function') {
        const currentEntry = await entryOption();
        return { ...currentEntry, ...normalizedEntries };
      }

      if (typeof entryOption === 'object' && !Array.isArray(entryOption)) {
        return { ...entryOption, ...normalizedEntries };
      }

      return normalizedEntries;
    };

    compiler.hooks.make.tap(
      'MarkoRspackBrowser',
      (compilation: CompilationType) => {
        const pendingAssets = this.createDeferredPromise<void>();
        compiler.markoAssetsPending = pendingAssets;

        compilation.hooks.afterProcessAssets.tap(
          'MarkoRspackBrowser:afterProcessAssets',
          () => {
            for (const [entryName, entrypoint] of compilation.entrypoints) {
              const assetsByType: Record<string, string[]> = {};

              for (const chunk of entrypoint.chunks) {
                for (const file of chunk.files) {
                  const asset = compilation.getAsset(file);
                  if (!asset) {
                    continue;
                  }

                  const source = asset.source;
                  if (
                    source instanceof sources.RawSource &&
                    source.buffer().length === 0
                  ) {
                    compilation.deleteAsset(file);
                    continue;
                  }

                  const ext = file.split('.').pop() || '';
                  const type = assetsByType[ext] || [];
                  assetsByType[ext] = type;
                  type.push(file);
                }
              }

              const buildAssets = this.clientAssets[compilerName] || {};
              this.clientAssets[compilerName] = buildAssets;
              buildAssets[entryName] = assetsByType;
            }

            if (this.serverCompiler) {
              this.serverCompiler.watching?.invalidate();
            }

            pendingAssets.resolve();
          },
        );
      },
    );
  }

  private normalizeRuntimeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private createDeferredPromise<T>(): Promise<T> & {
    resolve: (value: T) => void;
  } {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
      resolve = r;
    }) as Promise<T> & { resolve: (value: T) => void };
    promise.resolve = resolve;
    return promise;
  }

  private sortKeys<T>(obj: T): T {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortKeys(item)) as T;
    }

    const entries = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(entries).sort()) {
      result[key] = this.sortKeys(entries[key]);
    }

    return result as T;
  }
}
