<template>
  <div class="viewer">
    <highcharts
      :constructor-type="'stockChart'"
      :options="chartOptions"
    ></highcharts>
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
  data() {
    return {
      chartOptions: {
        rangeSelector: {
          buttons: [
            {
              type: 'minute',
              count: 5,
              text: '5min',
              events: {
                click() {
                  alert('clicked')
                }
              }
            }
          ]
        },
        series: [
          {
            pointInterval: 60 * 1000,
            data: [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3]
          }
        ]
      }
    }
  },
  computed: {
    dateData() {
      return this.buckets.date.buckets.map((b) => b.doc_count)
    },
    formattedItemsTotal() {
      return new Intl.NumberFormat().format(this.itemsTotal)
    },
    ...mapState(['loaded', 'buckets', 'itemsTotal', 'aggs'])
  },
  created() {
    this.$store.commit('getBuckets')
  },
  methods: {
    histWidth() {
      return window.innerWidth
    }
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
.histogram {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 10rem;
}
</style>
