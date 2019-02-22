import { getMeta } from './meta-mixin';

export default {
  created() {
    const meta = getMeta(this);

    if (this.$ssrContext) {
      this.$ssrContext.meta = meta;
    }
  }
};
