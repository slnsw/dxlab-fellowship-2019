<template>
  <section class="field">
    <h2>{{ name }}</h2>
    <ul class="field-list">
      <li
        v-for="(option, index) in options"
        class="field-wrapper"
        :key="(option.id ? option.id : option.type) + '_' + index"
      >
        <label
          class="field-label"
          :for="(option.id ? option.id : option.type) + '_' + id + '_' + index"
        >
          <input
            :id="(option.id ? option.id : option.type) + '_' + id + '_' + index"
            type="checkbox"
            v-model="selectedValues"
            :value="option.id ? option.id : option.type"
          />
          <div
            :class="['field-text', 'facet-bar-value-' + percent(option.total)]"
          >
            {{ option.value }}
            <span class="field-total">
              {{ option.total.toLocaleString() }}
            </span>
          </div>
        </label>
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  props: {
    name: { type: String, required: true },
    value: { type: Array, required: true },
    total: { type: Number, required: true },
    options: { type: Array, required: true }
  },
  data() {
    return { id: null }
  },
  computed: {
    selectedValues: {
      get() {
        return this.value || []
      },
      set(value) {
        this.$emit('input', value)
      }
    }
  },
  methods: {
    percent(value) {
      return Math.floor((value / this.total) * 100)
    }
  },
  mounted() {
    this.id = this._uid
  }
}
</script>

<style lang="scss" scoped>
.field-wrapper {
  display: flex;
}
.field-label {
  align-items: baseline;
  display: flex;
  flex-grow: 1;
  margin-bottom: 0.125rem;
}
.field-text {
  display: flex;
  flex-grow: 1;
}
.field-total {
  margin-left: auto;
  text-align: right;
  width: 7ch;
}
</style>
