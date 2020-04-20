<template>
  <div class="wrapper">
    <section class="intro">
      <h1 id="aereo">
        <img
          class="logo-aereo"
          :src="baseUrl + 'assets/logo-txt.svg'"
          alt="Aereo"
        />
        <span class="visuallyhidden">Aereo</span>
      </h1>
      <div class="hero">
        <img
          class="image-hero"
          :src="`${baseUrl}assets/hero@0.5x.jpg`"
          alt=""
          :srcset="
            `${baseUrl}assets/hero.jpg 1x, ${baseUrl}assets/hero@2x.jpg 2x`
          "
        />
      </div>
      <p class="lede">
        An experimental bird’s eye view of the digital collections from the
        State Library of NSW.
      </p>
      <router-link class="enter" to="/viewer">
        ENTER
      </router-link>
      <router-link class="about" to="/about">
        ABOUT
      </router-link>
    </section>
    <Footer />
    <SpecialCare />
  </div>
</template>

<script>
import { mapState } from 'vuex'

import Footer from '@/components/Footer'
import SpecialCare from '@/components/SpecialCare'

const BASE_URL = process.env.BASE_URL

export default {
  components: { Footer, SpecialCare },
  data() {
    return {
      baseUrl: BASE_URL
    }
  },
  computed: {
    total() {
      return this.bucketNames.length
    },
    bucketNames() {
      return Object.values(this.stuff)
    },
    ...mapState(['stuff', 'sort'])
  },
  methods: {
    pathFor(sort, bucket) {
      const path = { path: '/viewer', query: {} }
      if (bucket) path.query.bucket = bucket.key
      if (sort && sort !== 'default') path.query.sort = sort
      return path
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

.wrapper {
  min-height: 100vh;
  max-width: 100vw;
  margin: 0 auto;
  position: relative;
}

.intro {
  min-height: 100vh;
  margin-bottom: -4.5rem;

  @media screen and (max-width: 720px) {
    margin-bottom: -5.75rem;
  }
}

#aereo {
  padding: 1rem 0 1rem 1rem;
}

.logo-aereo {
  width: 6rem;
  height: 6rem;
}

h3 {
  margin-top: 2rem;
}

p {
  margin-bottom: 1rem;
}

.hero {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  z-index: -1;
  filter: brightness(0.75);
  overflow: hidden;
}

.image-hero {
  @media screen and (max-width: 110ch) {
    height: 100%;
    max-width: initial;
  }
}

.lede {
  background-color: $bg-color;
  font-size: 1.2rem;
  max-width: 30ch;
  margin: 0 0 0 1rem;
  padding: 0.25rem 0.5rem;

  @media screen and (max-width: 90ch) {
    font-size: 1.2rem;
  }
}

.enter,
.about {
  font-size: 1.5rem;
  background-color: $bg-color;
  color: $text-color;
  text-decoration: none;
  display: block;
  width: 8rem;
  text-align: center;
  border-radius: 0.2rem;
  margin: 2rem auto;
  padding: 0.5rem 1rem;
}

.about {
  font-size: 1.25rem;
  margin: 1rem;
  padding: 0.5rem;
  display: inline-block;
}
</style>
