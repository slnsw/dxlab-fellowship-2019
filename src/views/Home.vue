<template>
  <div class="processor">
    <h1>Download bucket file ID lists</h1>
    <div v-if="loaded">
      <div v-for="(bucket, index) in sortedStuff" :key="index" class="bucket">
        <button
          v-if="!bucket.processed"
          type="button"
          @click="processBucket(bucket.key)"
        >
          Process
        </button>
        <a
          v-if="bucket.processed && bucket.data && !bucket.downloaded"
          :href="'data:application/octet-stream,' + encodedData(bucket.key)"
          :download="bucket.key + '.txt'"
          @click="downloadBucket(bucket.key)"
        >
          Download!
        </a>
        <span v-if="bucket.processed && bucket.data && bucket.downloaded">
          Done!
        </span>
        <span v-if="bucket.processed && !bucket.data && !bucket.downloaded">
          Processing...
        </span>
        <span>{{ bucket.name }} ({{ bucket.count }})</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  components: {},
  data() {
    return {}
  },
  computed: {
    sortedStuff() {
      return Object.values(this.stuff)
        .filter((s) => s.count > 0)
        .sort((a, b) => b.count - a.count)
    },
    ...mapState(['loaded', 'itemsTotal', 'stuff'])
  },
  async created() {
    await this.$store.commit('getBuckets')
    const stuff = { ...this.stuff }
    Object.values(stuff).forEach((element, index) => {
      const key = Object.keys(stuff)[index]
      const bucket = { ...element }
      bucket.processed = bucket.processed || false
      bucket.downloaded = bucket.downloaded || false
      bucket.key = key
      stuff[key] = bucket
    })
    this.$store.commit('setStuff', stuff)
  },
  methods: {
    encodedData(key) {
      return this.stuff[key].data.join(',')
    },
    downloadBucket(key) {
      const buckets = { ...this.stuff }
      const bucket = { ...buckets[key], downloaded: true }
      buckets[key] = bucket
      this.$store.commit('setStuff', buckets)
    },
    processBucket(key) {
      const buckets = { ...this.stuff }
      const bucket = { ...buckets[key], processed: true }
      buckets[key] = bucket
      this.$store.commit('getIdsForBucket', buckets[key])
      this.$store.commit('setStuff', buckets)
    }
  }
}
</script>

<style lang="scss" scoped>
.processor {
  margin: 0.5rem;
}
.bucket {
  display: flex;
  margin-bottom: 0.5rem;

  & :first-child {
    margin-right: 1rem;
    text-align: center;
    width: 6rem;
  }
}
</style>
