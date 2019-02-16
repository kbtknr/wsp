const path = require('path');

function generateRouteCode(route) {
  let {
    urlPath,
    componentPath,
    alias,
    title,
    description
  } = route;

  if (typeof(urlPath) !== 'string' || typeof(componentPath) !== 'string') {
    return null
  }

  urlPath = JSON.stringify(urlPath);
  componentPath = JSON.stringify(componentPath);
  if (alias == null) {
    alias = '';
  } else {
    alias = `alias: ${JSON.stringify(alias)},`;
  }
  if (typeof(title) === 'string') {
    title = JSON.stringify(title);
  } else {
    title = 'null';
  }
  if (typeof(description) === 'string') {
    description = JSON.stringify(description);
  } else {
    description = 'null';
  }

  return `
    {
      path: ${urlPath},
      component: () => import(${componentPath}),
      ${alias}
      meta: {
        title: ${title},
        description: ${description}
      }
    }
  `;
}
function generateRouteWithChildrenCode(route) {
  let {
    urlPath,
    childrenCode
  } = route;
  urlPath = JSON.stringify(urlPath);

  return `
    {
      path: ${urlPath},
      component: (h) => h('router-view'),
      children: [
        ${childrenCode}
      ]
    }
  `;
}
function generateRoutesCode(dirname, nodes) {
  const routesCode = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const name = node.name;
    const pathname = `${dirname}/${name}`;

    if (node.children) {
      const childrenCode = generateRoutesCode(pathname, node.children);
      const urlPath = name;
      routesCode.push(generateRouteWithChildrenCode({
        urlPath,
        childrenCode
      }));
    } else {
      const ext = path.extname(name);
      const basename = path.basename(name, ext);
      const urlPath = basename;
      const componentPath = pathname;

      // TODO
      const title = `${basename} title`;
      const description = `desc of ${basename}`;

      routesCode.push(generateRouteCode({
        urlPath,
        componentPath,
        title,
        description
      }));
    }
  }

  return routesCode.join(',');
}
function generateRoutes(site) {
  const childrenCode = generateRoutesCode('@internal/pages', site.pages);
  const urlPath = '/';
  const routesCode = generateRouteWithChildrenCode({
    urlPath,
    childrenCode
  });
  return `
    import _ from '@internal/master-pages'
    export default [
      ${routesCode}
    ];
  `;
}

module.exports = generateRoutes;
