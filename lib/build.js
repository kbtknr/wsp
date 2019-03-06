const path = require('path');
const prepare = require('./prepare');
const fs = require('fs-extra');
const { createBundleRenderer } = require('vue-server-renderer');
const { createClientConfig, createServerConfig } = require('./webpack');

module.exports = async function({ siteConfigPath, tmpDir, outDir, isDebug }) {
  if (outDir == null) {
    outDir = path.join(path.dirname(siteConfigPath), '.dist');
  }
  outDir = path.resolve(outDir);

  const site = await prepare(siteConfigPath, tmpDir);

  const inlineLimit = site.config.build && site.config.build.inlineLimit;
  const postcss = site.config.build && site.config.build.postcss;
  const internalDir = site.internalDir;
  const clientConfig = createClientConfig(
    path.resolve(__dirname, '../app/client-entry.js'),
    true,
    false,
    outDir,
    internalDir,
    inlineLimit,
    postcss
  );
  const serverConfig = createServerConfig(
    path.resolve(__dirname, '../app/server-entry.js'),
    true,
    false,
    outDir,
    internalDir,
    inlineLimit,
    postcss
  );

  const stats = await compile([clientConfig.toConfig(), serverConfig.toConfig()]);

  const serverBundle = require(path.join(outDir, 'manifest/server.json'));
  const clientManifest = require(path.join(outDir, 'manifest/client.json'));

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

  await renderPages('', outDir, site.pages, renderer);
  await renderPage('/.404', path.resolve(outDir, '.404'), renderer);
};

function compile(configs, isDebug) {
  const webpack = require('webpack');
  return new Promise((resolve, reject) => {
    webpack(configs, (err, stats) => {
      if (err) {
        return reject(err);
      }
      if (stats.hasErrors()) {
        stats.toJson().errors.forEach(err => {
          console.error(err);
        });
        reject(new Error(`Failed to compile with errors.`));
        return;
      }
      if (isDebug && stats.hasWarnings()) {
        stats.toJson().warnings.forEach(warning => {
          console.warn(warning);
        });
      }
      resolve(stats.toJson({ modules: false }));
    });
  });
}

async function renderPages(dirname, outDir, nodes, renderer) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.children) {
      const pathname = path.join(dirname, node.name);
      await fs.ensureDir(path.resolve(outDir, pathname));
      await renderPages(pathname, outDir, node.children, renderer);
    } else {
      const basename = path.basename(node.name, path.extname(node.name));
      const pathname = path.join(dirname, basename);
      const outFile = path.resolve(outDir, `${pathname}.html`);
      try {
        await renderPage(pathname, outFile, renderer);
      } catch(e) {
        console.error(`Error rendering page '${pathname}'`, e);
      }
    }
  }
}

async function renderPage(pathname, outFile, renderer) {
  const context = {
    url: path.join('/', pathname),
    headData: {}
  };
  const html = await renderer.renderToString(context);
  console.log(`renderPage(${pathname}) => ${outFile}`);
  await fs.writeFile(outFile, html);
}
