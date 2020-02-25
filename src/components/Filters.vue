<template>
  <div class="fields-wrapper">
    <form class="fields">
      <section class="field">
        <h2>Keywords</h2>
        <input type="text" v-model.lazy.trim="filters.search" />
      </section>
      <filters-list
        name="Subject"
        v-model="filters.subjects"
        :options="subjects"
        :total="total"
      />
      <filters-list
        name="Authors"
        v-model="filters.authors"
        :options="authors"
        :total="total"
      />
      <filters-list
        name="Languages"
        v-model="filters.languages"
        :options="languages"
        :total="total"
      />
      <filters-list
        name="Locations"
        v-model="filters.locations"
        :options="locations"
        :total="total"
      />

      <section class="field">
        <h2>From date</h2>
        <input type="text" v-model.lazy.trim="filters.startDate" />
      </section>
      <section class="field">
        <h2>To date</h2>
        <input type="text" v-model.lazy.trim="filters.endDate" />
      </section>
    </form>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import FiltersList from '@/components/FiltersList.vue'

export default {
  components: { FiltersList },
  computed: {
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
      'filters',
      'subjects',
      'formatGroups',
      'languages',
      'authors',
      'locations',
      'itemsTotal'
    ])
  }
}
</script>

<style lang="scss" scoped>
.fields-wrapper {
  height: 100vh;
  min-width: 16rem;
  overflow-y: scroll;
  width: 16rem;
}

.fields {
  padding: 0.5rem;
}
</style>
