const axios = require('axios').default

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// const instance = axios.create({
//   baseURL: process.env.VUE_APP_API_BASE_URL,
//   timeout: 5000,
//   headers: { 'x-api-key': process.env.VUE_APP_API_KEY }
// })

const instance = axios.create({
  baseURL: process.env.VUE_APP_ELASTIC_BASE_URL,
  timeout: 5000
})

const BUCKET_SIZE = 100

const AGGS = {
  places: {
    name: 'places',
    field: 'place_title',
    type: 'keyword'
  },
  formats: {
    name: 'formats',
    field: 'format_id',
    type: 'keyword'
  },
  // authors: {
  //   name: 'authors',
  //   field: 'author_agg',
  //   type: 'keyword'
  // },
  subjects: {
    name: 'subjects',
    field: 'subject_agg',
    type: 'keyword'
  },
  date: {
    name: 'date',
    field: 'item_date_creation_agg',
    type: 'date'
  }
}

export default new Vuex.Store({
  state: {
    loaded: false,
    buckets: {},
    aggs: AGGS,
    currentBucketId: null,
    currentBucket: null,
    itemsClosest: [],
    itemsMidway: [],
    itemsFarthest: [],
    filters: {
      search: '',
      subjects: [],
      languages: [],
      locations: [],
      formats: [],
      authors: [],
      startDate: '',
      endDate: ''
    },
    itemsTotal: 0,
    formatGroups: [],
    subjects: [],
    authors: [],
    languages: [],
    locations: []
  },
  mutations: {
    setBucket(state, bucketId) {
      state.currentBucketId = bucketId
      state.currentBucket = state.buckets[bucketId]
    },
    async getBuckets(state) {
      const url = '/_search'
      const aggregations = {}
      Object.values(AGGS).forEach((agg, index) => {
        const id = Object.keys(AGGS)[index]
        const field = agg.field
        const type = agg.type
        if (type === 'keyword') {
          aggregations[id + '_stats'] = {
            terms: {
              field: field + '.keyword',
              size: BUCKET_SIZE
            }
          }
        } else if (type === 'date') {
          aggregations[id + '_stats'] = {
            date_histogram: {
              field: field,
              calendar_interval: 'year',
              format: 'yyyy'
            }
          }
        }
      })
      const params = { size: 0, track_total_hits: true, aggregations }
      const baseResponse = await instance.post(url, { ...params })
      const hits = baseResponse.data.hits
      const agg = baseResponse.data.aggregations
      state.itemsTotal = hits.total.value
      const buckets = {}
      Object.keys(state.aggs).forEach((id, index) => {
        buckets[id] = agg[id + '_stats']
      })
      state.buckets = buckets
      state.loaded = true
    }
  },
  actions: {},
  modules: {}
})
