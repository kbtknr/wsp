const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('events');

const webpack = require('webpack');
const WebpackConfig = require('webpack-chain');
const middleware = require('webpack-dev-middleware');
const { VueLoaderPlugin } = require('vue-loader');
const CSSExtractPlugin = require('mini-css-extract-plugin');
const { createBundleRenderer } = require('vue-server-renderer');
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');

const SiteConfig = require('./site-config.js');
const Errors = require('./errors.js');

const defaultIndexNames = ['index.vue', 'index.md'];
const routesAlias = '@routes';
const defaultMasterPageAlias = '@default-master-page';
const defaultMarkdownWrapperAlias = '@default-markdown-wrapper';
const assetsAlias = '@assets';
const componentsAlias = '@components';
const masterPagesAlias = '@master-pages';
const pagesAlias = '@pages';
const headMixinAlias = '@head-mixin';
const appDir = path.join(__dirname, '../app');

function compile(configs) {
  return new Promise((resolve, reject) => {
    webpack(configs, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}
async function ensureSymlink(src, dest) {
  if (await fs.pathExists(dest)) {
    await fs.unlink(dest);
  }
  await fs.symlink(src, dest);
}
async function listDirent(dirname, exts, includeDirectory) {
  try {
    const dirents = await fs.readdir(dirname, {
      withFileTypes: true,
    });

    const entries = [];
    dirents.forEach(dirent => {
      const name = dirent.name;
      const isDirectory = dirent.isDirectory();
      const extname = isDirectory ? null : path.extname(name).toLowerCase();

      if (!includeDirectory && isDirectory) {
        return;
      }
      if (extname && exts && !exts.includes(extname)) {
        return;
      }
      entries.push({
        name: name,
        extname: extname,
        isDirectory: isDirectory,
      });
    });
    return entries;
  } catch(err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
      throw Errors.ItemNotFound;
    }
    throw err;
  }
}
class Site extends EventEmitter {
  constructor(siteConfigPath) {
    super();

    this.config = new SiteConfig(siteConfigPath);
    this.tmpDir = null;
    this.routesFile = null;
    this.internalDir = null;
    this.pages = null;
    this.masterPages = null;
  }

  get homeDir() {
    return path.dirname(this.config.configPath);
  }

  load() {
    this.config.load();
  }

  async listAssets(pathName) {
    if (!path.isAbsolute(pathName)) {
      throw Errors.PathIsNotAbsolute;
    }

    const dirname = path.join(this.config.assetsDir, pathName.substring(1));
    return await listDirent(dirname, null, true);
  }
  async listMarkdownLoaders() {
    const dirname = path.join(this.config.markdownLoadersDir);
    return await listDirent(dirname, ['.js'], false);
  }
  async listComponents() {
    const dirname = path.join(this.config.componentsDir);
    return await listDirent(dirname, ['.vue'], false);
  }
  async listMasterPages() {
    const dirname = this.config.masterPagesDir;
    return await listDirent(dirname, ['.vue'], false);
  }
  async listPages(pathName) {
    if (!path.isAbsolute(pathName)) {
      throw Errors.PathIsNotAbsolute;
    }

    const dirname = path.join(this.config.pagesDir, pathName.substring(1));
    return await listDirent(dirname, ['.vue', '.md'], true);
  }

  async readyBuild() {
    if (this.tmpDir != null) {
      return;
    }

    this.tmpDir = path.join(this.homeDir, '.tmp');
    await fs.ensureDir(this.tmpDir);
    await this.generateRoutesFile(path.join(this.tmpDir, 'routes.js'), pagesAlias);

    await ensureSymlink(this.config.defaultMasterPageFile, path.join(this.tmpDir, 'default-master-page.vue'));
    await ensureSymlink(this.config.defaultMarkdownWrapperFile, path.join(this.tmpDir, 'default-markdown-wrapper.vue'));
  }
  async unreadyBuild() {
    if (this.tmpDir == null) {
      return;
    }
    await fs.unlink(path.join(this.tmpDir, 'default-master-page.vue'));
    await fs.unlink(path.join(this.tmpDir, 'default-markdown-wrapper.vue'));
    await fs.unlink(path.join(this.tmpDir, 'routes.js'));
    this.tmpDir = null;
  }

  findDefaultIndex(nodes, names) {
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j].name === name) {
          return nodes[j];
        }
      }
    }
    return null;
  }
  generateRoutePageCode({ urlPath, componentPath, alias }) {
    if (typeof urlPath !== 'string' || typeof componentPath !== 'string') {
      return null;
    }

    urlPath = JSON.stringify(urlPath);
    componentPath = JSON.stringify(componentPath);
    if (alias == null) {
      alias = '';
    } else {
      alias = `alias: ${JSON.stringify(alias)},`;
    }
    return `
      {
        path: ${urlPath},
        component: () => import(${componentPath}),
        ${alias}
      }
    `;
  }
  generateRouteDirectoryCode({ urlPath, childrenCode }) {
    urlPath = JSON.stringify(urlPath);

    return `
      {
        path: ${urlPath},
        component: {
          render(c) { return c('router-view') }
        },
        children: [
          ${childrenCode}
        ]
      }
    `;
  }
  async generateRoutesCode(urlName, urlDir, importDir) {
    const nodes = await this.listPages(urlDir);
    const defaultNode = this.findDefaultIndex(nodes, defaultIndexNames);

    const routesCode = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const name = node.name;

      if (node.isDirectory) {
        routesCode.push(await this.generateRoutesCode(name, path.join(urlDir, name), path.join(importDir, name)));
      } else {
        const extname = path.extname(name);
        const basename = path.basename(name, extname);
        const urlPath = basename;
        const componentPath = path.join(importDir, name);
        const alias = node === defaultNode ? [''] : null;

        routesCode.push(
          this.generateRoutePageCode({
            urlPath,
            componentPath,
            alias,
          })
        );
      }
    }
    return this.generateRouteDirectoryCode({
      urlPath: urlName,
      childrenCode: routesCode.join(','),
    });
  }
  async generateRoutes(rootAlias) {
    const routesCode = await this.generateRoutesCode('/', '/', rootAlias);
    return `
      export default [
        ${[routesCode].join(',')}
      ];
    `;
  }
  async generateRoutesFile(filename, rootAlias) {
    const routesCode = await this.generateRoutes(rootAlias);
    await fs.writeFile(filename, routesCode);
  }

  createBaseConfig(isServer, isProd, isDebug, entryFilePath, outDir) {
    const inlineLimit = this.config.inlineLimit;
    const postcssImportPath = this.config.postcssImportFile;

    const config = new WebpackConfig();
    config.entry('app').add(entryFilePath);
    config
      .mode(isProd && !isDebug ? 'production' : 'development')
      .output.path(outDir)
      .filename(isProd ? '_assets/js/[name].[chunkhash:8].js' : '_assets/js/[name].js')
      .publicPath('/');

    if (isDebug) {
      config.devtool('source-map');
    } else if (!isProd) {
      config.devtool('cheap-module-eval-source-map');
    }

    config.resolve
      .set('symlinks', true)
      .extensions.merge(['.js', '.vue'])
      .end()
      .modules.add(path.join(__dirname, '../node_modules'))
      .end()
      .alias.set(headMixinAlias, path.join(appDir, isServer ? 'head-mixin-server.js' : 'head-mixin-client.js'))
      .set(routesAlias, path.join(this.tmpDir, 'routes.js'))
      .set(defaultMasterPageAlias, path.join(this.tmpDir, 'default-master-page.vue'))
      .set(defaultMarkdownWrapperAlias, path.join(this.tmpDir, 'default-markdown-wrapper.vue'))
      .set(assetsAlias, this.config.assetsDir)
      .set(componentsAlias, this.config.componentsDir)
      .set(masterPagesAlias, this.config.masterPagesDir)
      .set(pagesAlias, this.config.pagesDir);

    config.resolveLoader.set('symlinks', true).modules.add(path.join(__dirname, '../node_modules'));

    config.module.noParse(/^(vue|vue-router|vuex|vuex-router-sync)$/);

    config.module
      .rule('head')
      .resourceQuery(/blockType=head/)
      .use('head-loader')
      .loader(require.resolve(path.join(__dirname, 'head-loader')));

    function applyVuePipeline(rule) {
      rule
        .use('vue-loader')
        .loader('vue-loader')
        .options({
          compilerOptions: {
            preserveWhitespace: true,
          },
        });
    }
    const vueRule = config.module.rule('vue').test(/\.vue$/);
    applyVuePipeline(vueRule);

    const mdRule = config.module.rule('markdown').test(/\.md$/);
    applyVuePipeline(mdRule);
    mdRule
      .use('markdown-loader')
      .loader(require.resolve(path.join(__dirname, './markdown-loader')))
      .options({
        containerLoadersDir: this.config.markdownLoadersDir,
      });

    config.module
      .rule('js')
      .test(/\.js$/)
      .exclude.add(filePath => {
        // Don't transpile node_modules
        return /node_modules/.test(filePath);
      })
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .options({
        // do not pick local project babel config (.babelrc)
        babelrc: false,
        // do not pick local project babel config (babel.config.js)
        // ref: http://babeljs.io/docs/en/config-files
        configFile: false,
        presets: [require.resolve('@vue/babel-preset-app')],
      });

    config.module
      .rule('images')
      .test(/\.(png|jpe?g|gif)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: inlineLimit,
        name: `_assets/img/[name].[hash:8].[ext]`,
      });

    // do not base64-inline SVGs.
    // https://github.com/facebookincubator/create-react-app/pull/1180
    config.module
      .rule('svg')
      .test(/\.(svg)(\?.*)?$/)
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: `_assets/img/[name].[hash:8].[ext]`,
      });

    config.module
      .rule('media')
      .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: inlineLimit,
        name: `_assets/media/[name].[hash:8].[ext]`,
      });

    config.module
      .rule('fonts')
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: inlineLimit,
        name: `_assets/fonts/[name].[hash:8].[ext]`,
      });

    const cssRule = config.module.rule('css').test(/\.css$/);
    const cssModulesRule = cssRule.oneOf('modules').resourceQuery(/module/);
    const cssNormalRule = cssRule.oneOf('normal');

    applyLoaders(cssModulesRule, true);
    applyLoaders(cssNormalRule, false);
    function applyLoaders(rule, modules) {
      if (!isServer) {
        if (isProd) {
          rule.use('extract-css-loader').loader(CSSExtractPlugin.loader);
        } else {
          rule.use('vue-style-loader').loader('vue-style-loader');
        }
      }

      rule
        .use('css-loader')
        .loader(isServer ? 'css-loader/locals' : 'css-loader')
        .options({
          modules,
          localIdentName: isProd && !isDebug ? `[hash:base64:5]` : `[local]_[hash:base64:8]`,
          importLoaders: 1,
          camelCase: true,
          sourceMap: !isProd,
        });

      rule
        .use('postcss-loader')
        .loader('postcss-loader')
        .options({
          plugins: [
            require('postcss-preset-env')({
              stage: 3,
              features: {
                'nesting-rules': true,
                'custom-selectors': true,
                'custom-media-queries': true,
              },
              preserve: false,
              importFrom: postcssImportPath ? [postcssImportPath] : null,
            }),
          ],
          sourceMap: !isProd,
        });
    }

    config.plugin('vue-loader').use(VueLoaderPlugin);

    if (isProd && !isServer) {
      config.plugin('extract-css').use(CSSExtractPlugin, [
        {
          filename: '_assets/css/styles.[chunkhash:8].css',
        },
      ]);

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
            enforce: true,
          },
        },
      });
    }

    return config;
  }
  createClientConfig(isProd, isDebug, outDir) {
    const entryFilePath = path.join(appDir, 'client-entry.js');
    const config = this.createBaseConfig(false, isProd, isDebug, entryFilePath, outDir);

    config.node.merge({
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
      child_process: 'empty',
    });

    if (isProd) {
      // This is a temp build of vue-server-renderer/client-plugin.
      // TODO Switch back to original after problems are resolved.
      // Fixes two things:
      // 1. Include CSS in preload files
      // 2. filter out useless styles.xxxxx.js chunk from mini-css-extract-plugin
      // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85
      config.plugin('ssr-client').use(require(path.join(__dirname, './ClientPlugin')), [
        {
          filename: '_manifest/client.json',
        },
      ]);

      config.plugin('optimize-css').use(require('optimize-css-assets-webpack-plugin'), [
        {
          canPrint: false,
          cssProcessorOptions: {
            safe: true,
            autoprefixer: { disable: true },
            mergeLonghand: false,
          },
        },
      ]);
    }
    return config;
  }
  createServerConfig(isProd, isDebug, outDir) {
    const entryFilePath = path.join(appDir, 'server-entry.js');
    const config = this.createBaseConfig(true, isProd, isDebug, entryFilePath, outDir);

    config
      .target('node')
      .externals([/^vue|vue-router$/])
      .devtool('source-map');

    config.optimization.minimize(false);

    config.output.filename('server-bundle.js').libraryTarget('commonjs2');

    config.plugin('ssr-server').use(VueSSRServerPlugin, [
      {
        filename: '_manifest/server.json',
      },
    ]);
    return config;
  }

  async build(outDir, isDebug = false) {
    const clientConfig = this.createClientConfig(true, isDebug, outDir);
    const serverConfig = this.createServerConfig(true, isDebug, outDir);
    const stats = await compile([clientConfig.toConfig(), serverConfig.toConfig()]);

    if (stats.hasErrors()) {
      this.emit('webpack-errors', stats);
      throw new Error('Failed to compile with errors.');
    } else if (stats.hasWarnings()) {
      this.emit('webpack-warnings', stats);
    }

    const manifestDir = path.join(outDir, '_manifest');
    const serverBundle = require(path.join(manifestDir, 'server.json'));
    const clientManifest = require(path.join(manifestDir, 'client.json'));
    await fs.remove(manifestDir);

    const template = await fs.readFile(path.join(__dirname, './index.template.html'), {
      encoding: 'utf8',
    });
    const renderer = createBundleRenderer(serverBundle, {
      clientManifest,
      runInNewContext: false,
      inject: false,
      shouldPrefetch: () => true,
      template,
    });
    await this.renderPages(renderer, '/', outDir);
  }
  async renderPages(renderer, urlDir, outDir) {
    const nodes = await this.listPages(urlDir);
    await fs.ensureDir(outDir);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const name = node.name;

      if (node.isDirectory) {
        await this.renderPages(renderer, path.join(urlDir, name), path.join(outDir, name));
      } else {
        const extname = path.extname(name);
        const basename = path.basename(name, extname);
        const outFile = path.join(outDir, `${basename}.html`);
        const pathname = path.join(urlDir, basename);
        try {
          await this.renderPage(renderer, pathname, outFile);
        } catch (e) {
          this.emit('rendering-error', pathname, e);
          continue;
        }
        this.emit('rendering-page', pathname, outFile);
      }
    }
  }
  async renderPage(renderer, pathname, outFile) {
    const context = {
      url: pathname,
      headData: {},
    };
    const html = await renderer.renderToString(context);
    await fs.writeFile(outFile, html);
  }

  serve(app, isDebug = false) {
    const outDir = path.resolve(this.tmpDir, 'dev-dist');
    const clientConfig = this.createClientConfig(false, isDebug, outDir);
    clientConfig.plugin('html').use(require('html-webpack-plugin'), [
      {
        filename: 'index.html',
        template: path.join(__dirname, 'index.dev.html'),
      },
    ]);

    const config = clientConfig.toConfig();
    const compiler = webpack(config);

    compiler.hooks.compile.tap('site', compilationParams => {
      this.emit('webpack-compile');
    });
    compiler.hooks.done.tap('site', stats => {
      if (stats.hasErrors()) {
        this.emit('webpack-errors', stats);
      } else if (stats.hasWarnings()) {
        this.emit('webpack-warnings', stats);
      }
      this.emit('webpack-done', stats);
    });
    compiler.hooks.failed.tap('site', error => {
      this.emit('webpack-failed', error);
    });
    app.use(
      middleware(compiler, {
        // webpack-dev-middleware options
        // publicPath: path.resolve(__dirname, 'dist'),
        publicPath: config.output.publicPath,
        logLevel: 'silent',
        index: 'index.html',
      })
    );
    app.use('*', function(req, res) {
      const filename = path.join(compiler.outputPath, 'index.html');
      compiler.outputFileSystem.readFile(filename, function(err, result) {
        if (err) {
          res.status(500);
          res.end();
          return;
        }
        res.set('content-type', 'text/html');
        res.send(result);
        res.end();
      });
    });
  }

  watch() {
    this.config.watch();
    this.config.on('change', () => {});
    this.config.on('error', err => {});
  }
  unwatch() {
    this.config.removeAllListeners();
    this.config.unwatch();
  }
}
module.exports = Site;
