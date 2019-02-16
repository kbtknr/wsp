const path = require('path');
const Config = require('webpack-chain');
const { VueLoaderPlugin } = require('vue-loader');
const CSSExtractPlugin = require('mini-css-extract-plugin');
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')

const publicPath = '/';  // TODO
const defaultInlineLimit = 1024;
const defaultPostcss = {};

function baseConfig(isServer, isProd, isDebug, outDir, internalDir, inlineLimit, postcss) {
  inlineLimit = inlineLimit || defaultInlineLimit;
  if (postcss) {
    postcss = Object.assign({}, defaultPostcss, postcss);
  }

  const config = new Config();

  config
    .mode(isProd && !isDebug ? 'production' : 'development')
    .output
      .path(outDir)
      .filename(isProd ? 'assets/js/[name].[chunkhash:8].js' : 'assets/js/[name].js')
      .publicPath(isProd ? publicPath : '/');

  if (isDebug) {
    config.devtool('source-map');
  } else if (!isProd) {
    config.devtool('cheap-module-eval-source-map');
  }

  config.resolve
    .set('symlinks', true)
    .extensions
      .merge(['.js', '.vue'])
      .end()
    .modules
      .add('node_modules')
      .end()
    .alias
      .set('@meta-mixin', path.resolve(__dirname, '../app', isServer ? 'meta-mixin-server.js' : 'meta-mixin-client.js'))
      .set('@internal', internalDir);

  config.resolveLoader
    .set('symlinks', true)
    .modules
      .add('node_modules');

  config.module
    .noParse(/^(vue|vue-router|vuex|vuex-router-sync)$/);

  function applyVuePipeline(rule) {
    rule
      .use('vue-loader')
        .loader('vue-loader')
        .options({
          compilerOptions: {
            preserveWhitespace: true
          }
        });
  }
  const vueRule = config.module
    .rule('vue')
      .test(/\.vue$/);
  applyVuePipeline(vueRule);

  const mdRule = config.module
    .rule('markdown')
      .test(/\.md$/);
  applyVuePipeline(mdRule);
  mdRule.use('markdown-loader')
    .loader(require.resolve('./markdown-loader'))
    .options();

  config.module
    .rule('js')
      .test(/\.js$/)
      .exclude.add(filePath => {
        // // Always transpile lib directory
        // if (filePath.startsWith(libDir)) {
        //   return false
        // }
        // // always transpile js in vue files
        // if (/\.vue\.js$/.test(filePath)) {
        //   return false
        // }

        // Don't transpile node_modules
        return /node_modules/.test(filePath)
      }).end()
      .use('babel-loader')
        .loader('babel-loader')
        .options({
          // do not pick local project babel config (.babelrc)
          babelrc: false,
          // do not pick local project babel config (babel.config.js)
          // ref: http://babeljs.io/docs/en/config-files
          configFile: false,
          presets: [
            require.resolve('@vue/babel-preset-app')
          ]
        });

  config.module
    .rule('images')
      .test(/\.(png|jpe?g|gif)(\?.*)?$/)
      .use('url-loader')
        .loader('url-loader')
        .options({
          limit: inlineLimit,
          name: `assets/img/[name].[hash:8].[ext]`
        });

  // do not base64-inline SVGs.
  // https://github.com/facebookincubator/create-react-app/pull/1180
  config.module
    .rule('svg')
      .test(/\.(svg)(\?.*)?$/)
      .use('file-loader')
        .loader('file-loader')
        .options({
          name: `assets/img/[name].[hash:8].[ext]`
        });

  config.module
    .rule('media')
      .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
      .use('url-loader')
        .loader('url-loader')
        .options({
          limit: inlineLimit,
          name: `assets/media/[name].[hash:8].[ext]`
        });

  config.module
    .rule('fonts')
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .use('url-loader')
        .loader('url-loader')
        .options({
          limit: inlineLimit,
          name: `assets/fonts/[name].[hash:8].[ext]`
        });

  const cssRule = config.module.rule('css').test(/\.css$/);
  const cssModulesRule = cssRule.oneOf('modules').resourceQuery(/module/);
  const cssNormalRule = cssRule.oneOf('normal');

  applyLoaders(cssModulesRule, true);
  applyLoaders(cssNormalRule, false);
  function applyLoaders (rule, modules) {
    if (!isServer) {
      if (isProd) {
        rule.use('extract-css-loader').loader(CSSExtractPlugin.loader);
      } else {
        rule.use('vue-style-loader').loader('vue-style-loader');
      }
    }

    rule.use('css-loader')
      .loader(isServer ? 'css-loader/locals' : 'css-loader')
      .options({
        modules,
        localIdentName: `[local]_[hash:base64:8]`,
        importLoaders: 1,
        sourceMap: !isProd
      });

    rule.use('postcss-loader').loader('postcss-loader').options(Object.assign({
      plugins: [require('autoprefixer')],
      sourceMap: !isProd
    }, postcss));
  }

  config
    .plugin('vue-loader')
    .use(VueLoaderPlugin);

  if (isProd && !isServer) {
    config
      .plugin('extract-css')
      .use(CSSExtractPlugin, [{
        filename: 'assets/css/styles.[chunkhash:8].css'
      }]);

    // ensure all css are extracted together.
    // since most of the CSS will be from the theme and very little
    // CSS will be from async chunks
    config.optimization.splitChunks({
      cacheGroups: {
        styles: {
          name: 'styles',
          // necessary to ensure async chunks are also extracted
          test: m => /css-extract/.test(m.type),
          chunks: 'all',
          enforce: true
        }
      }
    });
  }

  return config
}
function createClientConfig(entryFilePath, isProd, isDebug, outDir, internalDir, inlineLimit, postcss) {
  const config = baseConfig(false, isProd, isDebug, outDir, internalDir, inlineLimit, postcss);

  config
    .entry('app')
      .add(entryFilePath);

  config.node
    .merge({
      // prevent webpack from injecting useless setImmediate polyfill because Vue
      // source contains it (although only uses it if it's native).
      setImmediate: false,
      global: false,
      process: false,
      // prevent webpack from injecting mocks to Node native modules
      // that does not make sense for the client
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty'
    });

  if (isProd) {
    // This is a temp build of vue-server-renderer/client-plugin.
    // TODO Switch back to original after problems are resolved.
    // Fixes two things:
    // 1. Include CSS in preload files
    // 2. filter out useless styles.xxxxx.js chunk from mini-css-extract-plugin
    // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85
    config
      .plugin('ssr-client')
      .use(require('./ClientPlugin'), [{
        filename: 'manifest/client.json'
      }]);

    config
      .plugin('optimize-css')
      .use(require('optimize-css-assets-webpack-plugin'), [{
        canPrint: false,
        cssProcessorOptions: {
          safe: true,
          autoprefixer: { disable: true },
          mergeLonghand: false
        }
      }]);
  }

  return config;
}
function createServerConfig(entryFilePath, isProd, isDebug, outDir, internalDir, inlineLimit, postcss) {
  const config = baseConfig(true, isProd, isDebug, outDir, internalDir, inlineLimit, postcss);

  config
    .target('node')
    .externals([/^vue|vue-router$/])
    .devtool('source-map');

  config.optimization.minimize(false);

  config
    .entry('app')
      .add(entryFilePath);

  config.output
    .filename('server-bundle.js')
    .libraryTarget('commonjs2');

  config
    .plugin('ssr-server')
    .use(VueSSRServerPlugin, [{
      filename: 'manifest/server.json'
    }]);

  // const publicDir = path.resolve(sourceDir, '.vuepress/public')
  // if (fs.existsSync(publicDir)) {
  //   config
  //     .plugin('copy')
  //     .use(CopyPlugin, [[
  //       { from: publicDir, to: outDir }
  //     ]])
  // }

  return config;
}

module.exports = {
  createClientConfig,
  createServerConfig,
};
