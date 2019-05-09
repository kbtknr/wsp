const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('events');

const appDir = path.join(__dirname, '../app');
const defaultInlineLimit = 1024;
class SiteConfig extends EventEmitter {
  constructor(siteConfigPath) {
    super();

    this.configPath = path.resolve(siteConfigPath);
    this.config = null;
    this.watcher = null;
  }

  load() {
    delete require.cache[this.configPath];
    const config = require(this.configPath);
    this.config = config;

    // const config = {
    //   name: src.name,
    //   title: src.title,
    //   description: src.description,

    //   paths: {
    //     assets: src.paths.assets,
    //     components: src.paths.components,
    //     masterPages: src.paths.masterPages,
    //     pages: src.paths.pages,
    //     notFound: src.paths.notFound
    //   },

    //   defaultMasterPageName: src.defaultMasterPageName,
    //   defaultMarkdownWrapperName: src.defaultMarkdownWrapperName,

    //   build: {
    //     inlineLimit,
    //     postcss
    //   }
    // };
  }

  watch() {
    if (this.watcher) {
      return;
    }

    this.watcher = fs.watch(this.configPath, {
      persistent: true,
      recursive: false
    }, (eventType, filename) => {
      if (eventType !== 'change' || filename !== this.configPath) {
        return;
      }

      this.load();
      this.emit('change');
    });
    this.watcher.addListener('error', (err) => {
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
    if (isDirectory && !stat.isDirectory() ||
        !isDirectory && !stat.isFile()) {
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
    return this.config.build && this.config.build.inlineLimit || defaultInlineLimit;
  }
  get postcssImportFile() {
    return this.getResolvePath((this.config.paths['config'] || 'config') + '/postcss.js');
  }
}

module.exports = SiteConfig;
