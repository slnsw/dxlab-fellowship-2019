<template>
  <div class="things">
    <thing-list title="Closest" :things="itemsClosest" />
    <thing-list title="Midway" :things="itemsMidway" />
    <thing-list title="Farthest" :things="itemsFarthest" />
  </div>
</template>

<script>
import { mapState } from 'vuex'

import ThingList from '@/components/ThingList.vue'

export default {
  components: { ThingList },
  computed: {
    ...mapState(['itemsClosest', 'itemsMidway', 'itemsFarthest'])
  }
}
</script>

<style lang="scss" scoped>
.things {
  flex-grow: 1;
  height: 100vh;
  overflow-y: scroll;
}
</style>
