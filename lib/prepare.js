const fs = require('fs-extra')
const path = require('path');
const globby = require('globby');

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
     * tmpDir: null
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

  if (site.paths.pagesDir == null) {
    throw Error('pages directory is required.');
  }

  site.pages = await resolvePages(site);

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
  return sort(await globby(['**/*.vue', '**/*.md'], { cwd: site.paths.pagesDir }));
}

function sort(ary) {
  return ary.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}

function createTempDirectory() {
  return path.resolve(__dirname, '../.tmp');
}
