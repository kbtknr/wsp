export function getHeadData(vm) {
  const headData = vm.$options.headData;
  return typeof headData === 'function' ? headData.call(vm) : headData;
}

export function eachOpenGraph(headData, cb) {
  const fallback = {
    title: headData.title,
    description: headData.description
  };
  const { title, type, url, description, siteName, image, audio, video } =
    headData.og === false
      ? {}
      : headData.og == null || typeof headData.og !== 'object'
      ? fallback
      : Object.assign(fallback, headData.og);

  cb('og:title', title);
  cb('og:type', type);
  cb('og:url', url);
  cb('og:description', description);
  cb('og:site_name', siteName);
  cb('og:image', image);
  cb('og:audio', audio);
  cb('og:video', video);
}
