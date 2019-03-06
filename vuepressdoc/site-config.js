module.exports = {
  name: "vuepressdoc",
  title: "VuePress documentation",
  description: "VuePress documentation description",

  paths: {
    assets: 'assets',
    components: 'components',
    masterPages: 'master-pages',
    pages: 'pages',
    notFound: 'not-found.md'
  },

  build: {
    inlineLimit: 8 * 1024,
    postcss: {}
  }
};
