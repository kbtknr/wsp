module.exports = {
  name: "list-dirent",
  title: "",
  description: "",

  paths: {
    assets: 'assets',
    components: 'components',
    markdownLoaders: 'markdown-loaders',
    masterPages: 'master-pages',
    pages: 'pages',
    notFound: 'not-found.md'
  },

  defaultMasterPageName: '',
  defaultMarkdownWrapperName: 'default-markdown-wrapper',

  build: {
    inlineLimit: 8 * 1024,
    postcss: {}
  }
};
