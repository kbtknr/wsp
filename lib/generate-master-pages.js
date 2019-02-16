const path = require('path');

function generateImportMasterPageCode(mp) {
  let {
    varname,
    pathname,
    vuename
  } = mp;
  pathname = JSON.stringify(pathname);
  vuename = JSON.stringify(vuename);
  return `
    import ${varname} from ${pathname};
    Vue.component(${vuename}, ${varname});
  `;
}

function generateImportMasterPagesCode(nodes) {
  const importCodes = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node.children) {
      const extname = path.extname(node.name);
      if (extname !== '.vue') {
        continue
      }

      const varname = `mp${importCodes.length+1}`;
      const pathname = `@internal/master-pages/${node.name}`;
      const vuename = `mp-${node.name}`;
      importCodes.push(generateImportMasterPageCode({
        varname,
        pathname,
        vuename
      }));
    }
  }

  return importCodes.join('');
}

function generateMasterPages(site) {
  const importMasterPagesCode = generateImportMasterPagesCode(site.masterPages);
  return `
    import Vue from 'vue';

    ${importMasterPagesCode}
  `;
}

module.exports = generateMasterPages;
