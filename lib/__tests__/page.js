const Page = require('../page.js');
const Errors = require('../errors.js');
const TestFilesDir = `${__dirname}/__files__`;

const vueFile = `${TestFilesDir}/Page.vue-file.vue`;
const markdownFile = `${TestFilesDir}/Page.markdown-file.md`;
describe('Page.read', () => {
  const tmpDir = `${TestFilesDir}/tmp_Page.read`;

  beforeAll(async () => {
    await fs.emptyDir(tmpDir);
  });
  afterAll(async () => {
    await fs.remove(tmpDir);
  });

  test('read vue file', async () => {
    const page = await Page.read(vueFile);
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
    const page = await Page.read(markdownFile);
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

  test('throws item not found error by not exists', async () => {
    await expect(Page.read(`${tmpDir}/not-exists.vue`)).rejects.toThrow(Errors.ItemNotFound);
    await expect(Page.read(`${tmpDir}/not-exists.md`)).rejects.toThrow(Errors.ItemNotFound);
  });
  test('throws item not found error by directory', async () => {
    const dirVue = `${tmpDir}/dir.vue`;
    const dirMarkdown = `${tmpDir}/dir.md`;

    await fs.emptyDir(dirVue);
    await fs.emptyDir(dirMarkdown);

    await expect(Page.read(dirVue)).rejects.toThrow(Errors.ItemNotFound);
    await expect(Page.read(dirMarkdown)).rejects.toThrow(Errors.ItemNotFound);
  });
});
