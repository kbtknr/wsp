import { getHeadData, eachOpenGraph, getViewport } from './head-mixin';
import escape from 'escape-html';

function renderMetaTag(tags, name, value) {
  if (name != null && value != null) {
    tags.push(`<meta name="${name}" content="${escape(value)}" />`);
  }
}
function renderOpenGraph(tags, headData) {
  eachOpenGraph(headData, (property, value) => {
    if (value) {
      tags.push(`<meta property="${property}" content="${escape(value)}" />`);
    }
  });
}

export default {
  created() {
    const headData = getHeadData(this);
    if (!headData || !this.$ssrContext) {
      return;
    }

    const managedTags = [];
    renderMetaTag(managedTags, 'description', headData.description);
    renderMetaTag(managedTags, 'viewport', getViewport(headData));
    renderOpenGraph(managedTags, headData);

    this.$ssrContext.headData = {
      title: headData.title,
      managedTags: managedTags.join(''),
    };
  },
};
