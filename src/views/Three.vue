<template>
  <div v-if="loaded" class="grid">
    <div class="header">
      <h1 class="total">
        <strong>{{ formattedItemsTotal }}</strong> {{ thing }}.
      </h1>
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
  computed: {
    thing() {
      const l = Object.values(this.stuff).length
      return this.currentBucket
        ? this.currentBucket.name.trim()
        : Object.values(this.stuff)
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
    ...mapState(['loaded', 'itemsTotal', 'stuff', 'currentBucket'])
  },
  created() {
    this.$store.commit('getBuckets')
  }
}
</script>

<style lang="scss" scoped>
.grid {
  background-color: black;
  color: wheat;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 6rem;
}
.header {
  background-color: hsl(0, 0%, 0%, 0.75);
  grid-column: 1/2;
  grid-row: 2/3;
  z-index: 2;
  pointer-events: none;
}
.total {
  display: inline-block;
  color: wheat;
  font-size: 1.25rem;
  font-weight: normal;
  padding: 0.5rem;
}
.filters {
  grid-column: 1/2;
  grid-row: 1/3;
  z-index: 1;
}
.viz {
  grid-column: 1/2;
  grid-row: 1/3;
}
</style>

<style lang="scss">
body {
  overflow: hidden;
}
</style>
