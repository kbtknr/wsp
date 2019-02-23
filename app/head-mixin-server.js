import { getHeadData } from './head-mixin';
import escape from 'escape-html';

function renderOpenGraph(headData) {
  let title;
  let description;

  if (headData.og === false) {
    // noop
  } else if (headData.og == null || typeof headData.og !== 'object') {
    ({ title, description } = headData);
  } else {
    ({ title, description } = headData.og);
  }

  const tags = [];
  if (title) {
    tags.push(`<meta property="og:title" content="${escape(title)}" />`);
  }
  if (description) {
    tags.push(`<meta property="og:description" content="${escape(description)}" />`);
  }

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
