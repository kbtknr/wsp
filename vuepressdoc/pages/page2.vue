<template>
  <mp-master-page2>
    <h1>Page2.vue</h1>
    <other-com />
    <router-link to="page1">page1</router-link>
  </mp-master-page2>
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
  "title": "page2",
  "description": "desc of page2",
  "og": {
    "title": "page2 for og",
    "description": "page2 desc for og",
    "type": "website",
    "url": "http://vuepressdoc/page2",
    "siteName": "vuepressdoc site"
  }
}
</head>
