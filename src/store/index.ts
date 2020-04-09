/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
const axios = require('axios').default

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import bodybuilder from 'bodybuilder'
import csv from 'csvtojson'
import * as THREE from 'three'

import AjaxTextureLoader from '@/utils/AjaxTextureLoader'
import STUFF from '@/utils/data'

const MAX_WINDOW_SIZE = 20000
const API_KEY = process.env.VUE_APP_API_KEY
const BASE_URL = process.env.BASE_URL
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL
const S3_BASE_URL = process.env.VUE_APP_S3_BASE_URL

const instance = axios.create({
  headers: { 'x-api-key': API_KEY },
  timeout: 600000
})

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

const getPixelsForBucket = async (bucket) => {
  // gets image as canvas that can be queried like:
  // pixelData = canvas.getContext('2d').getImageData(x, y, 1, 1).data
  const url = BASE_URL + 'pixels/' + bucket.key + '.png'
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
  toSort.sort((a, b) =>
    b.h === a.h ? (b.l === a.l ? a.s - b.s : b.l - a.l) : b.h - a.h
  )
  const sorted = toSort.map((i) => i.i)
  const huePositions = new Float32Array(hsls.length)
  const hueIndexes = new Float32Array(l)
  sorted.forEach((i, idx) => {
    // the i-th color item needs to go to x,y based on idx
    const x = idx % width
    const y = Math.floor(idx / width)
    const z = 0
    huePositions[i * 3] = x
    huePositions[i * 3 + 1] = y
    huePositions[i * 3 + 2] = z
    hueIndexes[idx] = i
  })
  return { huePositions, hueIndexes }
}

const parseTsne = (data) => {
  const rows = data.split('\n').filter((r) => r !== '')
  const header = rows.splice(0, 1)[0]
  const wh = header.split(' ')
  const w = Number(wh[0])
  const h = Number(wh[1])
  const tsnePositions = new Float32Array(rows.length * 3)
  const tsneIndexes = new Float32Array(w * h).fill(-1)
  rows.forEach((row, i) => {
    const xy = row.split(' ')
    const x = Number(xy[0])
    const y = Number(xy[1])
    tsnePositions[i * 3] = x
    tsnePositions[i * 3 + 1] = y
    tsnePositions[i * 3 + 2] = 0
    tsneIndexes[y * w + x] = i
  })
  return { tsneIndexes, tsnePositions }
}

const parseYear = (data, side) => {
  const rows = data.split('\n').filter((r) => r !== '')
  const toSort = []
  const l = rows.length
  for (let i = 0; i < l; i++) {
    toSort.push({ year: Number(rows[i]), i })
  }
  toSort.sort((a, b) => a.year - b.year)
  const yearPositions = new Float32Array(l * 3)
  const yearIndexes = new Float32Array(l)
  const yearYears = new Float32Array(l)
  toSort.forEach((i, idx) => {
    // the i-th year item needs to go to x,y based on idx
    const x = idx % side
    const y = Math.floor(idx / side)
    const z = 0
    yearPositions[i.i * 3] = x
    yearPositions[i.i * 3 + 1] = y
    yearPositions[i.i * 3 + 2] = z
    yearIndexes[idx] = i.i
    yearYears[idx] = i.year
  })
  return { yearIndexes, yearPositions, yearYears }
}

