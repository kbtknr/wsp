const Page = require('../page.js');
const Errors = require('../errors.js');
const TestFilesDir = `${__dirname}/__files__`;

describe('Page.read', () => {
  test('read vue file', async () => {
    const page = await Page.read(`${TestFilesDir}/Page.vue-file.vue`);
    expect(page).toMatchInlineSnapshot(`
      Object {
        "appendHeadTags": null,
        "components": null,
        "description": "VuePage description",
        "masterPageName": null,
        "og": null,
        "script": "
      module.exports = {};
      ",
        "styles": Array [
          "
      h1 {
        color: red;
      }
      ",
        ],
        "template": "
      <div>
        <h1>Vue Page</h1>
      </div>
      ",
        "title": "VuePage title",
        "viewport": null,
        "wrapperName": null,
      }
    `);
  });
  test('read markdown file', async () => {
    const page = await Page.read(`${TestFilesDir}/Page.markdown-file.md`);
    expect(page).toMatchInlineSnapshot(`
      Object {
        "appendHeadTags": undefined,
        "components": undefined,
        "description": "Markdown description",
        "markdown": "# Markdown page

      line1
      line2
      ",
        "masterPageName": undefined,
        "og": undefined,
        "title": "Markdown title",
        "viewport": undefined,
        "wrapperName": undefined,
      }
    `);
  });
});
