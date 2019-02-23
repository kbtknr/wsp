const { getOptions } = require('loader-utils');
const { parseFrontmatter } = require('./frontmatter');
const { renderMarkdown } = require('./markdown');

module.exports = function(src) {
  const options = getOptions(this);
  const {
    content,
    data: { title, description, og, 'master-page': masterPageName },
  } = parseFrontmatter(src);
  const res = renderMarkdown({}, content);

  const componentName = masterPageName != null && masterPageName != '' ? `mp-${masterPageName}` : 'page';
  const headData = JSON.stringify({
    title,
    description,
    og,
  });
  return (
    `<template>\n` +
    `<${componentName}>${res.content}</${componentName}>\n` +
    `</template>` +
    (res.hoistedTags || []).join('') +
    `<head>${headData}</head>`
  );
};
