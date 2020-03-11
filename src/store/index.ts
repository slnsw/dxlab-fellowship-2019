/* eslint-disable @typescript-eslint/no-explicit-any */
const axios = require('axios').default

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import bodybuilder from 'bodybuilder'

const MAX_WINDOW_SIZE = 20000

const instance = axios.create({
  timeout: 600000
})

const FILE_BASE_URL = process.env.VUE_APP_FILES_BASE_URL

const STUFF: any = {
  pictures: { id: 'J19GWyDjZ8Ny7', name: 'pictures' },
  prints: { id: 'vpkdDA18BDOdR', name: 'prints' },
  drawings: { id: 'GP85pXKPWzzB', name: 'drawings' },
  paintings: { id: '0GB866Xe6mz1q', name: 'paintings' },
  posters: { id: 'b10aqZK7gRzJy', name: 'posters' },
  medals: { id: 'X8gBJlg9E1WqK', name: 'medals' },
  photographs: {
    id: 'wKK2B5BO3aEYa',
    name: 'photographs',
    esQuery: {
      type: 'must_not',
      matchType: 'match_phrase_prefix',
      field: 'item_id_callnumber_key',
      values: ['SLIDES', 'ON']
    }
  },
  negatives: {
    id: 'wKK2B5BO3aEYa',
    name: 'negatives',
    esQuery: {
      type: 'should',
      matchType: 'match_phrase_prefix',
      field: 'item_id_callnumber_key',
      values: ['SLIDES', 'ON']
    }
  },
  archTechDrawings: {
    id: 'm6zK940qx9v7K',
    name: 'architectural    \ndrawings'
  },
  designDrawings: { id: 'adx22BvP5OZzd', name: 'design drawings' },
  maps: { id: '40XObXd7aA4a', name: 'published       \nmaps' },
  manuscriptMaps: { id: 'Xp1qba0O2k32v', name: 'unpublished \nmaps' },
  objects: { id: '7MZAw5gxmyyaW', name: 'objects' },
  stamps: { id: 'BRg6jXK4mz4wG', name: 'stamps' },
  ephemera: { id: 'vz2D0Am8wvrlb', name: 'ephemera' },
  coin: { id: '76pM49Z2jxBzR', name: 'coins' },
  journals: { name: 'journals', id: 'Z5AB0OkPYjPb9' },
  // manuscripts: { name: 'manuscripts', id: '330MWgKgY5adZ' },
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

const baseQuery = () => {
  let bb = bodybuilder()
  Object.entries(STUFF).forEach(([key, value]: any) => {
    bb = bb.orFilter(
      'term',
      key !== 'medals' && key !== 'stamps' && key !== 'coin'
        ? 'format_id.keyword'
        : 'subject_curated_title',
      key !== 'medals' && key !== 'stamps' && key !== 'coin' ? value.id : key
    )
  })
  return bb
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const makeFancyFilter = ({ query, esQuery }) => {
  return query.filter('bool', (b) => {
    esQuery.values.forEach((val) => {
      if (esQuery.type === 'must_not') {
        b = b.notFilter(esQuery.matchType, esQuery.field, val)
      } else {
        // should (ignoring must for now)
        b = b.orFilter(esQuery.matchType, esQuery.field, val)
      }
    })
    return b
  })
}

const makeFilter = ({ key, id, query }) => {
  const field =
    key !== 'medals' && key !== 'stamps' && key !== 'coin'
      ? 'format_id.keyword'
      : 'subject_curated_title'
  const value =
    key !== 'medals' && key !== 'stamps' && key !== 'coin' ? id : key
  return query.filter('term', field, value)
}

export default new Vuex.Store({
  state: {
    loaded: false,
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
    totalFromBuckets: (state) =>
      Object.values(state.stuff)
        .map((b: any) => b.count)
        .reduce((a, b) => a + b, 0)
  },
  mutations: {
    setStuff: (state, stuff) => (state.stuff = stuff),
    async setBucket(state, bucket) {
      if (!bucket) {
        state.currentBucket = null
        return
      }
      const url = '/buckets/' + bucket.key + '.txt'
      const response = await instance.get(url)
      const ids = response.data
      const currentBucket = { ...state.stuff[bucket.id], ...bucket }
      currentBucket.ids = ids.split(',')
      state.currentBucket = currentBucket
    },
    async getIdsForBucket(state, bucket) {
      const url = process.env.VUE_APP_ELASTIC_BASE_URL + '/_search'
      const key = bucket.key
      const id = bucket.id
      const count = bucket.count
      const pages = Math.ceil(count / MAX_WINDOW_SIZE)
      const pageArray = new Array(pages)
      const params = { track_total_hits: true }
      let ids = []
      await asyncForEach(pageArray, async (_, index) => {
        let query = baseQuery()
          .size(MAX_WINDOW_SIZE)
          .from(index * MAX_WINDOW_SIZE)
          .rawOption('_source', '_id')
        query = makeFilter({ key, id, query })
        const esQuery = bucket.esQuery
        if (esQuery) query = makeFancyFilter({ query, esQuery })

        const baseResponse = await instance.post(url, {
          ...query.build(),
          ...params
        })
        const hits = baseResponse.data.hits
        ids = ids.concat(hits.hits.map((hit) => hit._id))
      })
      const newBucket = { ...bucket, data: [...ids] }
      let newStuff = { ...state.stuff }
      newStuff = { ...newStuff, [key]: newBucket }
      state.stuff = { ...newStuff }
    },
    async getBuckets(state) {
      const url = process.env.VUE_APP_ELASTIC_BASE_URL + '/_search'
      const params = { track_total_hits: true }
      const stuffKeys = Object.keys(STUFF)
      const buckets = {}
      await asyncForEach(Object.values(STUFF), async (val, index) => {
        const key = stuffKeys[index]
        const id = val.id
        let query = baseQuery()
          .size(10)
          .rawOption('_source', 'props_file_name_title')
        query = makeFilter({ key, id, query })
        const esQuery = val.esQuery
        if (esQuery) query = makeFancyFilter({ query, esQuery })

        const baseResponse = await instance.post(url, {
          ...query.build(),
          ...params
        })
        const hits = baseResponse.data.hits
        const images = hits.hits.map(
          (hit) =>
            `${hit._source.props_file_name_title[0].substr(0, 4)}/${
              hit._source.props_file_name_title[0]
            }`
        )
        const bucketData = {
          ...state.stuff[key],
          count: hits.total.value,
          key,
          images
        }
        buckets[key] = bucketData
      })
      state.stuff = buckets
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
