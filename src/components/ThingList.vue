<template>
  <section class="thing-list">
    <h1 class="title">{{ title }}</h1>
    <div class="grid">
      <div
        v-for="thing in things"
        :key="'f_' + thing.id"
        :ref="'item' + thing.id"
        class="item"
        @click="expandItem(thing)"
      >
        <img
          :src="thing.files[0].image.variants['150_150'].url"
          v-if="thing.filesTotal > 0"
          class="thumb"
        />
      </div>
      <div ref="expansion" class="expansion collapsed">
        <section class="info" v-if="selected">
          <h2>
            {{ selected.title }}
          </h2>
          <p v-for="(date, index) in selected.dates" :key="index">
            {{ date.dateText }}
          </p>
        </section>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  props: {
    things: { type: Array, required: true },
    title: { type: String, required: true }
  },
  data() {
    return { selected: null, expanded: null }
  },
  mounted() {
    // Register resize when the Vue component is ready
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    // Unregister resize before destroying this Vue instance
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    onResize() {
      this.setRow()
    },
    setRow() {
      const expansion = this.$refs.expansion
      const expanded = this.expanded
      if (!expanded) return
      const topExpanded = expanded.offsetTop
      if (topExpanded === 0) {
        // first row
        expansion.style = 'grid-row-start: 2;'
        return
      }
      // not in top so we need to find what row
      const tops = [topExpanded]
      let el = expanded.previousElementSibling
      while (el) {
        tops.push(el.offsetTop)
        el = el.previousElementSibling
      }
      const unique = tops.filter(
        (val, idx, array) => array.indexOf(val) === idx
      )
      expansion.style = 'grid-row-start: ' + (unique.length + 1) + ';'
    },
    expandItem(thing) {
      console.log(thing)
      if (this.expanded) {
        this.expanded.classList.remove('expanded')
      }
      this.selected = thing
      this.expanded = this.$refs['item' + thing.id][0]
      this.expanded.classList.add('expanded')
      this.$refs.expansion.classList.remove('collapsed')
      this.setRow()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

.thing-list {
  padding: 0.5rem 0;
}

.title {
  background-color: #eee;
  border-bottom: 1px solid #fff;
  position: sticky;
  top: 0;
  z-index: 1;
}

.grid {
  display: grid;
  grid-gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  position: relative;
}

.item {
  background-color: $thumb-color;
  height: 0;
  padding-bottom: 100%; /* 16:9 */
  position: relative;
}

.info {
  padding: 1rem;
}

.thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.expanded {
  position: relative;
  background-color: $expansion-color;
}

.expanded:after {
  display: block;
  position: absolute;
  content: '';
  border: 1rem solid transparent;
  border-bottom-color: $expansion-color;
  border-top: none;
  bottom: -1rem;
  left: 50%;
  margin-left: -1rem;
}

.expansion {
  background-color: $expansion-color;
  grid-column-start: 1;
  grid-column-end: -1;
  grid-row-start: 3;
  max-height: 100vh;
  overflow-x: hidden;
  overflow-y: scroll;
  transition: max-height 0.2s ease-out;

  &.collapsed {
    max-height: 0vh;
  }
}
</style>
