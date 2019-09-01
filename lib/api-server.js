const express = require('express');
const Site = require('./site');

function assetsRoute(site) {
  const router = express.Router();
  return router;
}
function componentsRoute(site) {
  const router = express.Router();
  return router;
}
function markdownLoadersRoute(site) {
  const router = express.Router();
  return router;
}
function masterPagesRoute(site) {
  const router = express.Router();
  return router;
}
function pagesRoute(site) {
  const router = express.Router();
  return router;
}

module.exports = function(site) {
  const router = express.Router();
  router.use('/assets', assetsRoute(site));
  router.use('/components', componentsRoute(site));
  router.use('/markdown-loaders', markdownLoadersRoute(site));
  router.use('/master-pages', masterPagesRoute(site));
  router.use('/pages', pagesRoute(site));
  return router;
};
