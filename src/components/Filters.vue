<template>
  <div class="fields-wrapper">
    <form class="fields">
      <section class="field">
        <h2 class="field-title">Keywords</h2>
        <input type="text" v-model.lazy.trim="filters.search" />
      </section>
      <ul class="controls">
        <li v-for="(value, id) in aggs" :key="id">
          <button
            type="button"
            class="bucket_button"
            @click="setBucket(id)"
            :disabled="currentBucketId === id"
          >
            {{ value.name }}
          </button>
        </li>
      </ul>
      <filters-list
        v-if="currentBucketId"
        :name="currentBucketId"
        v-model="filters[currentBucketId]"
        :options="mapBucket()"
        :total="total"
      />
    </form>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import FiltersList from '@/components/FiltersList.vue'

export default {
  components: { FiltersList },
  computed: {
    subjects() {
      return this.buckets.subjects.buckets.map((b, index) => {
        return { id: b.key.split('|||')[1], value: b.doc_count }
      })
    },
    authors() {
      return this.buckets.authors.buckets.map((b, index) => {
        return { id: b.key.split('|||')[1], value: b.doc_count }
      })
    },
    places() {
      return this.buckets.places.buckets.map((b, index) => {
        return { id: b.key, value: b.doc_count }
      })
    },
    formats() {
      return this.buckets.formats.buckets.map((b, index) => {
        return { id: b.key, value: b.doc_count }
      })
    },
    total() {
      return this.itemsTotal
    },
    selectedFormats: {
      get() {
        return this.filters.formats || []
      },
      set(value) {
        const filters = { ...this.filters }
        filters.formats = value
        this.$emit('input', filters)
      }
    },
    selectedSubjects: {
      get() {
        return this.filters.subjects || []
      },
      set(value) {
        const filters = { ...this.filters }
        filters.subjects = value
        this.$emit('input', filters)
      }
    },
    ...mapState([
      'buckets',
      'currentBucket',
      'currentBucketId',
      'filters',
      'aggs',
      'formatGroups',
      'itemsTotal'
    ])
  },
  methods: {
    mapBucket() {
      const bucket = this.buckets[this.currentBucketId]
      return bucket.buckets.map((b) => {
        return {
          id: b.key.indexOf('|||') !== -1 ? b.key.split('|||')[1] : b.key,
          value: b.doc_count
        }
      })
    },
    setBucket(bucket) {
      this.$store.commit('setBucket', bucket)
    }
  }
}
</script>

<style lang="scss" scoped>
.fields-wrapper {
  max-height: 100vh;
  overflow-x: hidden;
  overflow-y: scroll;
}
.controls {
  display: flex;
}
.category_button {
  margin: 0.5rem;
}
.field-title {
  font-size: 1.25rem;
}
</style>