export default new Vuex.Store({
  state: {
    bucketKey: null,
    bucketObjects: {},
    loadingBucket: false,
    loaded: false,
    confirmedAtlas: false,
    fileData: {},
    showAtlases: false,
    sort: 'default',
    stuff: STUFF,
    yearPositions: null,
    yearIndexes: null,
    yearYears: null,
    tsnePositions: null,
    tsneIndexes: null,
    huePositions: null,
    hueIndexes: null,
    defaultPositions: null,
    defaultColors: null,
    currentBucket: null,
    itemsTotal: 0,
    loadedAtlas: 0,
    atlases: {},
    pixels: {}
  },
  getters: {
    totalFromBuckets: (state) =>
      Object.values(state.stuff)
        .map((b: any) => b.count)
        .reduce((a, b) => a + b, 0)
  },
  actions: {
    getCurrentAtlases({ dispatch, commit }, { bucket, atlasCount }) {
      commit('setLoadedAtlas', atlasCount)
      for (let index = 0; index < atlasCount; index++) {
        dispatch('getAtlasForBucketIndex', { bucket, index })
      }
    },
    getAtlasForBucketIndex({ commit }, { bucket, index }) {
      const url = BASE_URL + 'atlas/' + bucket.key + '_' + index + '.jpg'
      const texture = new AjaxTextureLoader()
      texture.load(url, (atlas) => {
        commit('decreaseLoadedAtlas')
        atlas.encoding = THREE.sRGBEncoding
        atlas.flipY = false
        commit('setAtlasForBucketIndex', { bucket, index, atlas })
      })
    },
    loadFileImage: ({ commit }, url) => {
      instance.get(url).then((response) => {
        const image = response.data.file.image.variants['300_300'].url
        const title = response.data.file.title
        const img = new Image()
        img.onload = () => {
          commit('setFileImageTitle', { image, title })
        }
        img.onerror = () => {
          const image = BASE_URL + 'not_found.svg'
          commit('setFileImageTitle', { image, title })
        }
        img.src = image
      })
    },
    loadFilePalette: ({ commit }, url) => {
      instance.get(url).then((response) => {
        const palettes = response.data
        const palette = palettes
          ? palettes.map((p) => {
              return { color: p.h, percent: Number(p.f) }
            })
          : []
        const colorNames = palettes ? palettes.map((p) => p.t.split(':')) : []
        commit('setFilePalette', { palette, colorNames })
      })
    },
    loadFile: ({ state, commit, dispatch }, { fileId, index }) => {
      const id = fileId
      const year = state.yearYears[index]
      let url = API_BASE_URL + 'files/' + fileId
      commit('setFileData', { id, year })
      dispatch('loadFileImage', url)
      url = S3_BASE_URL + 'colors_minimal/' + fileId + '.json'
      dispatch('loadFilePalette', url)
    },
    async getBuckets({ state, commit }) {
      const bucketKey = state.bucketKey
      const url = BASE_URL + 'counts.csv'
      const response = await instance.get(url)
      const data = await csv().fromString(response.data)
      const buckets = {}
      const pixels = {}
      let total = 0
      await asyncForEach(data, async (row) => {
        const key = row.bucket
        if (!STUFF[key]) return
        const count = Number(row.count)
        const bucket = { ...STUFF[key], count, key }
        const imCount = count < 10 ? count : 10
        bucket.images = []
        for (let i = 0; i < imCount; i++) {
          bucket.images.push(BASE_URL + 'images/' + key + '/' + i + '.jpg')
        }
        buckets[key] = bucket
        // get the pixels ahead of time
        const pixelData = await getPixelsForBucket(bucket)
        pixels[key] = pixelData
        if (bucketKey && key === bucketKey) {
          state.currentBucket = bucket
        }
        total += count
      })
      state.stuff = buckets
      state.pixels = pixels
      state.itemsTotal = total
      state.loaded = true
      commit('updateState', state)
    },
    async loadBucket({ state, commit }, bucket) {
      if (!bucket) {
        commit('setBucket', null)
        return
      }
      commit('setLoadingBucket', true)
      const url = BASE_URL + 'buckets/' + bucket.key + '.txt'
      const response = await instance.get(url)
      const ids = response.data
      const currentBucket = { ...state.stuff[bucket.id], ...bucket }
      currentBucket.ids = ids.split(',')

      // color data
      const { pixels, width } = state.pixels[bucket.key]
      currentBucket.pixels = pixels
      const { colors, positions, hsls } = getColorsPositions(
        currentBucket.pixels
      )
      state.defaultColors = colors
      state.defaultPositions = positions
      const { huePositions, hueIndexes } = sortByHue({ hsls, width })

      // tsne data
      const tsneUrl = BASE_URL + 'similarities/' + bucket.key + '.txt'
      const tsneResponse = await instance.get(tsneUrl)
      const parsedTsne = parseTsne(tsneResponse.data)
      const { tsneIndexes, tsnePositions } = parsedTsne

      // year data
      const yearUrl = BASE_URL + 'years/' + bucket.key + '.txt'
      const yearResponse = await instance.get(yearUrl)
      const parsedYear = parseYear(yearResponse.data, width)
      const { yearIndexes, yearPositions, yearYears } = parsedYear

      state.yearPositions = yearPositions
      state.yearIndexes = yearIndexes
      state.yearYears = yearYears
      state.tsnePositions = tsnePositions
      state.tsneIndexes = tsneIndexes
      state.huePositions = huePositions
      state.hueIndexes = hueIndexes
      state.currentBucket = currentBucket
      state.loadingBucket = false
      commit('updateState', state)
    },
    async getIdsForBucket({ state, commit }, bucket) {
      const url = process.env.VUE_APP_ELASTIC_BASE_URL + '_search'
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
      const stuff = { ...newStuff }
      commit('updateState', { ...state, stuff })
    }
  },
  mutations: {
    setFileImageTitle: (state, { image, title }) => {
      const fileData = { ...state.fileData, image, title }
      state.fileData = fileData
    },
    setFilePalette: (state, { palette, colorNames }) => {
      const fileData = { ...state.fileData, palette, colorNames }
      state.fileData = fileData
    },
    setFileImageT: (state, { image, title }) => {
      const fileData = { ...state.fileData, image, title }
      state.fileData = fileData
    },
    setBucketKey: (state, value) => (state.bucketKey = value),
    setLoadingBucket: (state, value) => (state.loadingBucket = value),
    setBucketObjects: (state, value) => (state.bucketObjects = value),
    updateState: (state, newState) => (state = { ...state, ...newState }),
    setConfirmedAtlas: (state) => (state.confirmedAtlas = true),
    setShowAtlases: (state, value) => (state.showAtlases = value),
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
      let newBucket
      if (atlases[bucket.key]) {
        newBucket = [...atlases[bucket.key]]
      } else {
        newBucket = []
      }
      newBucket[index] = atlas
      atlases[bucket.key] = newBucket
      state.atlases = atlases
    },
    setFileData: (state, data) => (state.fileData = data),
    setStuff: (state, stuff) => (state.stuff = stuff),
    setBucket: (state, bucket) => (state.currentBucket = bucket)
  },
  modules: {}
})
