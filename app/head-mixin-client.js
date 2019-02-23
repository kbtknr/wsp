import { getHeadData } from './head-mixin';

function setMetaTag(name, value) {
  const ms = document.head.querySelectorAll(`meta[name="${name}"]`);
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
    const headData = getHeadData(this);
    if (headData) {
      if (headData.title) {
        document.title = headData.title;
      }
      if (headData.description) {
        setMetaTag('description', headData.description);
      }
    }
  },
};
