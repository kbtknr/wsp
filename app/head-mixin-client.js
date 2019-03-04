import { getHeadData, eachOpenGraph, getViewport } from './head-mixin';

function hydrateMetaTag({ name, property, content }) {
  let key = null;
  let keyAttr = null;
  if (name != null) {
    keyAttr = 'name';
    key = name;
  }
  if (property != null) {
    keyAttr = 'property';
    key = property;
  }
  if (keyAttr == null) {
    return;
  }

  let valueAttr = null;
  let value = null;
  if (content != null) {
    valueAttr = 'content';
    value = content;
  }

  const ms = document.head.querySelectorAll(`meta[${keyAttr}="${key}"]`);
  if (0 < ms.length) {
    for (let i = 0; i < ms.length; i++) {
      if (i == 0 && value != null) {
        ms[i].setAttribute(valueAttr, value);
      } else {
        ms[i].parentNode.removeChild(ms[i]);
      }
    }
  } else if (value != null) {
    const m = document.createElement('meta');
    m.setAttribute(keyAttr, key);
    m.setAttribute(valueAttr, value);
    document.head.appendChild(m);
  }
}
function hydrateOpenGraph(headData) {
  eachOpenGraph(headData, (property, value) => {
    hydrateMetaTag({
      property,
      content: value,
    });
  });
}

export default {
  mounted() {
    const headData = getHeadData(this);
    if (!headData) {
      return;
    }

    document.title = headData.title || '';
    hydrateMetaTag('description', headData.description);
    hydrateMetaTag('viewport', getViewport(headData));
    hydrateOpenGraph(headData);
  },
};
