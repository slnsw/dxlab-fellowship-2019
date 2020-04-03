<template>
  <div v-if="loaded" class="grid" id="viewer">
    <div class="header">
      <h1 class="total">
        <p v-if="currentBucket">
          <button type="button" class="button-back" @click="back">
            &lt; back to everything
          </button>
        </p>
        <strong>{{ formattedItemsTotal }}</strong> {{ description }}
      </h1>
    </div>
    <div :class="{ file: true, hidden: !fileData.id || fileHidden }" ref="file">
      <button class="button-hide" type="button" @click="fileHidden = true">
        hide
      </button>
      <div v-if="fileData.palette" class="palette">
        <span
          class="color"
          v-for="(color, index) in fileData.palette"
          :title="fileData.colorNames[index].join(', ')"
          :key="index"
          :style="{
            backgroundColor: color.color,
            width: color.percent * 100 + '%'
          }"
        ></span>
      </div>
      <div class="loading" v-if="!fileData.title">Loading...</div>
      <a
        :href="filesBaseUrl + '/' + fileData.id"
        rel="noopener"
        target="_blank"
      >
        <img
          v-if="fileData.image"
          :src="fileData.image"
          :alt="fileData.title"
          :title="fileData.title"
          class="thumbnail"
        />
      </a>
      <p v-if="fileData.title" class="file-description">
        <a
          :href="filesBaseUrl + '/' + fileData.id"
          rel="noopener"
          target="_blank"
        >
          {{ fileData.title }}
        </a>
      </p>
    </div>
    <div class="controls">
      <div class="sort">
        <router-link
          :class="['button-sort', sort === 'default' ? 'active' : '']"
          :to="{ path: '/' }"
        >
          default
        </router-link>
        <router-link
          :class="['button-sort', sort === 'hue' ? 'active' : '']"
          :to="{ path: '/', query: { sort: 'hue' } }"
        >
          color
        </router-link>
        <router-link
          :class="['button-sort', sort === 'similar' ? 'active' : '']"
          :to="{ path: '/', query: { sort: 'similar' } }"
        >
          similarity
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
          Some categories (manuscripts, photographs, negatives) have
          <em>a lot</em> of images. If you are in a mobile device, these will
          take up a lot of data (a hundred megabytes or more) or might not even
          load at all.
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
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Viz from '@/components/Viz.vue'

const FILES_BASE_URL = process.env.VUE_APP_FILES_BASE_URL

export default {
  components: { Viz },
  data() {
    return {
      atlasShown: this.showAtlases,
      filesBaseUrl: FILES_BASE_URL,
      fileHidden: false
    }
  },
  watch: {
    $route(to) {
      const sort = to.query.sort ? to.query.sort : 'default'
      if (sort !== this.sort) this.$store.commit('setSort', sort)
    },
    fileData(newData) {
      if (newData.id) this.fileHidden = false
    }
  },
  methods: {
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
    }
  },
  computed: {
    description() {
      const l = Object.values(this.stuff).length
      return this.currentBucket
        ? this.currentBucket.description !== ''
          ? this.currentBucket.description.trim()
          : ''
        : Object.values(this.stuff)
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
            (this.currentBucket.description !== '' ? ':' : '')
          : ' '
      }`
    },
    ...mapGetters(['totalFromBuckets']),
    ...mapState([
      'fileData',
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
    this.$store.commit('getBuckets')
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

.grid {
  background-color: $bg-color;
  color: $main-color;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto 5rem;
}
.button-back {
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  background-color: $main-color;
  color: $bg-color;
  display: inline-block;
  text-decoration: none;
  border-radius: 0.2rem;
  margin: 0 0 0.25rem 0.25rem;
  padding: 0.125rem 0.5rem;
}
.header {
  background-color: transparentize($color: $bg-color, $amount: 0.25);
  grid-column: 1/4;
  grid-row: 1/2;
  z-index: 1;
}
.total {
  color: $main-color;
  font-size: 1.25rem;
  font-weight: normal;
  max-width: 60ch;
  margin: 0 auto;
  padding: 0.5rem;
}
.controls {
  grid-column: 1/4;
  grid-row: 3/4;
  z-index: 1;
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  background-color: transparentize($color: $bg-color, $amount: 0.5);
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
  max-width: 30vw;
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
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  background-color: $main-color;
  color: $bg-color;
  display: inline-block;
  text-decoration: none;
  border-radius: 0.2rem;
  margin: 0 0 0.5rem 0.5rem;
  padding: 0.125rem 0.5rem;
}
.loading {
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

  &:last-child {
    margin: 0;
  }
}
.thumbnail {
  object-fit: cover;
  width: 100%;
  height: auto;
}
.file-description {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0.5rem 0.5rem 0 0.5rem;

  a {
    color: $main-color;
  }
}
</style>

<style lang="scss">
body {
  overflow: hidden;
}
</style>
