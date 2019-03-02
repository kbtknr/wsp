import { getHeadData, eachOpenGraph } from './head-mixin';
import escape from 'escape-html';

function renderOpenGraph(headData) {
  const tags = [];
  eachOpenGraph(headData, (property, value) => {
    if (value) {
      tags.push(`<meta property="${property}" content="${escape(value)}" />`);
    }
  });
  return tags.join('');
}

export default {
  created() {
    const headData = getHeadData(this);
    if (!headData || !this.$ssrContext) {
      return;
    }

    const ogTags = renderOpenGraph(headData);

    this.$ssrContext.headData = {
      title: headData.title,
      description: headData.description,
      ogTags,
    };
  },
};
