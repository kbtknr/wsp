import { getMeta } from './meta-mixin';

export default {
  created() {
    const meta = getMeta(this);
    console.log(`created: this.$root.$options.ssrContext=${this.$root.$options.ssrContext}`);
    this.$root.$options.ssrContext.meta = meta;
  }
};
