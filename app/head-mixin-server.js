import { getHeadData, eachOpenGraph, getViewport } from './head-mixin';
import escape from 'escape-html';

function renderMetaTag(tags, { name, property, content }) {
  if (content == null) {
    return;
  }

  let keyPart = null;
  if (name != null) {
    keyPart = `name="${name}"`;
  }
  if (property) {
    keyPart = `property="${property}"`;
  }
  if (keyPart == null) {
    return;
  }

  let valuePart = '';
  if (content != null) {
    valuePart = `content="${escape(content)}"`;
  }

  tags.push(`<meta ${keyPart} ${valuePart} />`);
}
function renderOpenGraph(tags, headData) {
  eachOpenGraph(headData, (property, value) => {
    if (value != null) {
      renderMetaTag(tags, {
        property,
        content: value,
      });
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
    renderMetaTag(managedTags, {
      name: 'description',
      content: headData.description,
    });
    renderMetaTag(managedTags, {
      name: 'viewport',
      content: getViewport(headData),
    });
    renderOpenGraph(managedTags, headData);

    this.$ssrContext.headData = {
      title: headData.title,
      managedTags: managedTags.join(''),
    };
  },
};
