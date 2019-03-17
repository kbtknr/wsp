const fs = require('fs-extra');
const path = require('path');
const page = require('./page');
const generateRoutes = require('./generate-routes');
const generateMasterPages = require('./generate-master-pages');

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
     * internalDir: null,
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
  await fs.emptyDir(site.tmpDir);

  site.internalDir = path.resolve(site.tmpDir, 'internal');
  await fs.emptyDir(site.internalDir);

  if (site.paths.pagesDir == null) {
    throw Error('pages directory is required.');
  }

  site.pages = await resolvePages(site);
  site.masterPages = await resolveMasterPages(site);

  const routesPath = `${site.internalDir}/routes.js`;
  await fs.writeFile(routesPath, generateRoutes(site));
  await fs.symlink(path.relative(site.internalDir, site.paths.pagesDir), path.resolve(site.internalDir, 'pages'));

  const masterPagesPath = `${site.internalDir}/master-pages.js`;
  await fs.writeFile(masterPagesPath, generateMasterPages(site));
  await fs.symlink(
    path.relative(site.internalDir, site.paths.masterPagesDir),
    path.resolve(site.internalDir, 'master-pages')
  );

  await fs.symlink(
    path.relative(site.internalDir, site.paths.componentsDir),
    path.resolve(site.internalDir, 'components')
  );

  if (site.paths.notFoundFile) {
    const ext = path.extname(site.paths.notFoundFile);
    await fs.symlink(
      path.relative(site.internalDir, site.paths.notFoundFile),
      path.resolve(site.internalDir, `not-found${ext}`)
    );
  }

  return site;
};

function loadSiteConfig(siteConfigPath) {
  return require(siteConfigPath);
}

function resolvePaths(site) {
  const configPaths = site.config.paths || {};
  const basePath = path.dirname(site.configPath);

  let assetsDir = path.resolve(basePath, configPaths.assets || 'assets');
  if (!fs.pathExistsSync(assetsDir)) {
    assetsDir = null;
  }

  let componentsDir = path.resolve(basePath, configPaths.components || 'components');
  if (!fs.pathExistsSync(componentsDir)) {
    componentsDir = null;
  }

  let masterPagesDir = path.resolve(basePath, configPaths.masterPages || 'masterPages');
  if (!fs.pathExistsSync(masterPagesDir)) {
    masterPagesDir = null;
  }

  let pagesDir = path.resolve(basePath, configPaths.pages || 'pages');
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
    notFoundFile,
  };
}

async function resolvePages(site) {
  return sort(await page.finddir(site.paths.pagesDir, ['.vue', '.md']), 'name');
}
async function resolveMasterPages(site) {
  const dirname = site.paths.masterPagesDir;
  const entries = await fs.readdir(dirname);

  const masterPages = [];
  for (let i = 0; i < entries.length; i++) {
    const name = entries[i];
    const ext = path.extname(name);
    if (ext !== '.vue') {
      continue;
    }

    const pathname = path.join(dirname, name);
    const stats = await fs.stat(pathname);
    if (!stats.isFile()) {
      continue;
    }

    masterPages.push(pathname);
  }
  masterPages.sort();
  return masterPages;
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
