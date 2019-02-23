const path = require('path');

const defaultIndexNames = ['index.vue', 'index.md'];
function findDefaultIndex(nodes, names) {
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    for (let j = 0; j < nodes.length; j++) {
      if (nodes[j].name === name) {
        return nodes[j];
      }
    }
  }
  return null;
}

function generateRouteCode(route) {
  let { urlPath, componentPath, alias } = route;

  if (typeof urlPath !== 'string' || typeof componentPath !== 'string') {
    return null;
  }

  urlPath = JSON.stringify(urlPath);
  componentPath = JSON.stringify(componentPath);
  if (alias == null) {
    alias = '';
  } else {
    alias = `alias: ${JSON.stringify(alias)},`;
  }
  return `
    {
      path: ${urlPath},
      component: () => import(${componentPath}),
      ${alias}
    }
  `;
}
function generateRouteWithChildrenCode(route) {
  let { urlPath, childrenCode } = route;
  urlPath = JSON.stringify(urlPath);

  return `
    {
      path: ${urlPath},
      component: {
        render(c) { return c('router-view') }
      },
      children: [
        ${childrenCode}
      ]
    }
  `;
}
function generateRoutesCode(dirname, nodes, defaultNode) {
  const routesCode = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const name = node.name;
    const pathname = `${dirname}/${name}`;

    if (node.children) {
      const defaultChildNode = findDefaultIndex(node.children, defaultIndexNames);
      const childrenCode = generateRoutesCode(pathname, node.children, defaultChildNode);
      const urlPath = name;
      routesCode.push(
        generateRouteWithChildrenCode({
          urlPath,
          childrenCode,
        })
      );
    } else {
      const ext = path.extname(name);
      const basename = path.basename(name, ext);
      const urlPath = basename;
      const componentPath = pathname;

      const alias = node === defaultNode ? [''] : null;

      routesCode.push(
        generateRouteCode({
          urlPath,
          componentPath,
          alias,
        })
      );
    }
  }

  return routesCode.join(',');
}
function generateRoutes(site) {
  const defaultChildNode = findDefaultIndex(site.pages, defaultIndexNames);
  const childrenCode = generateRoutesCode('@internal/pages', site.pages, defaultChildNode);
  const urlPath = '/';
  const routesCode = generateRouteWithChildrenCode({
    urlPath,
    childrenCode,
  });
  return `
    import _ from '@internal/master-pages'
    export default [
      ${routesCode}
    ];
  `;
}

module.exports = generateRoutes;
