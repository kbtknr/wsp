const fs = require('fs-extra');

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
describe('Page.write', () => {
  const tmpDir = `${TestFilesDir}/tmp_Page.write`;

  async function isEqualFiles(a, b) {
    expect((await fs.readFile(a, 'utf8')) === (await fs.readFile(b, 'utf8'))).toBeTruthy();
  }
  let makeTempFile = (() => {
    let num = 0;
    return extname => {
      num++;
      return `${tmpDir}/${num}${extname}`;
    };
  })();

  beforeAll(async () => {
    await fs.emptyDir(tmpDir);
  });
  afterAll(async () => {
    await fs.remove(tmpDir);
  });

  test('write vue file at create mode', async () => {
    const targetFile = makeTempFile('.vue');

    const src = await fs.readFile(vueFile, 'utf8');
    const page = await Page.write(targetFile, src, 'create');

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
    await isEqualFiles(vueFile, targetFile);
  });
  test('write vue file at update mode', async () => {
    const targetFile = makeTempFile('.vue');
    await fs.writeFile(targetFile, 'data', 'utf8'); // ensure exists

    const src = await fs.readFile(vueFile, 'utf8');
    const page = await Page.write(targetFile, src, 'update');

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
    await isEqualFiles(vueFile, targetFile);
  });
  test('write markdown file at create mode', async () => {
    const targetFile = makeTempFile('.md');

    const src = await fs.readFile(markdownFile, 'utf8');
    const page = await Page.write(targetFile, src, 'create');

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
    await isEqualFiles(markdownFile, targetFile);
  });
  test('write markdown file at update mode', async () => {
    const targetFile = makeTempFile('.md');
    await fs.writeFile(targetFile, 'data', 'utf8'); // ensure exists

    const src = await fs.readFile(markdownFile, 'utf8');
    const page = await Page.write(targetFile, src, 'update');

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
    await isEqualFiles(markdownFile, targetFile);
  });

  test('throws invalid operation error at create exists file path', async () => {
    const targetVueFile = makeTempFile('.vue');
    const targetMarkdownFile = makeTempFile('.md');
    await fs.writeFile(targetVueFile, 'data', 'utf8'); // ensure exists
    await fs.writeFile(targetMarkdownFile, 'data', 'utf8'); // ensure exists

    await expect(Page.write(targetVueFile, 'data', 'create')).rejects.toThrow(Errors.InvalidOperation);
    await expect(Page.write(targetMarkdownFile, 'data', 'create')).rejects.toThrow(Errors.InvalidOperation);
  });
  test('throws invalid operation error at update not-exists file path', async () => {
    const targetVueFile = makeTempFile('.vue');
    const targetMarkdownFile = makeTempFile('.md');

    await expect(Page.write(targetVueFile, 'data', 'update')).rejects.toThrow(Errors.InvalidOperation);
    await expect(Page.write(targetMarkdownFile, 'data', 'update')).rejects.toThrow(Errors.InvalidOperation);
  });
  test('throws item not found error at update by directory', async () => {
    const dirVue = `${tmpDir}/dir.vue`;
    const dirMarkdown = `${tmpDir}/dir.md`;

    await fs.emptyDir(dirVue);
    await fs.emptyDir(dirMarkdown);

    await expect(Page.write(dirVue, 'data', 'update')).rejects.toThrow(Errors.ItemNotFound);
    await expect(Page.write(dirMarkdown, 'data', 'update')).rejects.toThrow(Errors.ItemNotFound);
  });
});
