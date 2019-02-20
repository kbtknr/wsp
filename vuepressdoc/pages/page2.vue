<template>
  <mp-master-page2>
    <h1>Page2.vue</h1>
    <other-com />
    <router-link to="page1">page1</router-link>
  </mp-master-page2>
</template>

<script>
export default {
  meta: {
    title: 'page2',
    description: 'desc of page2'
  },
  components: {
    'other-com': require('../components/OtherComponent.vue').default
  }
};
</script>
