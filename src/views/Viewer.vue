<template>
  <div v-if="loaded" class="grid">
    <div class="header">
      <h1 class="total">
        <p v-if="currentBucket">
          <button class="back" @click="back">&lt; back to everything</button>
        </p>
        <strong>{{ formattedItemsTotal }}</strong> {{ description }}
      </h1>
    </div>
    <div class="controls">
      <div class="sort">
        <router-link
          :class="['sort-button', sort === 'default' ? 'active' : '']"
          :to="{ path: '/' }"
        >
          default
        </router-link>
        <router-link
          :class="['sort-button', sort === 'hue' ? 'active' : '']"
          :to="{ path: '/', query: { sort: 'hue' } }"
        >
          color
        </router-link>
        <router-link
          :class="['sort-button', sort === 'similar' ? 'active' : '']"
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

export default {
  components: { Viz },
  data() {
    return {}
  },
  watch: {
    $route(to) {
      const sort = to.query.sort ? to.query.sort : 'default'
      if (sort !== this.sort) this.$store.commit('setSort', sort)
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
  grid-template-rows: auto 1fr auto;
}
.back {
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
  background-color: transparentize($color: $bg-color, $amount: 0.5);
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
  align-items: center;
  background-color: transparentize($color: $bg-color, $amount: 0.5);
  display: flex;
  flex-direction: column;
  grid-column: 2/3;
  grid-row: 3/4;
  padding: 0.5rem 0;
  z-index: 1;
}
.sort {
  display: flex;

  li {
    margin: 0 0 0 0.5rem;
  }
}
.sort-button {
  background-color: $main-color;
  color: $bg-color;
  text-decoration: none;
  display: inline-block;
  border-radius: 0.2rem;
  margin: 0 0 0.5rem 0.5rem;
  padding: 0.25rem 1rem;

  &.active {
    background-color: $bg-active;
  }
}
.viz {
  grid-column: 1/4;
  grid-row: 1/4;
}
</style>

<style lang="scss">
body {
  overflow: hidden;
}
</style>
