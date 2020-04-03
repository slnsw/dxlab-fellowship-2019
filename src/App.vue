<template>
  <div id="app">
    <router-view />
    <div id="dialog-root"></div>
  </div>
</template>

<style lang="scss">
@import '@/assets/reset';

@import '@/assets/widgets';

@import '@/assets/a11y-dialog';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
