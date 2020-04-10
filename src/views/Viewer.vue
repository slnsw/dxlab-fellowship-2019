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
    <div v-if="loaded" class="grid" id="viewer">
      <div :class="{ header: true, hidden: headerHidden }">
        <h1 class="total">
          <div :class="{ 'button-back-wrapper': true, active: currentBucket }">
            <router-link
              class="button-back"
              :to="pathFor(sort !== 'default' ? sort : null, null)"
            >
              &lt; back to everything
            </router-link>
          </div>

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
          <button
            type="button"
            :class="{ 'button-header-toggle': true, active: currentBucket }"
            @click="headerHidden = !headerHidden"
          >
            {{ !headerHidden ? 'hide' : 'show' }} header
          </button>
        </h1>
      </div>
      <div
        :class="{ file: true, hidden: !fileData.id || fileHidden }"
        ref="file"
      >
        <button class="button-hide" type="button" @click="fileHidden = true">
          hide
        </button>
        <div v-if="fileData.palette" class="palette">
          <span
            class="color"
            v-for="(color, index) in fileData.palette"
            title="click to copy this color to clipboard in #RRGGBB format"
            :key="index"
            :style="{
              backgroundColor: color.color,
              width: color.percent * 100 + '%'
            }"
            @click="copyColor(color.color)"
          ></span>
        </div>
        <div class="file-loading" v-if="!fileData.title">
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
      <div class="controls">
        <div class="sort">
          <router-link
            :class="['button-sort', sort === 'default' ? 'active' : '']"
            :to="pathFor(null, currentBucket)"
          >
            no sorting
          </router-link>
          <router-link
            :class="['button-sort', sort === 'hue' ? 'active' : '']"
            :to="pathFor('hue', currentBucket)"
          >
            color
          </router-link>
          <router-link
            :class="['button-sort', sort === 'similar' ? 'active' : '']"
            :to="pathFor('similar', currentBucket)"
          >
            look alike
          </router-link>
          <router-link
            :class="['button-sort', sort === 'year' ? 'active' : '']"
            :to="pathFor('year', currentBucket)"
          >
            year
          </router-link>
        </div>
        <div class="atlas">
          <label for="atlas">
            <input
              type="checkbox"
              id="atlas"
              v-model="atlasShown"
              @change="confirmAtlas"
            />
            show thumbnails
          </label>
        </div>
      </div>
      <a11y-dialog
        id="app-dialog"
        app-root="#viewer"
        dialog-root="#dialog-root"
        @dialog-ref="assignDialogRef"
        :class-names="{
          base: 'dialog',
          overlay: 'dialog-overlay',
          element: 'dialog-content',
          title: 'dialog-title',
          document: 'dialog-document',
          closeButton: 'dialog-close'
        }"
      >
        <template v-slot:title>
          <span>Big files alert!</span>
        </template>
        <div>
          <p>
            Some categories (especially manuscripts, photographs, and negatives)
            have <em>a lot</em> of images (updwards of 100 megabytes) and their
            thumbnails will take a while to download. If you are in a mobile
            device you might want to wait until you are on Wi-Fi to view them or
            they might not load at all.
          </p>
          <div class="dialog-buttons">
            <button type="button" class="button-confirm" @click="acceptAtlas">
              Gimme those thumbnails!
            </button>
            <button type="button" class="button-cancel" @click="cancelAtlas">
              Don't show thumbnails
            </button>
          </div>
        </div>
      </a11y-dialog>
      <viz class="viz" ref="viz" />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Viz from '@/components/Viz.vue'

const FILES_BASE_URL = process.env.VUE_APP_FILES_BASE_URL
const MAX_TITLE_LENGTH = 140

