const MarkdownIt = require('markdown-it');
const MarkdownItSub = require('markdown-it-sub');
const MarkdownItSup = require('markdown-it-sup');
const MarkdownItIns = require('markdown-it-ins');

module.exports.renderMarkdown = function(config, content) {
  const mdconf = {
    html: true,
    xhtmlOut: false,
    breaks: true,
    typographer: false,
  };
  const md = MarkdownIt(mdconf)
    .use(MarkdownItSub)
    .use(MarkdownItSup)
    .use(MarkdownItIns);

  md.$data = {};
  md.$hoistedTags = [];

  (md => {
    let hasOpenRouterLink = false;

    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const hrefIndex = token.attrIndex('href');
      if (0 <= hrefIndex) {
        const link = token.attrs[hrefIndex];
        const href = link[1];
        const isExternal = /^https?:/.test(href);
        const isSourceLink = /(\/|\.md|\.vue|\.html)(#.*)?$/.test(href);
        if (isSourceLink) {
          hasOpenRouterLink = true;
          tokens[idx] = toRouterLink(token, link);
        }
      }
      return self.renderToken(tokens, idx, options);
    };
    function toRouterLink(token, link) {
      link[0] = 'to';
      let to = link[1];

      // convert link to filename and export it for existence check
      const links = md.$data.links || (md.$data.links = []);
      links.push(to);

      const indexRE = /(^|.*\/)index.(md|vue)(#?.*)$/i;
      const indexMatch = to.match(indexRE);
      if (indexMatch) {
        const [, path, , hash] = indexMatch;
        to = path + hash;
      } else {
        to = to.replace(/\.(?:md|vue)(#.*)?$/, (m, m1) => {
          return m1 != null ? m1 : '';
        });
      }

      // relative path usage.
      if (!to.startsWith('/')) {
        to = ensureBeginningDotSlash(to);
      }

      // markdown-it encodes the uri
      link[1] = decodeURI(to);

      // export the router links for testing
      const routerLinks = md.$data.routerLinks || (md.$data.routerLinks = []);
      routerLinks.push(to);

      return Object.assign({}, token, {
        tag: 'router-link',
      });
    }
    md.renderer.rules.link_close = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      if (hasOpenRouterLink) {
        token.tag = 'router-link';
        hasOpenRouterLink = false;
      }
      return self.renderToken(tokens, idx, options);
    };
    function ensureBeginningDotSlash(path) {
      if (/^\.\//.test(path)) {
        return path;
      }
      return './' + path;
    }
  })(md);
  (md => {
    md.renderer.rules.html_block = (tokens, idx) => {
      const content = tokens[idx].content;
      const reScriptStyle = /^<(script|style)(?=(\s|>|$))/i;
      if (reScriptStyle.test(content.trim())) {
        md.$hoistedTags.push(content);
        return '';
      } else {
        return content;
      }
    };
  })(md);
  (md => {
    [['code_inline', '<code'], ['code_block', '<pre'], ['fence', '<pre']].forEach(([rule, prefix]) => {
      const orig = md.renderer.rules[rule];
      md.renderer.rules[rule] = (...args) => {
        const res = orig(...args);
        if (res && res.indexOf(prefix) === 0) {
          const len = prefix.length;
          return res.substring(0, len) + ' v-pre ' + res.substring(len);
        }
        return res;
      };
    });
  })(md);

  const tokens = md.parse(content, {});
  content = md.renderer.render(tokens, md.options);
  // content = md.render(content);
  return {
    content,
    data: md.$data,
    hoistedTags: md.$hoistedTags,
  };
};
