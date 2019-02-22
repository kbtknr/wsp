const path = require('path');
const prepare = require('./prepare');
const fs = require('fs-extra');
const { createBundleRenderer } = require('vue-server-renderer')
const { createClientConfig, createServerConfig } = require('./webpack');

module.exports = async function({
  siteConfigPath,
  tmpDir,
  outDir,
  isDebug
}) {
  if (outDir == null) {
    outDir = path.join(path.dirname(siteConfigPath), '.dist');
  }
  outDir = path.resolve(outDir);

  const site = await prepare(siteConfigPath, tmpDir);

  const inlineLimit = site.config.build && site.config.build.inlineLimit;
  const postcss = site.config.build && site.config.build.postcss;
  const internalDir = site.internalDir;
  const clientConfig = createClientConfig(path.resolve(__dirname, '../app/client-entry.js'), true, false, outDir, internalDir, inlineLimit, postcss);
  const serverConfig = createServerConfig(path.resolve(__dirname, '../app/server-entry.js'), true, false, outDir, internalDir, inlineLimit, postcss);

  const stats = await compile([clientConfig.toConfig(), serverConfig.toConfig()]);

  const serverBundle = require(path.join(outDir, 'manifest/server.json'));
  const clientManifest = require(path.join(outDir, 'manifest/client.json'));

  const template = await fs.readFile(path.join(__dirname, './index.template.html'), {
    encoding: 'utf8'
  });
  const renderer = createBundleRenderer(serverBundle, {
    clientManifest,
    runInNewContext: false,
    inject: false,
    shouldPrefetch: (() => true),
    template
  });

  await renderPages('', outDir, site.pages, renderer);
}

function compile(configs, isDebug) {
  const webpack = require('webpack');
  return new Promise((resolve, reject) => {
    webpack(configs, (err, stats) => {
      if (err) {
        return reject(err);
      }
      if (stats.hasErrors()) {
        stats.toJson().errors.forEach(err => {
          console.error(err)
        });
        reject(new Error(`Failed to compile with errors.`));
        return;
      }
      if (isDebug && stats.hasWarnings()) {
        stats.toJson().warnings.forEach(warning => {
          console.warn(warning)
        })
      }
      resolve(stats.toJson({ modules: false }))
    });
  });
}

async function renderPages(dirname, outDir, nodes, renderer) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const pathname = path.join(dirname, node.name);
    try {
      if (node.children) {
        await fs.ensureDir(path.resolve(outDir, pathname));
        await renderPages(pathname, outDir, node.children, renderer);
      } else {
        await renderPage(pathname, outDir, node, renderer);
      }
    } catch(e) {
      console.error(`Error rendering page '${pathname}'`, e);
    }
  }
}

async function renderPage(pathname, outDir, node, renderer) {
  const dirname = path.dirname(pathname);
  const basename = path.basename(pathname, path.extname(pathname));
  pathname = path.join(dirname, basename);
  const context = {
    url: path.join('/', pathname),
    meta: '',
    title: ''
    // meta: renderMeta(page.meta),
    // title: page.meta.title,
  };

  const html = await renderer.renderToString(context);
  const filePath = path.resolve(outDir, pathname);
  console.log(`renderPage(${pathname}) => ${filePath}`);
  await fs.writeFile(filePath, html)
}
// function renderMeta(meta) {
//   let snippets = [];
//   if (meta.description) {
//     snippets.push(`<meta name="description" content="${escape(meta.description)}" />`);
//   }
//   return snippets.join('');
// }
