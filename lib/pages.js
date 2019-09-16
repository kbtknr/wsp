const path = require('path');

const Errors = require('./errors.js');
// const Page = require('./page.js');
// const PageEditor = require('./page-editor.js');

class Pages {
  constructor(site) {
    this.site = site;
  }

  getPath(pathName) {
    if (this.site == null) {
      throw new Error('invalid operation');
    }
    if (!path.isAbsolute(pathName)) {
      throw Errors.PathIsNotAbsolute;
    }

    return path.join(this.site.config.pagesDir, pathName.substring(1));
  }

  async get(pathName) {
    const filename = this.getPath(pathName);
    console.log('Pages.get', filename);
    // return await Page.read(filename);
  }
  async create(pathName, body) {
    const filename = this.getPath(pathName);
    console.log('Pages.create', filename);
    // return await PageEditor.create(pathName, body);
  }
  async update(pathName, body) {
    const filename = this.getPath(pathName);
    console.log('Pages.update', filename);
    // return await PageEditor.update(pathName, body);
  }
  async delete(pathName) {
    const filename = this.getPath(pathName);
    console.log('Pages.delete', filename);
    // return await Page.delete(filename);
  }
}
module.exports = Pages;
