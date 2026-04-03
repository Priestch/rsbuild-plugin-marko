import type { RsbuildPluginAPI } from '@rsbuild/core';
import MarkoRspackPlugin, {
  type MarkoPluginOptions,
} from '../tools/MarkoRspackPlugin';

const PLUGIN_MARKO_NAME = 'rsbuild:marko';

const pluginMarko = (options: MarkoPluginOptions = {}) => {
  const markoRspackPlugin = new MarkoRspackPlugin(options);

  return {
    name: PLUGIN_MARKO_NAME,
    setup: (api: RsbuildPluginAPI) => {
      markoRspackPlugin.setup(api);

      let serverApplied = false;
      let browserApplied = false;

      api.modifyRspackConfig((config, { target }) => {
        config.plugins = config.plugins || [];

        const applyServerPlugin = () => {
          if (serverApplied) {
            return;
          }

          console.log('Applying MarkoRspackServerPlugin for node target');
          config.plugins.push({
            name: 'MarkoRspackServerPlugin',
            apply(compiler) {
              markoRspackPlugin.serverApply(compiler);
            },
          });
          serverApplied = true;
        };

        const applyBrowserPlugin = () => {
          if (browserApplied) {
            return;
          }

          console.log('Applying MarkoRspackBrowserPlugin for web target');
          config.plugins.push({
            name: 'MarkoRspackBrowserPlugin',
            apply(compiler) {
              markoRspackPlugin.browserApply(compiler);
            },
          });
          browserApplied = true;
        };

        if (target === 'node') {
          applyServerPlugin();
        } else if (target === 'web') {
          applyBrowserPlugin();
        } else {
          applyServerPlugin();
          applyBrowserPlugin();
        }

        return config;
      });

      console.log('Marko plugin initialized.');
    },
  };
};

export { PLUGIN_MARKO_NAME, pluginMarko };
