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

function generateImportMasterPagesCode(filepaths) {
  const importCodes = [];
  for (let i = 0; i < filepaths.length; i++) {
    const filepath = filepaths[i];
    const ext = path.extname(filepath);
    const basename = path.basename(filepath, ext);

    const varname = `mp${importCodes.length+1}`;
    const pathname = `@internal/master-pages/${basename}`;
    const vuename = `mp-${basename}`;
    importCodes.push(generateImportMasterPageCode({
      varname,
      pathname,
      vuename
    }));
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
