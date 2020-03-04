<template>
  <div v-if="loaded" class="grid">
    <div class="header">
      <h1 class="total">{{ formattedItemsTotal }} {{ thing }}.</h1>
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
      return this.currentBucket ? this.currentBucket.name : 'things'
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
    ...mapState(['loaded', 'itemsTotal', 'aggs', 'buckets', 'currentBucket'])
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
  grid-template-rows: 5rem 1fr;
  grid-template-columns: 18rem 1fr;
}
.header {
  grid-column: 2/3;
  grid-row: 1/2;
  z-index: 2;
  pointer-events: none;
}
.total {
  background-color: black;
  display: inline-block;
  color: wheat;
  font-size: 1.5rem;
  font-weight: normal;
  padding: 0 0.5rem;
}
.filters {
  grid-column: 1/2;
  grid-row: 1/3;
  z-index: 1;
}
.viz {
  grid-column: 1/3;
  grid-row: 1/3;
}
</style>
