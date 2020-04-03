<template>
  <div v-if="loaded" class="grid">
    <div class="header">
      <h1 class="total">
        <p v-if="currentBucket">
          <button type="button" class="button-back" @click="back">
            &lt; back to everything
          </button>
        </p>
        <strong>{{ formattedItemsTotal }}</strong> {{ description }}
      </h1>
    </div>
    <div :class="{ file: true, hidden: !fileData.id || fileHidden }" ref="file">
      <button class="button-hide" type="button" @click="fileHidden = true">
        hide
      </button>
      <div v-if="fileData.palette" class="palette">
        <span
          class="color"
          v-for="(color, index) in fileData.palette"
          :title="fileData.colorNames[index].join(', ')"
          :key="index"
          :style="{
            backgroundColor: color.color,
            width: color.percent * 100 + '%'
          }"
        ></span>
      </div>
      <div class="loading" v-if="!fileData.title">Loading...</div>
      <a
        :href="filesBaseUrl + '/' + fileData.id"
        rel="noopener"
        target="_blank"
      >
        <img
          v-if="fileData.image"
          :src="fileData.image"
          :alt="fileData.title"
          :title="fileData.title"
          class="thumbnail"
        />
      </a>
      <p v-if="fileData.title" class="file-description">
        <a
          :href="filesBaseUrl + '/' + fileData.id"
          rel="noopener"
          target="_blank"
        >
          {{ fileData.title }}
        </a>
      </p>
    </div>
    <div class="controls">
      <div class="sort">
        <router-link
          :class="['button-sort', sort === 'default' ? 'active' : '']"
          :to="{ path: '/' }"
        >
          default
        </router-link>
        <router-link
          :class="['button-sort', sort === 'hue' ? 'active' : '']"
          :to="{ path: '/', query: { sort: 'hue' } }"
        >
          color
        </router-link>
        <router-link
          :class="['button-sort', sort === 'similar' ? 'active' : '']"
          :to="{ path: '/', query: { sort: 'similar' } }"
        >
          similarity
        </router-link>
      </div>
      <div class="atlas">
        <label for="atlas">
          <input type="checkbox" id="atlas" v-model="toggleAtlases" />
          show thumbnails
        </label>
      </div>
    </div>

    <viz class="viz" ref="viz" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Viz from '@/components/Viz.vue'

const FILES_BASE_URL = process.env.VUE_APP_FILES_BASE_URL

export default {
  components: { Viz },
  data() {
    return { filesBaseUrl: FILES_BASE_URL, fileHidden: false }
  },
  watch: {
    $route(to) {
      const sort = to.query.sort ? to.query.sort : 'default'
      if (sort !== this.sort) this.$store.commit('setSort', sort)
    },
    fileData(newData) {
      if (newData.id) this.fileHidden = false
    }
  },
  methods: {
    back() {
      this.$refs.viz.backToEverything()
    }
  },
  computed: {
    toggleAtlases: {
      get() {
        return this.showAtlases
      },
      set(value) {
        this.$store.commit('setShowAtlases', value)
      }
    },
    description() {
      const l = Object.values(this.stuff).length
      return this.currentBucket
        ? this.currentBucket.description !== ''
          ? this.currentBucket.description.trim()
          : ''
        : Object.values(this.stuff)
            .filter((b) => b.count > 0)
            .map((s, index) => (index === l - 1 ? 'and ' + s.name : s.name))
            .join(', ')
    },
    total() {
      return this.itemsTotal
    },
    formattedItemsTotal() {
      return `${new Intl.NumberFormat().format(
        this.currentBucket ? this.currentBucket.count : this.totalFromBuckets
      )}${
        this.currentBucket
          ? ' ' +
            this.currentBucket.name.trim() +
            (this.currentBucket.description !== '' ? ':' : '')
          : ' '
      }`
    },
    ...mapGetters(['totalFromBuckets']),
    ...mapState([
      'fileData',
      'selectedBucket',
      'loaded',
      'itemsTotal',
      'stuff',
      'currentBucket',
      'sort',
      'showAtlases'
    ])
  },
  created() {
    this.$store.commit('setSort', this.$route.query.sort)
    this.$store.commit('getBuckets')
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

.grid {
  background-color: $bg-color;
  color: $main-color;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto 1fr 5rem;
}
.button-back {
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  background-color: $main-color;
  color: $bg-color;
  display: inline-block;
  text-decoration: none;
  border-radius: 0.2rem;
  margin: 0 0 0.25rem 0.25rem;
  padding: 0.125rem 0.5rem;
}
.header {
  background-color: transparentize($color: $bg-color, $amount: 0.25);
  grid-column: 1/4;
  grid-row: 1/2;
  z-index: 1;
}
.total {
  color: $main-color;
  font-size: 1.25rem;
  font-weight: normal;
  max-width: 60ch;
  margin: 0 auto;
  padding: 0.5rem;
}
.controls {
  grid-column: 1/4;
  grid-row: 3/4;
  z-index: 1;
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  background-color: transparentize($color: $bg-color, $amount: 0.5);
  width: 50%;
  min-width: 20rem;
}
.sort {
  display: flex;
  padding-top: 0.5rem;
}
.atlas {
  padding-bottom: 0.5rem;
}
.button-sort {
  background-color: $main-color;
  color: $bg-color;
  text-decoration: none;
  display: inline-block;
  border-radius: 0.2rem;
  margin: 0 0 0.5rem 0.5rem;
  padding: 0.25rem 1rem;

  &:first-child {
    margin-left: 0;
  }

  &.active {
    background-color: $bg-active;
  }
}
.viz {
  grid-column: 1/4;
  grid-row: 1/4;
}
.file {
  align-self: center;
  justify-self: end;
  background-color: transparentize($color: $bg-color, $amount: 0.1);
  grid-row: 2/3;
  grid-column: 3/4;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
  width: 300px;
  max-width: 30vw;
  z-index: 1;
  transition: transform 0.2s ease-out;
  transform: translateX(0%);
  margin: -1rem 0 -1rem -1rem;

  &.hidden {
    transform: translateX(100%);
  }
}
.button-hide {
  align-self: flex-start;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  background-color: $main-color;
  color: $bg-color;
  display: inline-block;
  text-decoration: none;
  border-radius: 0.2rem;
  margin: 0 0 0.5rem 0.5rem;
  padding: 0.125rem 0.5rem;
}
.loading {
  background-color: transparentize($color: $bg-color, $amount: 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 50% 0;
}
.palette {
  display: flex;
}
.color {
  font-size: 0.75rem;
  height: 2rem;
  padding: 0.5rem;
}
.thumbnail {
  object-fit: cover;
  width: 100%;
  height: auto;
}
.file-description {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0.5rem 0.5rem 0 0.5rem;

  a {
    color: $main-color;
  }
}
</style>

<style lang="scss">
body {
  overflow: hidden;
}
</style>
