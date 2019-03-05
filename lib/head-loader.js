/**
 * og_image: string || {
 *   url: string,
 *   secureUrl: string,
 *   type: string,
 *   width: number,
 *   height: number,
 *   alt: string
 * }
 * og_audio: string || {
 *   url: string,
 *   secureUrl: string,
 *   type: string
 * }
 * og_video: string || {
 *   url: string,
 *   secureUrl: string,
 *   type: string,
 *   width: number,
 *   height: number
 * }
 *
 * headData = {
 *   title: string,
 *   description: string,
 *   viewport: string || {
 *     width: string,
 *     height: string,
 *     initial_scale: string,
 *     maximum_scale: string,
 *     minimum_scale: string
 *   }
 *   og: false || {
 *     title: string,
 *     type: string,
 *     url: string,
 *     description: string,
 *     siteName: string,
 *     image: og_image,
 *     audio: og_audio,
 *     video: og_video,
 *     locale: string,
 *   },
 *   appendHeadTags: string
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
