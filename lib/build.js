const path = require('path');
const webpack = require('webpack');
const fs = require('fs-extra');
const api = require('../api');
const { createBundleRenderer } = require('vue-server-renderer');

module.exports = async function({ siteConfigPath, tmpDir, outDir, isDebug }) {
  if (outDir == null) {
    outDir = path.join(path.dirname(siteConfigPath), '.dist');
  }
  outDir = path.resolve(outDir);

  const site = new api.Site(siteConfigPath);
  site.load();

  await site.readyBuild();

  const clientConfig = site.createClientConfig(true, isDebug, outDir);
  const serverConfig = site.createServerConfig(true, isDebug, outDir);
  const stats = await compile([clientConfig.toConfig(), serverConfig.toConfig()]);

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

  await renderPages(site, renderer, '/', outDir);
};

function compile(configs, isDebug) {
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

async function renderPages(site, renderer, urlDir, outDir) {
  const nodes = await site.listPages(urlDir);
  await fs.ensureDir(outDir);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const name = node.name;

    if (node.isDirectory) {
      await renderPages(site, renderer, path.join(urlDir, name), path.join(outDir, name));
    } else {
      const extname = path.extname(name);
      const basename = path.basename(name, extname);
      const outFile = path.join(outDir, `${basename}.html`);
      const pathname = path.join(urlDir, basename);
      try {
        await renderPage(renderer, pathname, outFile);
      } catch (e) {
        console.error(`Error rendering page '${pathname}'`, e);
      }
    }
  }
}

async function renderPage(renderer, pathname, outFile) {
  const context = {
    url: pathname,
    headData: {},
  };
  const html = await renderer.renderToString(context);
  console.log(`renderPage(${pathname}) => ${outFile}`);
  await fs.writeFile(outFile, html);
}
