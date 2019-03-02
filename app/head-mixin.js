export function getHeadData(vm) {
  const headData = vm.$options.headData;
  return typeof headData === 'function' ? headData.call(vm) : headData;
}

export function eachOpenGraph(headData, cb) {
  const { title, description } =
    headData.og === false
      ? {}
      : headData.og == null || typeof headData.og !== 'object'
      ? {
          title: headData.title,
          description: headData.description,
        }
      : headData.og;

  cb('og:title', title);
  cb('og:description', description);
}
