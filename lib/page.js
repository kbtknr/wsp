const fs = require('fs-extra');
const path = require('path');
const VueTemplateCompiler = require('vue-template-compiler');
const Frontmatter = require('./frontmatter');

const Errors = require('./errors');

class Page {
  constructor() {
    this.template = null;
    this.styles = null;
    this.script = null;
    this.markdown = null;

    this.title = null;
    this.description = null;
    this.viewport = null;
    this.og = null;
    this.appendHeadTags = null;
    this.masterPageName = null;
    this.wrapperName = null;
    this.components = null;
  }

  static async read(filename) {
    const extname = path.extname(filename).toLowerCase();
    if (extname !== '.vue' && extname !== '.md') {
      throw Errors.InvalidExtName;
    }

    let src;
    try {
      src = await fs.readFile(filename, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        throw Errors.ItemNotFound;
      }

      throw err;
    }

    const page = new Page();
    if (extname === '.vue') {
      page.deserializeVueData(src);
    } else if (extname === '.md') {
      page.deserializeMarkdownData(src);
    } else {
      throw Errors.InvalidExtName;
    }
    return page;
  }

  static async write(filename, src, mode) {
    const extname = path.extname(filename).toLowerCase();
    if (extname !== '.vue' && extname !== '.md') {
      throw Errors.InvalidExtName;
    }

    switch (mode) {
      case 'create':
      case 'update':
        let fd;
        try {
          const openmode = mode === 'create' ? 'wx' : mode === 'update' ? 'r+' : 'w';
          fd = await fs.open(filename, openmode);
        } catch (err) {
          if ((mode === 'create' && err.code === 'EEXIST') || (mode === 'update' && err.code === 'ENOENT')) {
            throw Errors.InvalidOperation;
          } else if (err.code === 'EISDIR') {
            throw Errors.ItemNotFound;
          }
          throw err;
        }

        const page = new Page();
        try {
          if (extname === '.vue') {
            page.deserializeVueData(src);
          } else if (extname === '.md') {
            page.deserializeMarkdownData(src);
          } else {
            throw Errors.InvalidExtName;
          }

          await fs.writeFile(fd, src, 'utf8');
        } finally {
          if (fd) {
            await fs.close(fd);
          }
        }
        return page;

      case 'delete':
        if (src != null) {
          throw Errors.InvalidOperation;
        }
        try {
          await fs.unlink(filename);
        } catch (err) {
          if (err.code === 'ENOENT' || err.code === 'EISDIR') {
            throw Errors.ItemNotFound;
          }
          throw err;
        }
        return null;
      default:
        throw Errors.InvalidOperation;
    }
  }

  deserializeVueData(src) {
    const sfcDescriptor = VueTemplateCompiler.parseComponent(src);
    const { template, script, styles, customBlocks } = sfcDescriptor;

    let headData;
    for (let i = 0; i < customBlocks.length; i++) {
      const customBlock = customBlocks[i];
      if (customBlock.type === 'head') {
        headData = JSON.parse(customBlock.content.trim());
      }
    }

    this.template = template.content;
    this.script = script.content;
    this.styles = styles.map(style => style.content);

    this.markdown = null;
    this.deserializeHeadData(headData);
  }
  deserializeMarkdownData(src) {
    const {
      content,
      data: {
        title,
        description,
        viewport,
        og,
        'append-head-tags': appendHeadTags,
        'master-page': masterPageName,
        wrapper: wrapperName,
        components,
      },
    } = Frontmatter.parse(src);

    this.template = null;
    this.script = null;
    this.styles = null;
    this.markdown = content;

    this.title = title;
    this.description = description;
    this.viewport = viewport;
    this.og = og;
    this.appendHeadTags = appendHeadTags;
    this.masterPageName = masterPageName;
    this.wrapperName = wrapperName;
    this.components = components;
  }

  deserializeHeadData(headData) {
    ['title', 'description', 'viewport', 'og', 'appendHeadTags', 'masterPageName', 'wrapperName', 'components'].forEach(
      key => {
        if (key in headData) {
          this[key] = headData[key];
        }
      }
    );
  }

  toJSON() {
    let keys;
    if (this.template) {
      keys = [
        'template',
        'script',
        'styles',
        'title',
        'description',
        'viewport',
        'og',
        'appendHeadTags',
        'masterPageName',
        'wrapperName',
        'components',
      ];
    } else if (this.markdown) {
      keys = [
        'markdown',
        'title',
        'description',
        'viewport',
        'og',
        'appendHeadTags',
        'masterPageName',
        'wrapperName',
        'components',
      ];
    } else {
      return null;
    }
    const json = {};
    keys.forEach(key => (json[key] = this[key]));
    return json;
  }
}

module.exports = Page;
