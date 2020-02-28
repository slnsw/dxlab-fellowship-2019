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

// const REQUEST_SIZE = 10 // actually 1000 but leaving small for speed
// const REQUEST_MAX_OFFSET = 9000
// const REQUEST_FORMATS =
//   'archTechDrawings,clippingArchival,coins,designDrawings,drawings,ephemera,films,manuscriptMaps,manuscriptMusicScores,manuscripts,maps,medals,musicalRecordings,newspapers,nonMusicalRecordings,objects,oralHistory,paintings,photographs,pictures,posters,printedMusicScores,prints,stamps,video,websites'

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
  authors: {
    name: 'authors',
    field: 'author_agg',
    type: 'keyword'
  },
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
      state.currentBucket = bucketId
    },
    async getBuckets(state) {
      const url = '/_search?size=0&track_total_hits=true'
      const aggregations = {}
      Object.values(AGGS).forEach((agg, index) => {
        const id = Object.keys(AGGS)[index]
        const field = agg.field
        const type = agg.type
        if (type === 'keyword') {
          aggregations[id + '_stats'] = {
            terms: {
              field: field + '.keyword',
              size: 1000
            }
          }
        } else if (type === 'date') {
          aggregations[id + '_stats'] = {
            date_histogram: {
              field: field,
              calendar_interval: 'year'
            }
          }
        }
      })
      const params = { aggregations }
      const baseResponse = await instance.post(url, { ...params })
      const hits = baseResponse.data.hits
      const agg = baseResponse.data.aggregations
      state.itemsTotal = hits.total.value
      state.buckets = agg
      state.loaded = true
    }
  },
  actions: {},
  modules: {}
})
