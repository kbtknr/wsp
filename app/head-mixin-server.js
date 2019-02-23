import { getHeadData } from './head-mixin';

export default {
  created() {
    const headData = getHeadData(this);
    if (headData && this.$ssrContext) {
      const { title, description } = headData;
      this.$ssrContext.headData = {
        title, description
      };
    }
  }
};
