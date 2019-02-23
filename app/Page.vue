<template>
  <div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  mounted() {
    console.log('page mounted');
  },
  destroyed() {
    console.log('page destroyed');
  },
};
</script>
