const matter = require('gray-matter');

module.exports.parse = function(content) {
  return matter(content, {});
};
