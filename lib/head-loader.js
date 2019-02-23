module.exports = function (source, map) {
  this.callback(null, `module.exports = function(Component) {Component.options.headData = ${source}}`, map);
}
