import { getHeadData, eachOpenGraph, getViewport, unmanagedMarker } from './head-mixin';
import escape from 'escape-html';

function renderMetaTag(tags, { name, httpEquiv, property, content }) {
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
  if (httpEquiv) {
    keyPart = `http-equiv="${httpEquiv}"`;
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

function renderUnmanagedTags(tags) {
  if (tags == null) {
    return null;
  }

  return `<!-- ${unmanagedMarker[0]} -->${tags}<!-- /${unmanagedMarker[1]} -->`;
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

    const appendHeadTags = renderUnmanagedTags(headData.appendHeadTags);

    this.$ssrContext.headData = {
      title: headData.title,
      managedTags: managedTags.join(''),
      appendHeadTags,
    };
  },
};
