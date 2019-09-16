const express = require('express');
const Router = require('express-promise-router');
const Site = require('./site');
const Errors = require('./errors');

function assetsRoute(site) {
  const router = Router();

  // GET /assets/list?path=
  router.get('/list', async (req, res) => {
    const path = req.query.path || '/';
    try {
      const data = await site.listAssets(path);
      res.json(data);
    } catch (err) {
      if (err === Errors.PathIsNotAbsolute) {
        res.sendStatus(400);
      } else if (err === Errors.ItemNotFound) {
        res.sendStatus(404);
      } else {
        throw err;
      }
    }
  });

  // GET /assets/item?path=
  router.get('/item', async (req, res) => {});

  // POST /assets/item?path=
  router.post('/item', async (req, res) => {});

  // PATCH /assets/item?path=
  router.patch('/item', async (req, res) => {});

  // DELETE /assets/item?path=
  router.delete('/item', async (req, res) => {});

  return router;
}
function componentsRoute(site) {
  const router = Router();

  // GET /components/list
  router.get('/list', async (req, res) => {
    const data = await site.listComponents();
    res.json(data);
  });

  // GET /components/item?path=
  router.get('/item', async (req, res) => {});

  // POST /components/item?path=
  router.post('/item', async (req, res) => {});

  // PATCH /components/item?path=
  router.patch('/item', async (req, res) => {});

  // DELETE /components/item?path=
  router.delete('/item', async (req, res) => {});

  return router;
}
function markdownLoadersRoute(site) {
  const router = Router();

  // GET /markdown-loaders/list
  router.get('/list', async (req, res) => {
    const data = await site.listMarkdownLoaders();
    res.json(data);
  });

  // GET /markdown-loaders/item?path=
  router.get('/item', async (req, res) => {});

  // POST /markdown-loaders/item?path=
  router.post('/item', async (req, res) => {});

  // PATCH /markdown-loaders/item?path=
  router.patch('/item', async (req, res) => {});

  // DELETE /markdown-loaders/item?path=
  router.delete('/item', async (req, res) => {});

  return router;
}
function masterPagesRoute(site) {
  const router = Router();

  // GET /master-pages/list
  router.get('/list', async (req, res) => {
    const data = await site.listMasterPages();
    res.json(data);
  });

  // GET /master-pages/item?path=
  router.get('/item', async (req, res) => {});

  // POST /master-pages/item?path=
  router.post('/item', async (req, res) => {});

  // PATCH /master-pages/item?path=
  router.patch('/item', async (req, res) => {});

  // DELETE /master-pages/item?path=
  router.delete('/item', async (req, res) => {});

  return router;
}
function pagesRoute(site) {
  const router = Router();

  // GET /pages/list?path=
  router.get('/list', async (req, res) => {
    const path = req.query.path || '/';
    try {
      const data = await site.listPages(path);
      res.json(data);
    } catch (err) {
      if (err === Errors.PathIsNotAbsolute) {
        res.sendStatus(400);
      } else if (err === Errors.ItemNotFound) {
        res.sendStatus(404);
      } else {
        throw err;
      }
    }
  });

  // GET /pages/item?path=
  router.get('/item', async (req, res) => {
    const path = req.query.path;
    if (!path) {
      res.sendStatus(400);
      return;
    }

    try {
      const data = await site.getPage(path);
      res.json(data);
    } catch (err) {
      if (err === Errors.PathIsNotAbsolute || err === Errors.InvalidExtName) {
        res.sendStatus(400);
      } else if (err === Errors.ItemNotFound) {
        res.sendStatus(404);
      } else {
        throw err;
      }
    }
  });

  // POST /pages/item?path=
  router.post('/item', async (req, res) => {
    const path = req.query.path;
    if (!path) {
      res.sendStatus(400);
      return;
    }

    try {
      const data = await site.createPage(path, req.body);
      res.json(data);
    } catch (err) {
      if (err === Errors.PathIsNotAbsolute) {
        res.sendStatus(400);
      } else if (err === Errors.ItemNotFound) {
        res.sendStatus(404);
      } else {
        throw err;
      }
    }
  });

  // PATCH /pages/item?path=
  router.patch('/item', async (req, res) => {
    const path = req.query.path;
    if (!path) {
      res.sendStatus(400);
      return;
    }

    try {
      const data = await site.updatePage(path, req.body);
      res.json(data);
    } catch (err) {
      if (err === Errors.PathIsNotAbsolute) {
        res.sendStatus(400);
      } else if (err === Errors.ItemNotFound) {
        res.sendStatus(404);
      } else {
        throw err;
      }
    }
  });

  // DELETE /pages/item?path=
  router.delete('/item', async (req, res) => {
    const path = req.query.path;
    if (!path) {
      res.sendStatus(400);
      return;
    }

    try {
      const data = await site.deletePage(path);
      res.sendStatus(204);
    } catch (err) {
      if (err === Errors.PathIsNotAbsolute) {
        res.sendStatus(400);
      } else if (err === Errors.ItemNotFound) {
        res.sendStatus(404);
      } else {
        throw err;
      }
    }
  });

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
