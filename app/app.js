import Vue from 'vue';
import { createRouter } from './router.js';
import headMixin from '@head-mixin';
import Page from './Page.vue';

Vue.component('page', Page);

Vue.mixin(headMixin);

export function createApp() {
  const router = createRouter();

  const app = new Vue({
    router,
    render: (h) => h('div', { attrs: { id: 'app' } }, [
      h('router-view')
    ])
  });
  return { app, router };
}
