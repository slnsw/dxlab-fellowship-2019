<template>
  <div class="wrapper">
    <div v-if="loadingBucket || !loaded" class="app-loading">
      <div class="squares">
        <span
          v-for="i in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]"
          :key="i"
          :class="{ square: true, ['square_' + i]: true }"
        ></span>
      </div>
      <div>Loading...</div>
    </div>
    <div v-if="loaded" id="viewer" class="grid">
      <router-link
        class="logo"
        :style="{
          backgroundImage: 'url(' + baseUrl + 'assets/logo-txt.svg)'
        }"
        to="/"
      >
        <span class="visuallyhidden">Aereo homepage</span>
      </router-link>
      <div v-if="currentBucket" class="button-back-wrapper">
        <router-link
          class="button-back"
          :to="pathFor(sort !== 'default' ? sort : null, null)"
        >
          &lt; back to everything
        </router-link>
      </div>
      <div id="header-info" :class="{ header: true, hidden: headerHidden }">
        <h1 class="total">
          <button
            :aria-expanded="[!headerHidden]"
            :aria-label="`${headerHidden ? 'show' : 'hide'} description header`"
            aria-controls="header-info"
            type="button"
            :class="{ 'button-header-toggle': true, active: currentBucket }"
            @click="headerHidden = !headerHidden"
          >
            {{ !headerHidden ? 'hide' : 'more info' }}
          </button>
          <div v-show="!headerHidden">
            <strong>{{ formattedItemsTotal }}</strong>
            <div v-if="!currentBucket && bucketObjects" class="bucket-names">
              <span v-for="(bucket, index) in bucketNames" :key="'b_' + index">
                <span v-if="index === bucketNames.length - 1"> and </span>
                <router-link :to="pathFor(sort, { key: bucket.key })">{{
                  bucket.name
                }}</router-link>
                <span v-if="index < bucketNames.length - 1">, </span>
                <span v-if="index === bucketNames.length - 1">.</span>
              </span>
            </div>
            <span v-if="currentBucket">{{
              currentBucket.description.trim()
            }}</span>
          </div>
        </h1>
      </div>
      <div
        v-show="!(!fileData.id || fileHidden)"
        ref="file"
        :class="{ file: true, hidden: !fileData.id || fileHidden }"
      >
        <button class="button-hide" type="button" @click="hideFile">
          hide
        </button>
        <div v-if="fileData.palette" class="palette">
          <span
            v-for="(color, index) in fileData.palette"
            :key="index"
            class="color"
            title="click to copy this color to clipboard in #RRGGBB format"
            :style="{
              backgroundColor: color.color,
              width: color.percent * 100 + '%'
            }"
            @click="copyColor(color.color)"
          ></span>
        </div>
        <div v-if="!fileData.title" class="file-loading">
          Loading...
        </div>
        <a :href="fileUrl" rel="noopener" target="_blank">
          <img
            v-if="fileData.image"
            :src="fileData.image"
            :alt="fileData.title"
            :title="fileData.title"
            class="thumbnail"
          />
        </a>
        <p v-if="fileData.year" class="file-year">{{ fileData.year }}</p>
        <p v-if="fileData.title !== -1" class="file-description">
          <a :href="fileUrl" rel="noopener" target="_blank">
            {{ trimmedTitle }}
          </a>
        </p>
      </div>
      <AboutButton />
      <div v-if="currentBucket" class="controls">
        <div class="sort">
          <router-link
            :class="['button-sort', sort === 'default' ? 'active' : '']"
            :to="pathFor(null, currentBucket)"
          >
            unsorted
          </router-link>
          <router-link
            :class="['button-sort', sort === 'year' ? 'active' : '']"
            :to="pathFor('year', currentBucket)"
          >
            year
          </router-link>
          <router-link
            :class="['button-sort', sort === 'hue' ? 'active' : '']"
            :to="pathFor('hue', currentBucket)"
          >
            colour
          </router-link>
          <router-link
            :class="['button-sort', sort === 'similar' ? 'active' : '']"
            :to="pathFor('similar', currentBucket)"
          >
            look alike
          </router-link>
        </div>
        <div class="atlas">
          <span v-if="loadedAtlas > 0 && showAtlases" class="atlas-loading"
            >loading...</span
          >
          <label for="atlas">
            <input
              id="atlas"
              v-model="atlasShown"
              type="checkbox"
              @change="confirmAtlas"
            />
            show thumbnails
          </label>
        </div>
      </div>
      <div v-if="currentBucket" class="zoom-control">
        <button class="button-zoom" type="button" @click="zoomIn">+</button>
        <button class="button-zoom" type="button" @click="zoomOut">-</button>
      </div>
      <a11y-dialog
        id="app-bigfiles"
        app-root="#viewer"
        dialog-root="#dialog-root"
        :class-names="{
          base: 'dialog',
          overlay: 'dialog-overlay',
          element: 'dialog-content',
          title: 'dialog-title',
          document: 'dialog-document',
          closeButton: 'dialog-close'
        }"
        @dialog-ref="assignDialogRef"
      >
        <template v-slot:title>
          <span>Big files alert!</span>
        </template>
        <div>
          <p>
            Some categories (especially manuscripts, photographs, and negatives)
            have <em>a lot</em> of images (updwards of 100 megabytes) and their
            thumbnails will take a while to download. If you are on a mobile
            device you might want to wait until you are on Wi-Fi to view them or
            they might not load at all.
          </p>
          <div class="dialog-buttons">
            <button type="button" class="button-confirm" @click="acceptAtlas">
              Show thumbnails
            </button>
            <button type="button" class="button-cancel" @click="cancelAtlas">
              Don't show thumbnails
            </button>
          </div>
        </div>
      </a11y-dialog>
      <a11y-dialog
        id="app-category"
        app-root="#viewer"
        dialog-root="#dialog-root"
        :class-names="{
          base: 'dialog',
          overlay: 'dialog-overlay',
          element: 'dialog-content',
          title: 'dialog-title',
          document: 'dialog-document',
          closeButton: 'dialog-close'
        }"
        @dialog-ref="assignCategoryCallRef"
      >
        <template v-slot:title>
          <span><em>Aereo</em> view!</span>
        </template>
        <ul class="call-list">
          <li>
            Each <strong>square represents a file</strong> and is painted with
            the <strong>most prominent color</strong> in that file.
          </li>
          <li>
            <strong>Zoom in</strong> (using the mouse wheel or touchpad) to get
            closer.
          </li>
          <li>
            Select <strong>Show thumbnails</strong> below to view the files.
          </li>
          <li>
            <strong>Click a square</strong> to see a larger version of the file.
          </li>
          <li>
            Select <strong>different sorting criteria</strong> to reorganize
            files accordingly.
          </li>
        </ul>
        <div class="dialog-buttons">
          <button
            type="button"
            class="button-confirm"
            @click="confirmCategoryCall"
          >
            Got it!
          </button>
        </div>
      </a11y-dialog>
      <viz ref="viz" class="viz" />
    </div>
    <SpecialCare />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Viz from '@/components/Viz.vue'
