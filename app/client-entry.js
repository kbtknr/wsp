import { createApp } from './app';
import siteData from '@site-data';
import ga from './google-analytics';

const { app, router } = createApp();
router.onReady(() => {
  app.$mount('#app');

  if (process.env.NODE_ENV === 'production' && siteData.googleAnalytics) {
    ga(siteData.googleAnalytics, router);
  }
});
