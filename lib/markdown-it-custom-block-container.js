/**
 * Block level custom container
 */

const { parseTagParams } = require('./markdown-common');

function isMarker(src, pos, max) {
  const res =
    (pos + 3 <= max &&
    src.charCodeAt(pos) === 0x3a /* : */ &&
    src.charCodeAt(pos + 1) === 0x3a /* : */ &&
    src.charCodeAt(pos + 2) === 0x3a /*: */);
  return res ? 3 : 0;
}

module.exports = function CustomBlockContainer(md, options) {
  const loaders = options.loaders || {};
  function rule(state, startLine, endLine, silent) {
    const src = state.src;
    let pos = state.bMarks[startLine];
    let end = state.eMarks[startLine];
    let nested = 1;

    let markerLen = isMarker(src, pos, end);
    if (markerLen == 0) {
      return false;
    }
    if (silent) {
      return true;
    }

    const markup = src.slice(pos, pos + markerLen);
    pos += markerLen;
    const params = src.slice(pos, end);

    let currentLine = startLine;
    let autoClose = true;
    for (;;) {
      currentLine++;
      if (endLine <= currentLine) {
        break;
      }

      pos = state.bMarks[currentLine];
      end = state.eMarks[currentLine];
      markerLen = isMarker(src, pos, end);
      if (markerLen === 0) {
        continue;
      }
      pos += markerLen;
      if (0 < src.slice(pos, end).trim().length) {
        nested++;
        continue;
      }

      if (--nested === 0) {
        autoClose = false;
        break;
      }
    }

    let token;

    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;
    state.parentType = 'container';
    state.lineMax = currentLine;

    token = state.push('container', 'div', 1);
    token.markup = markup;
    parseTagParams(token, params);
    token.map = [startLine, currentLine];

    const tagName = token.tag;
    const defaultTokenize = (state, startLine, endLine) => {
      state.md.block.tokenize(state, startLine, endLine);
    };
    if (loaders[tagName] && loaders[tagName].block) {

      loaders[tagName].block(defaultTokenize, state, startLine + 1, currentLine);
    } else {
      defaultTokenize(state, startLine + 1, currentLine);
    }
    // state.md.block.tokenize(state, startLine + 1, currentLine);

    token = state.push('container', token.tag, -1);
    token.markup = markup.slice(0);

    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = currentLine + (autoClose ? 0 : 1);

    return true;
  }

  md.block.ruler.before('fence', 'container', rule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
};
