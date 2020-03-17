<template>
  <div v-if="loaded" class="grid">
    <div class="header">
      <h1 class="total">
        <strong>{{ formattedItemsTotal }}</strong> {{ thing }}.
      </h1>
    </div>
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
    </div>
    <viz class="viz" />
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
  computed: {
    thing() {
      const l = Object.values(this.stuff).length
      return this.currentBucket
        ? this.currentBucket.name.trim()
        : Object.values(this.stuff)
            .filter((b) => b.count > 0)
            .map((s, index) => (index === l - 1 ? 'and ' + s.name : s.name))
            .join(', ')
    },
    total() {
      return this.itemsTotal
    },
    formattedItemsTotal() {
      return new Intl.NumberFormat().format(
        this.currentBucket ? this.currentBucket.count : this.totalFromBuckets
      )
    },
    ...mapGetters(['totalFromBuckets']),
    ...mapState(['loaded', 'itemsTotal', 'stuff', 'currentBucket', 'sort'])
  },
  created() {
    this.$store.commit('setSort', this.$route.query.sort)
    this.$store.commit('getBuckets')
  }
}
</script>

<style lang="scss" scoped>
$main-color: wheat;
$bg-color: hsl(0, 0%, 0%, 1);
$bg-active: hsl(0, 0%, 44%);

.grid {
  background-color: $bg-color;
  color: $main-color;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 6rem 2.5rem;
}
.header {
  background-color: transparentize($color: $bg-color, $amount: 0.5);
  grid-column: 1/2;
  grid-row: 2/3;
  z-index: 2;
  pointer-events: none;
}
.total {
  display: inline-block;
  color: $main-color;
  font-size: 1.25rem;
  font-weight: normal;
  padding: 0.5rem;
}
.sort {
  background-color: transparentize($color: $bg-color, $amount: 0.5);
  display: flex;
  grid-column: 1/2;
  grid-row: 3/4;
  z-index: 1;

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
  grid-column: 1/2;
  grid-row: 1/4;
}
</style>

<style lang="scss">
body {
  overflow: hidden;
}
</style>
