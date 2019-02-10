const fs = require('fs-extra')
const path = require('path');
const globby = require('globby');
const wsdutil = require('./wsd-util');
const page = require('./page');

module.exports = async function(siteConfigPath, tmpDir) {
  const site = {
    /*
     * configPath: null,
     * config: null,
     * paths: {
     *   assetsDir: null,
     *   componentsDir: null,
     *   masterPagesDir: null,
     *   pagesDir: null,
     *   notFoundFile: null
     * },
     * tmpDir: null,
     * pages: [
     *   'file-path'...
     * ],
     * masterPages: [
     *   'file-path'...
     * ]
     */
  };
  site.configPath = path.resolve(siteConfigPath);
  site.config = loadSiteConfig(site.configPath);
  site.paths = resolvePaths(site);

  if (tmpDir) {
    site.tmpDir = path.resolve(tmpDir);
  } else {
    site.tmpDir = createTempDirectory();
  }
  await wsdutil.ensureDir(site.tmpDir);

  if (site.paths.pagesDir == null) {
    throw Error('pages directory is required.');
  }

  site.pages = await resolvePages(site);
  site.masterPages = await resolveMasterPages(site);

  const routesPath = `${site.tmpDir}/routes.js`;
  await wsdutil.fsWriteFile(routesPath, generateRoutesFileCode(site));

  return site;
}

function loadSiteConfig(siteConfigPath) {
  return require(siteConfigPath);
}

function resolvePaths(site) {
  const configPaths = site.config.paths || {};
  const basePath = path.dirname(site.configPath);

  let assetsDir = path.resolve(basePath, configPaths.assets || "assets");
  if (!fs.pathExistsSync(assetsDir)) {
    assetsDir = null;
  }

  let componentsDir = path.resolve(basePath, configPaths.components || "components");
  if (!fs.pathExistsSync(componentsDir)) {
    componentsDir = null;
  }

  let masterPagesDir = path.resolve(basePath, configPaths.masterPages || "masterPages");
  if (!fs.pathExistsSync(masterPagesDir)) {
    masterPagesDir = null;
  }

  let pagesDir = path.resolve(basePath, configPaths.pages || "pages");
  if (!fs.pathExistsSync(pagesDir)) {
    pagesDir = null;
  }

  let notFoundFile = configPaths.notFound ? path.resolve(basePath, configPaths.notFound) : null;
  if (!fs.pathExistsSync(notFoundFile)) {
    notFoundFile = null;
  }

  return {
    assetsDir,
    componentsDir,
    masterPagesDir,
    pagesDir,
    notFoundFile
  };
}

async function resolvePages(site) {
  return sort(await page.finddir(site.paths.pagesDir), 'name');
}
async function resolveMasterPages(site) {
  return sort(await page.finddir(site.paths.masterPagesDir), 'name');
}

function sort(ary, key) {
  return ary.sort((a, b) => {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
    return 0;
  });
}

function createTempDirectory() {
  return path.resolve(__dirname, '../.tmp');
}

function generateRouteCode(route) {
  let {
    urlPath,
    componentPath,
    alias,
    title,
    description
  } = route;

  if (typeof(urlPath) !== 'string' || typeof(componentPath) !== 'string') {
    return null
  }

  urlPath = JSON.stringify(urlPath);
  componentPath = JSON.stringify(componentPath);
  if (alias == null) {
    alias = '';
  } else {
    alias = `alias: ${JSON.stringify(alias)},`;
  }
  if (typeof(title) === 'string') {
    title = JSON.stringify(title);
  } else {
    title = 'null';
  }
  if (typeof(description) === 'string') {
    description = JSON.stringify(description);
  } else {
    description = 'null';
  }

  return `
    {
      path: ${urlPath},
      component: () => import(${componentPath}),
      ${alias}
      meta: {
        title: ${title},
        description: ${description}
      }
    }
  `;
}
function generateRouteWithChildrenCode(route) {
  let {
    urlPath,
    childrenCode
  } = route;
  urlPath = JSON.stringify(urlPath);

  return `
    {
      path: ${urlPath},
      component: (h) => h('router-view'),
      children: [
        ${childrenCode}
      ]
    }
  `;
}
function generateRoutesCode(dirname, nodes) {
  const routesCode = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const name = node.name;
    const pathname = `${dirname}/${name}`;

    if (node.children) {
      const childrenCode = generateRoutesCode(pathname, node.children);
      const urlPath = name;
      routesCode.push(generateRouteWithChildrenCode({
        urlPath,
        childrenCode
      }));
    } else {
      const ext = path.extname(name);
      const basename = path.basename(name, ext);
      const urlPath = basename;
      const componentPath = pathname;

      // TODO
      const title = `${basename} title`;
      const description = `desc of ${basename}`;

      routesCode.push(generateRouteCode({
        urlPath,
        componentPath,
        title,
        description
      }));
    }
  }

  return routesCode.join(',');
}
function generateRoutesFileCode(site) {
  const childrenCode = generateRoutesCode('', site.pages);
  const urlPath = '/';
  const routesCode = generateRouteWithChildrenCode({
    urlPath,
    childrenCode
  });
  return `
    import _ from '@internal/master-pages'
    export default [
      ${routesCode}
    ];
  `;
}
