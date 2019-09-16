const Site = require('../site.js');
const Errors = require('../errors.js');
const TestSitesDir = `${__dirname}/__sites__`;

describe('Site', () => {
  let site;
  beforeAll(() => {
    site = new Site(`${TestSitesDir}/list-dirent/site-config.js`);
    site.load();
  });
  describe('listAssets', () => {
    test('throws PathIsNotAbsolute', async () => {
      await expect(site.listAssets('images')).rejects.toThrow(Errors.PathIsNotAbsolute);
    });
    test('throws ItemNotFound by not-found', async () => {
      await expect(site.listAssets('/not-found-dir')).rejects.toThrow(Errors.ItemNotFound);
    });
    test('throws ItemNotFound by exists-file', async () => {
      await expect(site.listAssets('/assets/images/image1.jpg')).rejects.toThrow(Errors.ItemNotFound);
    });
    test('return list data', async () => {
      expect(await site.listAssets('/')).toMatchInlineSnapshot(`
        Array [
          Object {
            "extname": null,
            "isDirectory": true,
            "name": "images",
          },
        ]
      `);
      expect(await site.listAssets('/images')).toMatchInlineSnapshot(`
        Array [
          Object {
            "extname": ".jpg",
            "isDirectory": false,
            "name": "image1.jpg",
          },
          Object {
            "extname": ".png",
            "isDirectory": false,
            "name": "image2.png",
          },
        ]
      `);
    });
  });
  test('listMarkdownLoaders', async () => {
    expect(await site.listMarkdownLoaders()).toMatchInlineSnapshot(`
      Array [
        Object {
          "extname": ".js",
          "isDirectory": false,
          "name": "loader1.js",
        },
        Object {
          "extname": ".js",
          "isDirectory": false,
          "name": "loader2.js",
        },
      ]
    `);
  });
  test('listComponents', async () => {
    expect(await site.listComponents()).toMatchInlineSnapshot(`
      Array [
        Object {
          "extname": ".vue",
          "isDirectory": false,
          "name": "com1.vue",
        },
        Object {
          "extname": ".vue",
          "isDirectory": false,
          "name": "com2.vue",
        },
      ]
    `);
  });
  test('listMasterPages', async () => {
    expect(await site.listMasterPages()).toMatchInlineSnapshot(`
      Array [
        Object {
          "extname": ".vue",
          "isDirectory": false,
          "name": "default.vue",
        },
      ]
    `);
  });
  describe('listPages', () => {
    test('throws PathIsNotAbsolute', async () => {
      await expect(site.listPages('page')).rejects.toThrow(Errors.PathIsNotAbsolute);
    });
    test('throws ItemNotFound by not-found', async () => {
      await expect(site.listPages('/not-found-dir')).rejects.toThrow(Errors.ItemNotFound);
    });
    test('throws ItemNotFound by exists-file', async () => {
      await expect(site.listPages('/page1.vue')).rejects.toThrow(Errors.ItemNotFound);
    });
    test('return list data', async () => {
      expect(await site.listPages('/')).toMatchInlineSnapshot(`
        Array [
          Object {
            "extname": null,
            "isDirectory": true,
            "name": "dir",
          },
          Object {
            "extname": ".vue",
            "isDirectory": false,
            "name": "page1.vue",
          },
          Object {
            "extname": ".md",
            "isDirectory": false,
            "name": "page2.md",
          },
          Object {
            "extname": ".vue",
            "isDirectory": false,
            "name": "page3.vue",
          },
        ]
      `);
      expect(await site.listPages('/dir')).toMatchInlineSnapshot(`
        Array [
          Object {
            "extname": ".md",
            "isDirectory": false,
            "name": "page4.md",
          },
        ]
      `);
    });
  });
});
