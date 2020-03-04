const axios = require('axios').default

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import bodybuilder from 'bodybuilder'

const instance = axios.create({
  baseURL: process.env.VUE_APP_ELASTIC_BASE_URL,
  timeout: 5000
})

const FILE_BASE_URL = 'https://collection.sl.nsw.gov.au/digital/file'

const STUFF = {
  pictures: { id: 'J19GWyDjZ8Ny7', name: 'pictures' },
  prints: { id: 'vpkdDA18BDOdR', name: 'prints' },
  drawings: { id: 'GP85pXKPWzzB', name: 'drawings' },
  paintings: { id: '0GB866Xe6mz1q', name: 'paintings' },
  posters: { id: 'b10aqZK7gRzJy', name: 'posters' },
  medals: { id: 'X8gBJlg9E1WqK', name: 'medals' },
  photographs: { id: 'wKK2B5BO3aEYa', name: 'photographs' },
  archTechDrawings: {
    id: 'm6zK940qx9v7K',
    name: 'architectural    \ndrawings'
  },
  designDrawings: { id: 'adx22BvP5OZzd', name: 'design drawings' },
  maps: { id: '40XObXd7aA4a', name: 'maps' },
  manuscriptMaps: { id: 'Xp1qba0O2k32v', name: 'manuscript   \nmaps' },
  objects: { id: '7MZAw5gxmyyaW', name: 'objects' },
  stamps: { id: 'BRg6jXK4mz4wG', name: 'stamps' },
  ephemera: { id: 'vz2D0Am8wvrlb', name: 'ephemera' },
  coin: { id: '76pM49Z2jxBzR', name: 'coins' },
  journals: { name: 'journals', id: 'Z5AB0OkPYjPb9' },
  manuscripts: { name: 'manuscripts', id: '330MWgKgY5adZ' },
  manuscriptNotatedMusic: {
    name: 'notated music',
    id: 'oWWJDK5PO44me'
  },
  musicalRecordings: {
    name: 'musical sound\nrecordings ',
    id: 'KOpMgA2JjBYmO'
  },
  nonMusicalRecordings: {
    name: 'non-musical sound\nrecordings        ',
    id: 'z02KkaA8xXx4E'
  },
  video: { name: 'video', id: 'NWOD2N4edDPzO' },
  films: { name: 'film', id: 'aXgRM15jrzBWz' },
  manuscriptMusicScores: {
    name: 'music scores',
    id: '9DDK52Ye2G2AD'
  }
}

const STUFF_TREE = {
  objects: {
    children: ['objects', 'stamps', 'ephemera', 'medals', 'coin']
  },
  maps: {
    children: ['maps', 'manuscriptMaps']
  },
  pictures: {
    children: [
      'pictures',
      'prints',
      'drawings',
      'paintings',
      'posters',
      'archTechDrawings',
      'photographs',
      'designDrawings'
    ]
  }
}

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
    // },
    // date: {
    //   name: 'date',
    //   field: 'item_date_creation_agg',
    //   type: 'date'
  }
}

const baseQuery = () =>
  bodybuilder()
    .orFilter('term', 'format_id.keyword', 'J19GWyDjZ8Ny7') // pictures
    .orFilter('term', 'format_id.keyword', 'vpkdDA18BDOdR') // prints
    .orFilter('term', 'format_id.keyword', 'GP85pXKPWzzB') // drawings
    .orFilter('term', 'format_id.keyword', '0GB866Xe6mz1q') // paintings
    .orFilter('term', 'format_id.keyword', 'b10aqZK7gRzJy') // posters
    .orFilter('term', 'subject_curated_title', 'medals') // medals X8gBJlg9E1WqK
    .orFilter('term', 'format_id.keyword', 'wKK2B5BO3aEYa') // photographs
    .orFilter('term', 'format_id.keyword', 'm6zK940qx9v7K') // archTechDrawings
    .orFilter('term', 'format_id.keyword', 'adx22BvP5OZzd') // designDrawings
    .orFilter('term', 'format_id.keyword', '40XObXd7aA4a') // maps
    .orFilter('term', 'format_id.keyword', 'Xp1qba0O2k32v') // manuscriptmaps
    .orFilter('term', 'format_id.keyword', '7MZAw5gxmyyaW') // objects
    .orFilter('term', 'subject_curated_title', 'stamps') // stamps BRg6jXK4mz4wG
    .orFilter('term', 'format_id.keyword', 'vz2D0Am8wvrlb') // ephemera
    .orFilter('term', 'subject_curated_title', 'coin') // coins 76pM49Z2jxBzR
    .orFilter('term', 'format_id.keyword', 'Z5AB0OkPYjPb9') // journals
    .orFilter('term', 'format_id.keyword', '330MWgKgY5adZ') // manuscripts
    .orFilter('term', 'format_id.keyword', 'oWWJDK5PO44me') // notated music
    .orFilter('term', 'format_id.keyword', 'KOpMgA2JjBYmO') // musical sound recordings
    .orFilter('term', 'format_id.keyword', 'z02KkaA8xXx4E') // non-musical sound recordings
    .orFilter('term', 'format_id.keyword', 'NWOD2N4edDPzO') // video
    .orFilter('term', 'format_id.keyword', 'aXgRM15jrzBWz') // film
    .orFilter('term', 'format_id.keyword', '9DDK52Ye2G2AD') // music scores

export default new Vuex.Store({
  state: {
    loaded: false,
    buckets: [],
    aggs: AGGS,
    stuff: STUFF,
    currentBucket: null,
    itemsClosest: [],
    itemsMidway: [],
    itemsFarthest: [],
    filters: {
      search: '',
      subjects: [],
      languages: [],
      places: [],
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
  getters: {
    bucketInfo: (state) => (id) => state.stuff[id],
    totalFromBuckets: (state) =>
      state.buckets.map((b) => b.count).reduce((a, b) => a + b, 0)
  },
  mutations: {
    setBucket(state, bucket) {
      if (!bucket) {
        state.currentBucket = null
        return
      }
      const currentBucket = { ...state.stuff[bucket.id], ...bucket }
      state.currentBucket = currentBucket
    },
    async getBuckets(state) {
      const url = '/_search'
      const params = { track_total_hits: true }
      const stuffKeys = Object.keys(STUFF)
      const buckets = []
      const asyncForEach = async (array, callback) => {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array)
        }
      }
      await asyncForEach(Object.values(STUFF), async (val, index) => {
        const key = stuffKeys[index]
        const query = baseQuery()
          .size(10)
          .rawOption('_source', 'props_file_name_title')
          .filter(
            'term',
            key !== 'medals' && key !== 'stamps' && key !== 'coin'
              ? 'format_id.keyword'
              : 'subject_curated_title',
            key !== 'medals' && key !== 'stamps' && key !== 'coin'
              ? val.id
              : key
          )
          .build()
        const baseResponse = await instance.post(url, {
          ...query,
          ...params
        })
        const hits = baseResponse.data.hits
        const images = hits.hits.map(
          (hit) =>
            `${hit._source.props_file_name_title[0].substr(0, 4)}/${
              hit._source.props_file_name_title[0]
            }`
        )
        const bucketData = { id: key, count: hits.total.value, images }
        buckets.push(bucketData)
      })
      buckets.sort((a, b) => b.count - a.count)
      state.buckets = buckets
      const baseResponse = await instance.post(url, {
        ...baseQuery().build(),
        ...params
      })
      const hits = baseResponse.data.hits
      state.itemsTotal = hits.total.value
      state.loaded = true
    }
  },
  actions: {},
  modules: {}
})