import AboutButton from '@/components/AboutButton'
import SpecialCare from '@/components/SpecialCare'

const BASE_URL = process.env.BASE_URL
const FILES_BASE_URL = process.env.VUE_APP_FILES_BASE_URL
const MAX_TITLE_LENGTH = 140

export default {
  components: { AboutButton, Viz, SpecialCare },
  data() {
    return {
      baseUrl: BASE_URL,
      dialog: null,
      categoryCall: null,
      categoryCallSeen: false,
      atlasShown: this.showAtlases,
      filesBaseUrl: FILES_BASE_URL,
      headerHidden: true,
      controlsHidden: false,
      fileHidden: false
    }
  },
  computed: {
    trimmedTitle() {
      return this.fileData.title
        ? this.fileData.title.length > MAX_TITLE_LENGTH
          ? this.fileData.title.substr(0, MAX_TITLE_LENGTH) + '…'
          : this.fileData.title
        : ''
    },
    fileUrl() {
      return this.filesBaseUrl + this.fileData.id
    },
    bucketNames() {
      return Object.values(this.stuff)
    },
    description() {
      const l = Object.values(this.stuff).length
      return Object.values(this.stuff)
        .filter((b) => b.count > 0)
        .map((s, index) => (index === l - 1 ? 'and ' + s.name : s.name))
        .join(', ')
    },
    formattedItemsTotal() {
      return `${new Intl.NumberFormat().format(
        this.currentBucket ? this.currentBucket.count : this.totalFromBuckets
      )}${
        this.currentBucket
          ? ' ' +
            this.currentBucket.name.trim() +
            (this.currentBucket.description !== '' ? ': ' : '')
          : ' '
      }`
    },
    ...mapGetters(['totalFromBuckets']),
    ...mapState([
      'bucketObjects',
      'fileData',
      'loadingBucket',
      'confirmedAtlas',
      'selectedBucket',
      'loaded',
      'itemsTotal',
      'stuff',
      'currentBucket',
      'sort',
      'showAtlases',
      'loadedAtlas'
    ])
  },
  watch: {
    fileData(newData) {
      if (newData.id) this.fileHidden = false
    },
    currentBucket() {
      if (!this.categoryCallSeen) {
        if (!this.categoryCall) return
        this.categoryCall.show()
      }
    }
  },
  mounted() {
    this.atlasShown = this.showAtlases
    this.$store.commit('setBucket', null)
    this.$store.commit('setFileData', {})
    this.$store.commit('setSort', this.$route.query.sort)
    if (this.$route.query.bucket)
      this.$store.commit('setBucketKey', this.$route.query.bucket)
    this.$store.dispatch('getBuckets')
  },
  methods: {
    zoomIn() {
      this.$refs.viz.zoomIn()
    },
    zoomOut() {
      this.$refs.viz.zoomOut()
    },
    hideFile() {
      this.fileHidden = true
      this.$refs.viz.clearLastImage()
      this.$store.commit('setFileData', {})
    },
    pathFor(sort, bucket) {
      const path = { path: '/viewer', query: {} }
      if (bucket) path.query.bucket = bucket.key
      if (sort && sort !== 'default') path.query.sort = sort
      return path
    },
    copyColor(color) {
      navigator.clipboard.writeText(color)
    },
    acceptAtlas() {
      this.atlasShown = true
      this.$store.commit('setConfirmedAtlas', true)
      this.$store.commit('setShowAtlases', true)
      if (this.dialog) this.dialog.hide()
    },
    cancelAtlas() {
      this.atlasShown = false
      this.$store.commit('setConfirmedAtlas', true)
      this.$store.commit('setShowAtlases', false)
      if (this.dialog) this.dialog.hide()
    },
    confirmAtlas() {
      if (this.atlasShown && !this.confirmedAtlas) {
        if (this.dialog) this.dialog.show()
      } else {
        this.$store.commit('setShowAtlases', this.atlasShown)
      }
    },
    confirmCategoryCall() {
      if (this.categoryCall) this.categoryCall.hide()
    },
    assignCategoryCallRef(dialog) {
      this.categoryCall = dialog
      if (!this.categoryCall) return
      this.categoryCall.on('hide', () => {
        this.categoryCallSeen = true
      })
    },
    assignDialogRef(dialog) {
      this.dialog = dialog
      if (!this.dialog) return
      this.dialog.on('hide', () => {
        if (!this.confirmedAtlas) {
          this.atlasShown = !this.atlasShown
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';
@import '@/assets/general';
@import '@/assets/loading';

.wrapper {
  overflow: hidden;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto 5rem;
  position: relative;
}
.logo {
  position: absolute;
  left: 0;
  top: 0.5rem;
  width: 3rem;
  height: 3rem;
  z-index: 2;
  background-size: contain;

  @media screen and (max-width: 990px) {
    top: 0.25rem;
    width: 2.5rem;
    height: 2.5rem;
  }
}

.button-zoom,
.button-back,
.button-hide,
.button-header-toggle {
  display: block;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  background-color: $button-bg-color;
  color: $button-text-color;
  text-decoration: none;
  border-radius: 0.2rem;
  padding: 0.125rem 0.5rem;
}
.button-back-wrapper {
  left: 0.5rem;
  top: 4rem;
  position: absolute;
  z-index: 1;
}
.button-back {
  display: inline-block;
}
.button-header-toggle {
  position: absolute;
  transform: translateY(calc(100% + 0.5rem));
  bottom: 0;
  box-shadow: 0 0 0.25rem $bg-color;
  right: 0;
}
.header {
  background-color: transparentize($color: $bg-color, $amount: 0.1);
  grid-column: 1/4;
  grid-row: 1/2;
  z-index: 1;
  transition: transform 0.2s ease-out;
  transform: translateY(0%);

  &.hidden {
    transform: translateY(-100%);
  }
}
.total {
  font-size: 1.25rem;
  font-weight: normal;
  max-width: 80ch;
  margin: 0 auto;
  padding: 0.5rem;
  position: relative;

  @media screen and (max-width: 990px) {
    margin-left: 2.5rem;
    max-width: none;
    font-size: 0.9rem;
  }
}
.bucket-names {
  display: inline;
}
.about {
  grid-column: 1/2;
  grid-row: 3/4;
  z-index: 1;
  align-self: center;
}
.controls {
  grid-column: 1/4;
  grid-row: 3/4;
  z-index: 1;
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  background-color: transparentize($color: $bg-color, $amount: 0.1);
  width: 30%;
  min-width: 23.5rem;
  border-radius: 0.5rem 0.5rem 0 0;
}
.zoom-control {
  grid-column: 3/4;
  grid-row: 3/4;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-self: center;
  justify-self: end;
  margin-right: 1rem;
}
.button-zoom {
  background-color: $button-text-color;
  color: $button-bg-color;
}
.button-zoom:first-child {
  margin-bottom: 0.5rem;
}
.sort {
  display: flex;
  padding-top: 0.5rem;
}
.atlas {
  padding-bottom: 0.5rem;
  position: relative;

  .atlas-loading {
    position: absolute;
    left: 0;
    margin-left: -50%;
    color: darken($text-color, 30%);
  }

  label {
    cursor: pointer;
  }
}
.button-sort {
  background-color: $button-bg-color;
  color: $button-text-color;
  text-decoration: none;
  display: inline-block;
  border-radius: 0.2rem;
  margin: 0 0 0.5rem 0.5rem;
  padding: 0.25rem 1rem;
  white-space: nowrap;

  &:first-child {
    margin-left: 0;
  }

  &.active {
    color: $white-color;
    background-color: $bg-active;
  }
}
.dialog-buttons {
  display: flex;
  margin-top: 2rem;
}
.button-confirm {
  cursor: pointer;
  color: $main-color;
  background-color: $bg-color;
  display: inline-block;
  border: none;
  border-radius: 0.2rem;
  padding: 0.25rem 1rem;
}
.button-cancel {
  cursor: pointer;
  background-color: $main-color;
  color: $bg-color;
  text-decoration: underline;
  display: inline-block;
  border: none;
  border-radius: 0.2rem;
  margin-left: auto;
  padding: 0.25rem 1rem;
}
.viz {
  grid-column: 1/4;
  grid-row: 1/4;
}
.file {
  align-self: center;
  justify-self: end;
  background-color: transparentize($color: $bg-color, $amount: 0.1);
  grid-row: 1/4;
  grid-column: 3/4;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
  width: 300px;
  max-width: 50vw;
  z-index: 1;
  transition: transform 0.2s ease-out;
  transform: translateX(0%);
  border-radius: 0.5rem 0 0 0.5rem;

  &.hidden {
    transform: translateX(100%);
  }
}
.button-hide {
  align-self: flex-start;
  display: inline-block;
  margin: 0 0 0.5rem 0.5rem;
}
.file-loading {
  background-color: transparentize($color: $bg-color, $amount: 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 50% 0;
}
.palette {
  display: flex;
  margin-bottom: 1px;
}
.color {
  font-size: 0.75rem;
  height: 3rem;
  padding: 0.5rem;
  margin-right: 1px;
  cursor: pointer;

  &:last-child {
    margin: 0;
  }
}
.thumbnail {
  object-fit: cover;
  width: 100%;
  height: auto;
}
.file-year {
  margin: 0.5rem 0.5rem 0 0.5rem;
  color: $white-color;
  font-weight: bold;
}
.file-description {
  margin: 0 0.5rem 0 0.5rem;
}
.call-list {
  list-style-type: disc;
  padding-left: 1rem;
}
</style>
