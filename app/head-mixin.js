export function getHeadData(vm) {
  const headData = vm.$options.headData;
  return typeof headData === 'function' ? headData.call(vm) : headData;
}

export function eachOpenGraph(headData, cb) {
  const fallback = {
    title: headData.title,
    description: headData.description
  };
  const { title, type, url, description, siteName, locale, image, audio, video } =
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
  cb('og:locale', locale);

  if (image == null || typeof image !== 'object') {
    cb('og:image', image);
    cb('og:image:secure_url', null);
    cb('og:image:type', null);
    cb('og:image:width', null);
    cb('og:image:height', null);
    cb('og:image:alt', null);
  } else {
    cb('og:image', image.url);
    cb('og:image:secure_url', image.secureUrl);
    cb('og:image:type', image.type);
    cb('og:image:width', image.width);
    cb('og:image:height', image.height);
    cb('og:image:alt', image.alt);
  }

  if (audio == null || typeof audio !== 'object') {
    cb('og:audio', audio);
    cb('og:audio:secure_url', null);
    cb('og:audio:type', null);
  } else {
    cb('og:audio', audio.url);
    cb('og:audio:secure_url', audio.secureUrl);
    cb('og:audio:type', audio.type);
  }

  if (video == null || typeof video !== 'object') {
    cb('og:video', video);
    cb('og:video:secure_url', null);
    cb('og:video:type', null);
    cb('og:video:width', null);
    cb('og:video:height', null);
  } else {
    cb('og:video', video.url);
    cb('og:video:secure_url', video.secureUrl);
    cb('og:video:type', video.type);
    cb('og:video:width', video.width);
    cb('og:video:height', video.height);
  }
}
