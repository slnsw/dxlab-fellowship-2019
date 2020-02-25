<template>
  <div class="viewer">
    <filters v-if="loaded" />
    <things />
  </div>
</template>

<script>
import { mapState } from 'vuex'

import Things from '@/components/Things.vue'
import Filters from '@/components/Filters.vue'

export default {
  components: { Things, Filters },
  created() {
    this.$store.commit('getItems')
  },
  computed: {
    ...mapState(['loaded'])
  }
}
</script>

<style lang="scss" scoped>
.viewer {
  display: flex;
  height: 100vh;
  overflow: hidden;
  width: 100vw;
}
</style>
