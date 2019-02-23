const matter = require('gray-matter');

module.exports.parseFrontmatter = function(content) {
  return matter(content, {});
};
