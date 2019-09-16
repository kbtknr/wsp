const path = require('path');
const { getOptions } = require('loader-utils');
const Frontmatter = require('./frontmatter');
const { renderMarkdown } = require('./markdown');

function generateComponentCode(requirePath, tagName) {
  return `${JSON.stringify(tagName)}: require(${JSON.stringify(requirePath)}).default`;
}
function generateComponentsCode(masterPageName, wrapperName, components) {
  const componentsCode = [
    generateComponentCode(masterPageName ? `@master-pages/${masterPageName}` : '@default-master-page', 'mp'),
    generateComponentCode(wrapperName ? `@components/${wrapperName}` : '@default-markdown-wrapper', 'mw'),
  ];

  if (components != null) {
    Object.keys(components).forEach(componentName => {
      const tagName = components[componentName];
      const requirePath = `@components/${componentName}`;
      componentsCode.push(generateComponentCode(requirePath, tagName));
    });
  }

  return `{` + componentsCode.join(',') + '}';
}

function createContainerLoaders(components, containerLoadersDir) {
  // TODO エラー処理
  const loaders = {};
  Object.keys(components).map(componentName => {
    const tagName = components[componentName];
    const loaderPath = path.join(containerLoadersDir, componentName);

    const loader = (loaderPath => {
      try {
        return require(loaderPath);
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
          return null;
        }
        throw err;
      }
    })(loaderPath);
    if (loader) {
      loaders[tagName] = loader;
    }
  });
  return loaders;
}

function camelcase(obj) {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    const res = [];
    obj.forEach(value => {
      res.push(camelcase(value));
    });
    return res;
  } else {
    const res = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      key = key.replace(/-([a-z])/g, (_, m1) => {
        return m1.toUpperCase();
      });
      res[key] = camelcase(value);
    });
    return res;
  }
}

module.exports = function(src) {
  const options = getOptions(this);
  const {
    content,
    data: {
      title,
      description,
      viewport,
      og,
      'append-head-tags': appendHeadTags,
      'master-page': masterPageName,
      wrapper: wrapperName,
      components,
    },
  } = Frontmatter.parse(src);

  const customContainerLoaders =
    components && options.containerLoadersDir ? createContainerLoaders(components, options.containerLoadersDir) : null;

  const res = renderMarkdown(
    {
      customContainerLoaders,
    },
    content
  );

  const componentsCode = generateComponentsCode(masterPageName, wrapperName, components);

  const headData = JSON.stringify({
    title,
    description,
    og: camelcase(og) || null,
    viewport: camelcase(viewport) || null,
    appendHeadTags,
  });
  return (
    `<template>\n` +
    `<mp><mw>${res.content}</mw></mp>\n` +
    `</template>` +
    `<script>` +
    `export default {` +
    `  'components': ${componentsCode}` +
    `}` +
    `</script>` +
    (res.hoistedTags || []).join('') +
    `<head>${headData}</head>`
  );
};
