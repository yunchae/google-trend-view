<template>
  <div id="app">
    <GoogleTrend/>
  </div>
</template>

<script>
import GoogleTrend from './components/GoogleTrend.vue'

export default {
  name: 'App',
  components: {
    GoogleTrend
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
