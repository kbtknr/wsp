<template>
  <mp-master-page1>
    <h1>Page1.vue</h1>
    <other-com />
    <router-link to="page2">page2</router-link>
  </mp-master-page1>
</template>

<script>
export default {
  components: {
    'other-com': require('../components/OtherComponent.vue').default
  }
};
</script>
<head>
{
  "title": "page1",
  "description": "desc of page1",
  "og": {
    "type": "website",
    "url": "http://vuepressdoc/page1",
    "siteName": "vuepressdoc site"
  }
}
</head>
