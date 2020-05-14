<template>
  <div>
    <div class="wrapper">
      <section class="intro">
        <h1 id="aereo">
          <router-link to="/">
            <img
              class="logo-aereo"
              :src="baseUrl + 'assets/logo-txt.svg'"
              alt="Aereo"
            />
          </router-link>
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
          <router-link to="/viewer">
            <em>Aereo</em>
          </router-link>
          is the result of the
          <a
            href="https://dxlab.sl.nsw.gov.au/blog/winner-dx-lab-fellowship-3"
            target="_blank"
            rel="noopener"
            >DX Lab Fellowship #3</a
          >
          built by Interaction Designer and Developer Mauricio Giraldo.
        </p>
      </section>
      <section class="categories">
        <img
          class="standalone image-categories"
          :src="`${baseUrl}assets/categories@0.5x.jpg`"
          alt="The main view of categories in Aereo"
          :srcset="
            `${baseUrl}assets/categories.jpg 1x, ${baseUrl}assets/categories@2x.jpg 2x`
          "
        />

        <p>
          The DX Lab Fellowship is supported through a gift to the
          <a
            href="http://www.sl.nsw.gov.au/about-library/foundation"
            target="_blank"
            rel="noopener"
          >
            State Library of NSW Foundation
          </a>
          – a not-for-profit organisation.
        </p>

        <p>
          This experimental interface explores items from the digital
          collections of the State Library of NSW and shows them as a whole,
          rather than a list of discrete items of files in response to a keyword
          search.
        </p>

        <p>
          By displaying approximately 1.2 million files in a single interface,
          it encourages a broad based and serendipitous exploration of the
          digital collection. There are 18 different categories that can be
          explored, each sorted in four ways:
        </p>

        <h3>
          Unsorted
        </h3>

        <p>
          This is the default way the files were returned by a query done to the
          library database.
        </p>

        <h3>
          Year
        </h3>
        <p>
          This is the year the item was published. In the case of a date range,
          the first date has been used.
        </p>

        <h3>
          Colour
        </h3>
        <p>
          All images were processed through a colour summariser that extracted
          prominent colours. Colour sorting is
          <router-link
            :to="{
              path: '/viewer',
              query: { bucket: 'pictures', sort: 'hue' }
            }"
            >better viewed when image thumbnails are not visible</router-link
          >.
        </p>

        <h3>Look alike</h3>
        <p>
          Machine learning of image tagging has been used here to find images
          that are similar.
        </p>

        <video
          class="video"
          type="video/mp4"
          height="auto"
          preload
          loop
          autoplay
          muted
          playsInline
        >
          <source :src="`${baseUrl}assets/sorting.mp4`" type="video/mp4" />
          <p>
            This displays a video. You can
            <a
              :href="`${baseUrl}assets/sorting.mp4`"
              target="_blank"
              rel="noopener"
              >download the video</a
            >
            instead.
          </p>
        </video>

        <p>
          You can read more about the making of this experiment in
          <mark> this blog post </mark>.
        </p>

        <p>
          If you would like more information about the collection or the Library
          services please use the
          <a
            href="https://www.sl.nsw.gov.au/research-and-collections/ask-librarian over bold text"
            target="_blank"
            rel="noopener"
            >Ask a Librarian</a
          >
          service.
        </p>

        <p>
          Contact DX Lab at
          <a href="mailto:dxlab@sl.nsw.gov.au?subject=Contact from Aereo"
            >dxlab@sl.nsw.gov.au</a
          >.
        </p>
      </section>
    </div>
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
  min-height: 100%;
  max-width: 70ch;
  margin: 0 auto;
  padding: 0 1rem;
}

section {
  margin-bottom: 3rem;
}

.logo-aereo {
  width: 6rem;
  height: 6rem;
  margin: 1rem 0 1rem -3rem;

  @media screen and (max-width: 90ch) {
    width: 6rem;
    height: 6rem;
    margin-left: -1rem;
  }
}

h3 {
  margin-top: 2rem;
}

p {
  margin-bottom: 1rem;
}

table {
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border-bottom: 0.0625rem solid $border-color;
    padding: 0.25rem 0.5rem;
  }

  td {
    text-align: right;
  }

  td:nth-child(1) {
    text-align: left;
  }

  th {
    white-space: nowrap;
  }

  .name {
    text-align: left;
  }
}

.hero {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  z-index: -1;
  filter: brightness(0.75);
  mask-image: linear-gradient(
    transparentize($bg-color, 0.55),
    transparent 90vh
  );
  overflow: hidden;
}

.image-hero {
  @media screen and (max-width: 90ch) {
    height: 100%;
    max-width: initial;
  }
}

.lede {
  font-size: 1.25rem;
  text-align: center;
  background-color: $bg-color;
  padding: 1rem;

  @media screen and (max-width: 90ch) {
    font-size: 1.2rem;
  }
}

.enter {
  font-size: 1.5rem;
  background-color: $main-color;
  color: $bg-color;
  text-decoration: none;
  display: block;
  width: 8rem;
  text-align: center;
  border-radius: 0.2rem;
  margin: 2rem auto;
  padding: 0.25rem 1rem;
}

.standalone {
  display: block;
  margin: 2rem auto;
}

.video {
  display: block;
  width: 70%;
  margin: 2rem auto;
}

.palettes,
.predictions {
  align-items: flex-start;
  display: flex;
  margin: 2rem auto;
}

.predictions {
  width: 100%;

  &.first {
    margin-bottom: 1px;
  }

  &.second {
    margin-top: 0;
  }
}

.image-predictions {
  width: 50%;
  margin-right: 1px;

  &:last-child {
    margin-right: 0;
  }
}

.image-palette {
  margin-right: 1px;
  width: 33%;

  &:last-child {
    margin-right: 0;
  }
}

.footnotes {
  background-color: lighten($bg-color, 5%);
  border-top: 0.125rem solid $border-color;
  padding: 0.5rem 0.5rem 0.25rem;
}
</style>
