import { getMeta } from './meta-mixin';

function setMetaTag(name, value) {
  const ms = document.head.querySelectorAll('meta[name="${name}"]');
  if (0 < ms.length) {
    for (let i = 0; i < ms.length; i++) {
      if (i == 0) {
        ms[i].setAttribute('content', value);
      } else {
        ms[i].parent.removeChild(ms[i]);
      }
    }
  } else {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    m.setAttribute('content', value);
    document.head.appendChild(m);
  }
}

export default {
  mounted() {
    const meta = getMeta(this);
    if (meta) {
      if (meta.title) {
        document.title = meta.title;
      }
      if (meta.description) {
        setMetaTag('description', meta.description);
      }
    }
  }
};
