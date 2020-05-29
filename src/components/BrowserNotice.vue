<template>
  <blockquote class="browser">
    <h2>Attention</h2>
    <p>
      * Please note, this website is an experiment that uses a very large data
      set of images. This may affect your experience of it, due to your
      connectivity or the browser you use, and therefore it may not load
      properly. We advise you experience it on a desktop machine using the
      latest version of <a href="http://getfirefox.com">Firefox</a>,
      <a href="https://www.opera.com/">Opera</a>,
      <a href="https://www.apple.com/safari/">Safari</a>, or
      <a href="https://www.google.com/chrome/browser/index.html">Chrome</a>.
    </p>
  </blockquote>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

.browser {
  border-left: 0.25rem solid $bg-active;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  padding-left: 1rem;
}

a {
  color: inherit;
}
</style>
