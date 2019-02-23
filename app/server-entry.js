import Vue from 'vue';
import { createApp } from './app';

export default context =>
  new Promise((resolve, reject) => {
    const { app, router } = createApp();
    const { url } = context;
    const fullPath = router.resolve(url).route.fullPath;

    if (url !== fullPath) {
      return reject({ url: fullPath });
    }

    router.push(url);
    router.onReady(() => {
      const matchedComponent = router.getMatchedComponents();
      if (!matchedComponent.length) {
        reject({
          code: 404,
        });
        return;
      }

      resolve(app);
    }, reject);
  });
