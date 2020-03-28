/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
const axios = require('axios').default

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import bodybuilder from 'bodybuilder'
import csv from 'csvtojson'
import * as THREE from 'three'

import AjaxTextureLoader from '@/utils/AjaxTextureLoader'

const TILE_SIZE = 32
const MAX_QUERY_LIMIT = 4096
const MAX_WINDOW_SIZE = 20000
const ELASTIC_BASE_URL = process.env.VUE_APP_ELASTIC_BASE_URL
const FILE_BASE_URL = process.env.VUE_APP_FILES_BASE_URL
const THUMBS_BASE_URL = process.env.VUE_APP_THUMBS_BASE_URL

const instance = axios.create({
  timeout: 600000
})

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
    name: 'architectural drawings'
  },
  maps: { id: '40XObXd7aA4a', name: 'published maps' },
  manuscriptMaps: { id: 'Xp1qba0O2k32v', name: 'unpublished maps' },
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
  video: { name: 'video', id: 'NWOD2N4edDPzO' }
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

const loadImage = (url): any => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = url
  })
}

const asyncLoadTexture = (url): any => {
  return new Promise((resolve, reject) => {
    const texture = new AjaxTextureLoader()
    texture.load(
      url,
      (img) => {
        resolve(img)
      },
      () => {},
      reject
    )
  })
}

const getPixelsForBucket = async (bucket) => {
  // gets image as canvas that can be queried like:
  // pixelData = canvas.getContext('2d').getImageData(x, y, 1, 1).data
  const url = '/pixels/' + bucket.key + '.png'
  const img = await loadImage(url)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height)
  return { pixels: canvas, width: img.width }
}

const getColorsPositions = (pixels) => {
  const width = pixels.width
  const height = pixels.height
  const tileCount = width * height
  const imgData = pixels.getContext('2d').getImageData(0, 0, width, height)

  const positions = new Float32Array(width * height * 3)
  const colors = new Float32Array(width * height * 3)
  const hsls = new Float32Array(width * height * 3)

  const color = new THREE.Color()
  for (let i = 0, i4 = 0, l = tileCount; i < l; i++, i4 += 4) {
    color.setRGB(
      imgData.data[i4] / 255,
      imgData.data[i4 + 1] / 255,
      imgData.data[i4 + 2] / 255
    )
    color.convertSRGBToLinear()
    const hsl = { h: 0, s: 0, l: 0 }
    color.getHSL(hsl)

    const x = i % width
    const y = Math.floor(i / width)
    const z = 0

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b

    hsls[i * 3] = hsl.h
    hsls[i * 3 + 1] = hsl.s
    hsls[i * 3 + 2] = hsl.l
  }
  return { colors, positions, hsls }
}

const sortByHue = ({ hsls, width }) => {
  const l = hsls.length / 3
  const toSort = []
  for (let i = 0, i3 = 0; i < l; i++, i3 += 3) {
    toSort.push({ h: hsls[i3], s: hsls[i3 + 1], l: hsls[i3 + 2], i })
  }
  toSort.sort((a, b) => b.h - a.h) // TODO: implement better color sorting
  const sorted = toSort.map((i) => i.i)
  const huePositions = new Float32Array(hsls.length)
  sorted.forEach((i, idx) => {
    // the i-th color item needs to go to x,y based on idx
    const x = idx % width
    const y = Math.floor(idx / width)
    const z = 0
    huePositions[i * 3] = x
    huePositions[i * 3 + 1] = y
    huePositions[i * 3 + 2] = z
  })
  return huePositions
}

const getImagesForBucket = async ({ bucket }) => {
  const url = ELASTIC_BASE_URL + '/_search'
  const key = bucket.key
  const id = bucket.id
  const esQuery = bucket.esQuery
  const params = { track_total_hits: true }
  let query = baseQuery()
    .size(10)
    .rawOption('_source', 'props_file_name_title')
  query = makeFilter({ key, id, query })
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
    ...bucket,
    count: hits.total.value,
    key,
    images
  }
  return bucketData
}

export default new Vuex.Store({
  state: {
    loaded: false,
    sort: 'default',
    stuff: STUFF,
    huePositions: null,
    defaultPositions: null,
    defaultColors: null,
    currentBucket: null,
    itemsTotal: 0,
    loadedAtlas: 0,
    atlases: {}
  },
  getters: {
    totalFromBuckets: (state) =>
      Object.values(state.stuff)
        .map((b: any) => b.count)
        .reduce((a, b) => a + b, 0)
  },
  actions: {
    getcurrentAtlases({ dispatch, commit, state }) {
      const bucket = state.currentBucket
      const ids = state.currentBucket.ids
      const atlasCount = Math.ceil(ids.length / MAX_QUERY_LIMIT)
      commit('setLoadedAtlas', atlasCount)
      for (let index = 0; index < atlasCount; index++) {
        dispatch('getAtlasForBucketIndex', { bucket, index })
      }
    },
    getAtlasForBucketIndex({ commit }, { bucket, index }) {
      const url = '/atlas/' + bucket.key + '_' + index + '.jpg'
      const texture = new AjaxTextureLoader()
      texture.load(url, (atlas) => {
        commit('decreaseLoadedAtlas')
        atlas.encoding = THREE.sRGBEncoding
        commit('setAtlasForBucketIndex', { bucket, index, atlas })
      })
    }
  },
  mutations: {
    setSort: (state, value) => {
      if (!value) value = 'default'
      state.sort = value
    },
    setLoadedAtlas: (state, value) => {
      state.loadedAtlas = value
    },
    decreaseLoadedAtlas: (state) => {
      state.loadedAtlas--
    },
    setAtlasForBucketIndex: (state, { bucket, index, atlas }) => {
      const atlases = { ...state.atlases }
      const newBucket = { ...atlases[bucket.key] }
      newBucket[index] = atlas
      atlases[bucket.key] = newBucket
      state.atlases = atlases
    },
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
      const { pixels, width } = await getPixelsForBucket(currentBucket)
      currentBucket.pixels = pixels
      const { colors, positions, hsls } = getColorsPositions(
        currentBucket.pixels
      )
      state.defaultColors = colors
      state.defaultPositions = positions
      state.huePositions = sortByHue({ hsls, width })
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
      const url = '/counts.csv'
      const response = await instance.get(url)
      const data = await csv().fromString(response.data)
      const buckets = {}
      let total = 0
      data.forEach((row) => {
        const key = row.bucket
        if (!STUFF[key]) return
        const count = Number(row.count)
        const bucket = { ...STUFF[key], count, key }
        const imCount = count < 10 ? count : 10
        bucket.images = []
        for (let i = 0; i < imCount; i++) {
          bucket.images.push('/images/' + key + '/' + i + '.jpg')
        }
        buckets[key] = bucket
        total += count
      })
      state.stuff = buckets
      state.itemsTotal = total
      state.loaded = true
    }
  },
  modules: {}
})
