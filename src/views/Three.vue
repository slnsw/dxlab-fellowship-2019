<template>
  <div v-if="loaded">
    <div class="header">
      <h1 class="total">{{ itemsTotal }}</h1>
      <ul class="controls">
        <li v-for="(value, id) in aggs" :key="id">
          <button type="button" class="bucket_button" @click="setBucket(id)">
            {{ value.name }}
          </button>
        </li>
      </ul>
    </div>
    <viz />
  </div>
</template>

<script>
import { mapState } from 'vuex'

import Viz from '@/components/Viz.vue'

export default {
  components: { Viz },
  data() {
    return {}
  },
  computed: {
    ...mapState(['loaded', 'buckets', 'itemsTotal', 'aggs'])
  },
  created() {
    this.$store.commit('getBuckets')
  },
  methods: {
    setBucket(bucket) {
      this.$store.commit('setBucket', bucket)
    }
  }
}
</script>

<style lang="scss" scoped>
.header {
  position: absolute;
}
.total {
  color: white;
}
.controls {
  display: flex;
}
.category_button {
  margin: 0.5rem;
}
.three {
  height: 100vh;
  width: 100vw;
}
</style>
