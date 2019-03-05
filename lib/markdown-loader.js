const { getOptions } = require('loader-utils');
const { parseFrontmatter } = require('./frontmatter');
const { renderMarkdown } = require('./markdown');

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
    data: { title, description, viewport, og, 'append-head-tags': appendHeadTags, 'master-page': masterPageName },
  } = parseFrontmatter(src);
  const res = renderMarkdown({}, content);

  const componentName = masterPageName != null && masterPageName != '' ? `mp-${masterPageName}` : 'page';
  const headData = JSON.stringify({
    title,
    description,
    og: camelcase(og) || null,
    viewport: camelcase(viewport) || null,
    appendHeadTags
  });
  return (
    `<template>\n` +
    `<${componentName}>${res.content}</${componentName}>\n` +
    `</template>` +
    (res.hoistedTags || []).join('') +
    `<head>${headData}</head>`
  );
};
