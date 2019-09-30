const path = require('path');
const readline = require('readline');
const process = require('process');

const SiteConfig = require('./site-config');
const Site = require('./site');

module.exports = async function({ directory, filename }) {
  directory = path.resolve(directory || '.');
  filename = filename || 'site-config.js';

  const basename = path.basename(directory);
  const config = {
    name: basename,
    title: '',
    description: '',

    paths: {
      assets: 'assets',
      components: 'components',
      config: 'config',
      markdownLoaders: 'markdown-loaders',
      masterPages: 'master-pages',
      pages: 'pages',
      notFound: null,
    },

    defaultMasterPageName: 'default-master-page',
    defaultMarkdownWrapperName: 'default-markdown-wrapper',
  };

  const configFilePath = path.resolve(directory, filename);
  await Site.create(configFilePath, config);
};
