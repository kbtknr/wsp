const express = require('express');
const Router = require('express-promise-router');
const Site = require('./site');

function assetsRoute(site) {
  const router = Router();
  return router;
}
function componentsRoute(site) {
  const router = Router();
  return router;
}
function markdownLoadersRoute(site) {
  const router = Router();
  return router;
}
function masterPagesRoute(site) {
  const router = Router();
  return router;
}
function pagesRoute(site) {
  const router = Router();
  return router;
}

module.exports = function(site) {
  const app = express();
  app.use(express.json());

  const router = Router();
  router.use('/assets', assetsRoute(site));
  router.use('/components', componentsRoute(site));
  router.use('/markdown-loaders', markdownLoadersRoute(site));
  router.use('/master-pages', masterPagesRoute(site));
  router.use('/pages', pagesRoute(site));

  app.use(router);
  return app;
};