export default {
  components: { Viz },
  data() {
    return {
      dialog: null,
      atlasShown: this.showAtlases,
      filesBaseUrl: FILES_BASE_URL,
      headerHidden: false,
      controlsHidden: false,
      fileHidden: false
    }
  },
  watch: {
    fileData(newData) {
      if (newData.id) this.fileHidden = false
    }
  },
  methods: {
    pathFor(sort, bucket) {
      const path = { path: '/', query: {} }
      if (bucket) path.query.bucket = bucket.key
      if (sort && sort !== 'default') path.query.sort = sort
      return path
    },
    copyColor(color) {
      navigator.clipboard.writeText(color)
    },
    back() {
      this.$refs.viz.backToEverything()
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
    assignDialogRef(dialog) {
      this.dialog = dialog
      this.dialog.on('hide', () => {
        if (!this.confirmedAtlas) {
          this.atlasShown = !this.atlasShown
        }
      })
    }
  },
  computed: {
    bucket() {
      return this.currentBucket ? this.currentBucket.key : null
    },
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
    total() {
      return this.itemsTotal
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
      'showAtlases'
    ])
  },
  created() {
    this.$store.commit('setSort', this.$route.query.sort)
    if (this.$route.query.bucket)
      this.$store.commit('setBucketKey', this.$route.query.bucket)
    this.$store.dispatch('getBuckets')
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

a {
  color: $main-color;
}

.app-loading {
  position: absolute;
  background-color: transparentize($color: $bg-color, $amount: 0.1);
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  color: $main-color;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

$loader-speed: 4s;
$loader-count: 16;
$loader-size: 3rem;
$loader-margin: 0.1;
$loader-side: 4;
$loader-segment: $loader-size / $loader-side;
$p_0: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15;
$p_1: 6, 12, 8, 14, 11, 9, 4, 0, 3, 13, 15, 7, 5, 10, 2, 1;
$p_2: 9, 2, 4, 12, 0, 15, 3, 1, 6, 10, 13, 8, 11, 5, 7, 14;

.squares {
  position: relative;
  margin-bottom: 1rem;
  margin-left: $loader-size;
  transform: translate(
    -1 * $loader-side * $loader-segment,
    -1 * $loader-side * $loader-segment
  );
}

.square {
  display: inline-block;
  width: $loader-segment * (1 - $loader-margin);
  height: $loader-segment * (1 - $loader-margin);
  overflow: hidden;
  position: absolute;
  text-indent: -9999px;
}

@for $i from 1 through $loader-count {
  $x_0: ($i - 1) % $loader-side;
  $y_0: floor(($i - 1) / $loader-side);
  $x_1: nth($p_1, $i) % $loader-side;
  $y_1: floor(nth($p_1, $i) / $loader-side);
  $x_2: nth($p_2, $i) % $loader-side;
  $y_2: floor(nth($p_2, $i) / $loader-side);

  @keyframes loader_#{$i} {
    0% {
      transform: translate($x_0 * $loader-segment, $y_0 * $loader-segment);
    }
    6% {
      transform: translate($x_1 * $loader-segment, $y_1 * $loader-segment);
    }
    33% {
      transform: translate($x_1 * $loader-segment, $y_1 * $loader-segment);
    }
    39% {
      transform: translate($x_2 * $loader-segment, $y_2 * $loader-segment);
    }
    63% {
      transform: translate($x_2 * $loader-segment, $y_2 * $loader-segment);
    }
    69% {
      transform: translate($x_0 * $loader-segment, $y_0 * $loader-segment);
    }
    100% {
      transform: translate($x_0 * $loader-segment, $y_0 * $loader-segment);
    }
  }

  .square_#{$i} {
    background: mix($main-color, #333, random(90) + 10);
    animation: loader_#{$i} $loader-speed infinite ease-in-out;
  }
}

.grid {
  background-color: $bg-color;
  color: $main-color;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto 5rem;
}
.button-back,
.button-hide,
.button-header-toggle {
  display: block;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  background-color: $main-color;
  color: $bg-color;
  text-decoration: none;
  border-radius: 0.2rem;
  padding: 0.125rem 0.5rem;
}
.button-back-wrapper {
  margin: -2.5rem 0 0.5rem 0.25rem;
  transition: margin-top 0.2s ease-out;

  &.active {
    margin-top: 0rem;
  }
}
.button-back {
  display: inline-block;
}
.button-header-toggle {
  position: absolute;
  transform: translateY(50%);
  box-shadow: 0 0 0.25rem $bg-color;
}
.header {
  background-color: transparentize($color: $bg-color, $amount: 0.15);
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
  color: $main-color;
  font-size: 1.25rem;
  font-weight: normal;
  max-width: 80ch;
  margin: 0 auto;
  padding: 0.5rem;

  @media screen and (max-width: 768px) {
    font-size: 0.9rem;
  }
}
.bucket-names {
  display: inline;
}
.controls {
  grid-column: 1/4;
  grid-row: 3/4;
  z-index: 1;
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  background-color: transparentize($color: $bg-color, $amount: 0.15);
  width: 30%;
  min-width: 18rem;
  border-radius: 0.5rem 0.5rem 0 0;
}
.sort {
  display: flex;
  padding-top: 0.5rem;
}
.atlas {
  padding-bottom: 0.5rem;

  label {
    cursor: pointer;
  }
}
.button-sort {
  background-color: $main-color;
  color: $bg-color;
  text-decoration: none;
  display: inline-block;
  border-radius: 0.2rem;
  margin: 0 0 0.5rem 0.5rem;
  padding: 0.25rem 1rem;

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
</style>

<style lang="scss">
@import '@/assets/variables';

body {
  background-color: $bg-color;
  overflow: hidden;
}
</style>
