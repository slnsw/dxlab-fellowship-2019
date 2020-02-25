const axios = require('axios').default

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const instance = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 5000,
  headers: { 'x-api-key': process.env.VUE_APP_API_KEY }
})

const REQUEST_SIZE = 10 // actually 1000 but leaving small for speed
const REQUEST_MAX_OFFSET = 9000
const REQUEST_FORMATS =
  'archTechDrawings,clippingArchival,coins,designDrawings,drawings,ephemera,films,manuscriptMaps,manuscriptMusicScores,manuscripts,maps,medals,musicalRecordings,newspapers,nonMusicalRecordings,objects,oralHistory,paintings,photographs,pictures,posters,printedMusicScores,prints,stamps,video,websites'

export default new Vuex.Store({
  state: {
    loaded: false,
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
    async getItems(state) {
      const url = '/items'
      const params = { limit: REQUEST_SIZE, formats: REQUEST_FORMATS }

      const baseResponse = await instance.get(url, { params })
      state.itemsClosest = baseResponse.data.items

      state.formatGroups = baseResponse.data.facets.formatGroups
      state.authors = baseResponse.data.facets.authors
      state.languages = baseResponse.data.facets.languages
      state.subjects = baseResponse.data.facets.subjects
      state.locations = baseResponse.data.facets.locations
      state.itemsTotal = baseResponse.data.itemsTotal
      state.loaded = true

      const total = baseResponse.data.itemsTotal
      let midOffset = REQUEST_SIZE
      let farOffset = REQUEST_SIZE

      if (total > REQUEST_SIZE * 3) {
        // only do mid/far results if worthwhile
        if (total > REQUEST_MAX_OFFSET) {
          midOffset = (REQUEST_MAX_OFFSET - REQUEST_SIZE) / 2
          farOffset = REQUEST_MAX_OFFSET - REQUEST_SIZE
        } else {
          midOffset = (total - REQUEST_SIZE) / 2
          farOffset = total - REQUEST_SIZE
        }
        // midway stuff
        const midResponse = await instance.get(url, {
          params: { ...params, ...{ offset: midOffset } }
        })
        state.itemsMidway = midResponse.data.items
        // far stuff
        const farResponse = await instance.get(url, {
          params: { ...params, ...{ offset: farOffset } }
        })
        state.itemsFarthest = farResponse.data.items
      }
    }
  },
  actions: {},
  modules: {}
})
