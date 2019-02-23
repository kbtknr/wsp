export function getHeadData(vm) {
  const headData = vm.$options.headData;
  return typeof headData === 'function' ? headData.call(vm) : headData;
}
