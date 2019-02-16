export function getMeta(vm) {
  const meta = vm.$options.meta;
  return typeof(meta) === 'function' ? meta.call(vm) : meta;
}
