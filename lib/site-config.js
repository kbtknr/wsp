const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('events');

const appDir = path.join(__dirname, '../app');
const defaultInlineLimit = 1024;
class SiteConfig extends EventEmitter {
  constructor() {
    super();

    this.configPath = null;
    this.config = null;
    this.watcher = null;
  }

  static async create(configPath, config) {
    config.paths = config.paths || {};
    config.build = config.build || {};

    const configDir = path.dirname(configPath);
    const dirs = [
      config.paths.assets,
      config.paths.components,
      config.paths.markdownLoaders,
      config.paths.masterPages,
      config.paths.pages,
    ].filter(s => s);
    for (let i = 0; i < dirs.length; i++) {
      if (path.isAbsolute(dirs[i])) {
        console.log('');
      } else {
        const dir = path.resolve(configDir, dirs[i]);
        await fs.ensureDir(dir);
      }
    }

    const strConfig = `
module.exports = {
  name: ${JSON.stringify(config.name || '')},
  title: ${JSON.stringify(config.title || '')},
  description: ${JSON.stringify(config.description || '')},

  paths: {
    assets: ${JSON.stringify(config.paths.assets || null)},
    components: ${JSON.stringify(config.paths.components || null)},
    markdownLoaders: ${JSON.stringify(config.paths.markdownLoaders || null)},
    masterPages: ${JSON.stringify(config.paths.masterPages || null)},
    pages: ${JSON.stringify(config.paths.pages || null)},
    notFound: ${JSON.stringify(config.paths.notFound || null)}
  },

  defaultMasterPageName: ${JSON.stringify(config.defaultMasterPageName || null)},
  defaultMarkdownWrapperName: ${JSON.stringify(config.defaultMarkdownWrapperName || null)},

  build: {
    inlineLimit: 8 * 1024,
    postcss: {}
  }
};
    `.trim();
    await fs.writeFile(configPath, strConfig, 'utf8');
  }

  load(siteConfigPath) {
    this.configPath = path.resolve(siteConfigPath);

    delete require.cache[this.configPath];
    this.config = require(this.configPath);
  }

  watch() {
    if (this.watcher) {
      return;
    }

    this.watcher = fs.watch(
      this.configPath,
      {
        persistent: true,
        recursive: false,
      },
      (eventType, filename) => {
        if (eventType !== 'change' || filename !== this.configPath) {
          return;
        }

        this.load();
        this.emit('change');
      }
    );
    this.watcher.addListener('error', err => {
      this.emit('error', err);
    });
    this.watcher.addListener('close', () => {
      this.watcher = null;
    });
  }
  unwatch() {
    if (this.watcher) {
      this.watcher.close();
    }
  }

  get assetsDir() {
    return this.getResolvePath(this.config.paths['assets'] || 'assets', true);
  }
  get configDir() {
    return this.getResolvePath(this.config.paths['config'] || 'config', true);
  }
  get markdownLoadersDir() {
    return this.getResolvePath(this.config.paths['markdownLoaders'] || 'markdown-loaders', true);
  }
  get componentsDir() {
    return this.getResolvePath(this.config.paths['components'] || 'components', true);
  }
  get masterPagesDir() {
    return this.getResolvePath(this.config.paths['masterPages'] || 'master-pages', true);
  }
  get pagesDir() {
    return this.getResolvePath(this.config.paths['pages'] || 'pages', true);
  }
  getResolvePath(pathname, isDirectory) {
    const p = path.resolve(path.dirname(this.configPath), pathname);
    const stat = fs.statSync(p);
    if ((isDirectory && !stat.isDirectory()) || (!isDirectory && !stat.isFile())) {
      return null;
    }
    return p;
  }

  get defaultMasterPageFile() {
    const masterPagesDir = this.masterPagesDir;
    const name = this.config.defaultMasterPageName;

    if (masterPagesDir && name) {
      const p = path.join(masterPagesDir, `${name}.vue`);
      const stat = fs.statSync(p);
      if (stat.isFile()) {
        return p;
      }
    }
    return path.join(appDir, 'default-master-page.vue');
  }
  get defaultMarkdownWrapperFile() {
    const componentsDir = this.componentsDir;
    const name = this.config.defaultMarkdownWrapperName;

    if (componentsDir && name) {
      const p = path.join(componentsDir, `${name}.vue`);
      const stat = fs.statSync(p);
      if (stat.isFile()) {
        return p;
      }
    }
    return path.join(appDir, 'default-markdown-wrapper.vue');
  }
  get inlineLimit() {
    return (this.config.build && this.config.build.inlineLimit) || defaultInlineLimit;
  }
  get postcssImportFile() {
    return this.getResolvePath((this.config.paths['config'] || 'config') + '/postcss.js');
  }
}

module.exports = SiteConfig;
