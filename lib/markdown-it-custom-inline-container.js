/**
 * Inline level custom container
 * [content]{tag #id .class attr=val}
 */
const { parseTagParams } = require('./markdown-common');

module.exports = function CustomInlineContainer(md, options) {
  const loaders = options.loaders || {};
  function rule(state, silent) {
    const src = state.src;
    const max = state.posMax;
    let pos = state.pos;

    if (src.charCodeAt(pos) !== 0x5b /* [ */) {
      return false;
    }

    let labelStart = pos + 1;
    let labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, false);
    if (labelEnd < 0) {
      return false;
    }
    pos = labelEnd + 1;
    if (max <= pos || src.charCodeAt(pos) !== 0x7b /* { */) {
      return false;
    }
    pos++;

    let paramsStart = pos;
    for (; pos < max && src.charCodeAt(pos) !== 0x7d /* } */; pos++);
    if (max <= pos) {
      return false;
    }
    const content = src.slice(labelStart, labelEnd);
    const params = src.slice(paramsStart, pos);

    if (!silent) {
      token = state.push('container_inline', 'span', 1);
      parseTagParams(token, params);

      const tagName = token.tag;
      if (loaders[tagName] && loaders[tagName].inline) {
        loaders[tagName].inline();
      }

      token = state.push('text', '', 0);
      token.content = content;

      token = state.push('container_inline', tagName, -1);
    }

    state.pos = pos + 1;
    return true;
  }

  md.inline.ruler.before('link', 'inline-container', rule);
};
