const path = require('path');
const { getOptions } = require('loader-utils');
const { parseFrontmatter } = require('./frontmatter');
const { renderMarkdown } = require('./markdown');

function generateComponentCode(componentName, tagName) {
  const requirePath = `@internal/components/${componentName}`;
  return `${JSON.stringify(tagName)}: require(${JSON.stringify(requirePath)}).default`;
}
function generateComponentsCode(components) {
  const componentsCode = Object.keys(components).map(componentName => {
    const tagName = components[componentName];
    return generateComponentCode(componentName, tagName);
  });

  return `${JSON.stringify('components')}: {` + componentsCode.join(',') + '}';
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
      components,
    },
  } = parseFrontmatter(src);

  const customContainerLoaders =
    components && options.containerLoadersDir ? createContainerLoaders(components, options.containerLoadersDir) : null;

  const res = renderMarkdown(
    {
      customContainerLoaders,
    },
    content
  );

  const componentName = masterPageName != null && masterPageName != '' ? `mp-${masterPageName}` : 'page';

  const componentsCode = components ? generateComponentsCode(components) : '';

  const headData = JSON.stringify({
    title,
    description,
    og: camelcase(og) || null,
    viewport: camelcase(viewport) || null,
    appendHeadTags,
  });
  return (
    `<template>\n` +
    `<${componentName}>${res.content}</${componentName}>\n` +
    `</template>` +
    `<script>` +
    `export default {` +
    `${componentsCode}` +
    `}` +
    `</script>` +
    (res.hoistedTags || []).join('') +
    `<head>${headData}</head>`
  );
};
