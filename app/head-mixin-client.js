import { getHeadData, eachOpenGraph, getViewport, unmanagedMarker } from './head-mixin';

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

function findUnmanagedRangeNode() {
  const head = document.head;
  let start = null;
  let end = null;
  for (let node = head.firstChild; node; node = node.nextSibling) {
    if (node.nodeType !== Node.COMMENT_NODE) {
      continue;
    }
    if (start == null && 0 <= node.nodeValue.indexOf(unmanagedMarker[0])) {
      start = node;
    } else if (end == null && 0 <= node.nodeValue.indexOf(unmanagedMarker[1])) {
      end = node;
      break;
    }
  }
  return { start, end };
}
function removeUnmanagedTags({ start, end }) {
  if (start == null) {
    return;
  }
  const head = document.head;
  while (start.nextSibling != end) {
    head.removeChild(start.nextSibling);
  }
}
function appendUnmanagedTags({ start, end }, tags) {
  if (tags == null || tags.length === 0) {
    return;
  }

  const head = document.head;
  const tmp = document.createElement('meta');
  if (start == null) {
    head.appendChild(tmp);
    tags = `<!-- ${unmanagedMarker[0]} -->${tags}`;
  } else {
    head.insertBefore(tmp, start.nextSibling);
  }
  if (end == null) {
    tags = `${tags}<!-- ${unmanagedMarker[1]} -->`;
  }
  tmp.insertAdjacentHTML('afterend', tags);
  head.removeChild(tmp);
}

export default {
  mounted() {
    const headData = getHeadData(this);
    if (!headData) {
      return;
    }

    const unmanagedRange = findUnmanagedRangeNode();
    removeUnmanagedTags(unmanagedRange);

    document.title = headData.title || '';
    hydrateMetaTag({
      property: 'description',
      content: headData.description,
    });
    hydrateMetaTag({
      property: 'viewport',
      content: getViewport(headData),
    });
    hydrateOpenGraph(headData);

    const appendHeadTags = headData.appendHeadTags;
    appendUnmanagedTags(unmanagedRange, appendHeadTags);
  },
};
