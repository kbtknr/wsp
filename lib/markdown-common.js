module.exports.parseTagParams = function(token, strParams) {
  const params = strParams.split(/\s+/);
  let tagName,
    id,
    classNames = [];

  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    if (param === '') {
      continue;
    }
    if (param.includes('=')) {
      let kv = param.split('=', 2);
      token.attrJoin(kv[0], kv[1]);
    } else if (param[0] === '#') {
      id = param.slice(1);
    } else if (param[0] === '.') {
      classNames.push(param.slice(1));
    } else {
      tagName = param;
    }
  }
  if (tagName) {
    token.tag = tagName;
  }
  if (token.nesting !== -1) {
    if (id) {
      token.attrJoin('id', id);
    }
    if (classNames.length > 0) {
      token.attrJoin(
        'v-bind:class',
        `[${classNames.map(name => `$style[${JSON.stringify(name)}]||${JSON.stringify(name)}`).join(',')}]`
      );
    }
  }
};
