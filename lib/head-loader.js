/*
 * headData = {
 *   title: string,
 *   description: string,
 *   og: false || {
 *     title: string,
 *     type: string,
 *     url: string,
 *     description: string,
 *     site_name: string,
 *     image: string,
 *     audio: string,
 *     video: string
 *   }
 * }
 */
module.exports = function(source, map) {
  this.callback(
    null,
    `module.exports = function(Component) {
      Component.options.headData = ${source}
    }`,
    map
  );
};
