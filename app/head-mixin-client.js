import { getHeadData, eachOpenGraph } from './head-mixin';

function setMetaTag(name, value) {
  const ms = document.head.querySelectorAll(`meta[name="${name}"]`);
  if (0 < ms.length) {
    for (let i = 0; i < ms.length; i++) {
      if (i == 0 && value != null) {
        ms[i].setAttribute('content', value);
      } else {
        ms[i].parentNode.removeChild(ms[i]);
      }
    }
  } else if (value != null) {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    m.setAttribute('content', value);
    document.head.appendChild(m);
  }
}
function setOpenGraph(property, value) {
  const ms = document.head.querySelectorAll(`meta[property="${property}"]`);
  if (0 < ms.length) {
    for (let i = 0; i < ms.length; i++) {
      if (i == 0 && value != null) {
        ms[i].setAttribute('content', value);
      } else {
        ms[i].parentNode.removeChild(ms[i]);
      }
    }
  } else if (value != null) {
    const m = document.createElement('meta');
    m.setAttribute('property', property);
    m.setAttribute('content', value);
    document.head.appendChild(m);
  }
}
function hydrateOpenGraph(headData) {
  eachOpenGraph(headData, (property, value) => {
    setOpenGraph(property, value);
  });
}

export default {
  mounted() {
    const headData = getHeadData(this);
    if (!headData) {
      return;
    }

    document.title = headData.title || '';
    setMetaTag('description', headData.description);

    hydrateOpenGraph(headData);
  },
};
