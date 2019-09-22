const path = require('path');

const Errors = require('./errors.js');
const Page = require('./page.js');

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
    return await Page.read(filename);
  }
  async create(pathName, src) {
    const filename = this.getPath(pathName);
    return await Page.write(filename, src, 'create');
  }
  async update(pathName, src) {
    const filename = this.getPath(pathName);
    return await Page.write(filename, src, 'update');
  }
  async delete(pathName) {
    const filename = this.getPath(pathName);
    return await Page.write(filename);
  }
}
module.exports = Pages;
