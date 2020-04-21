<template>
  <router-link class="about" to="/about">
    ABOUT
  </router-link>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

.about {
  background-color: $bg-color;
  color: $text-color;
  text-decoration: none;
  display: block;
  width: 6rem;
  text-align: center;
  border-radius: 0.2rem;

  font-size: 1rem;
  margin: 0 0 0 1rem;
  padding: 0.5rem;
}
</style>
