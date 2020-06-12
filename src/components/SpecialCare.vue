<template>
  <a11y-dialog
    id="app-care"
    app-root="#app"
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
      <span>Special Care Notice</span>
    </template>
    <div>
      <p>
        This website may contain images or documentation relating to Aboriginal
        and Torres Strait Islander people who are deceased.
      </p>
      <p>
        The State Library of NSW acknowledges that its historical collection
        items can be offensive and confronting in today’s context. They are
        published with respect to the descendants and communities of the
        individuals they depict.
      </p>
      <BrowserNotice />
    </div>
  </a11y-dialog>
</template>

<script>
import BrowserNotice from '@/components/BrowserNotice'

export default {
  components: { BrowserNotice },
  data() {
    return {
      dialog: null
    }
  },
  computed: {
    hasSpecialCare() {
      const cookies = document.cookie.split(';')
      return (
        cookies
          .map((c) => c.trim().split('='))
          .filter((c) => c[0] === 'specialCare').length > 0
      )
    }
  },
  methods: {
    assignDialogRef(dialog) {
      this.dialog = dialog
      if (!this.dialog) return
      if (!this.hasSpecialCare) this.dialog.show()
      this.dialog.on('hide', () => {
        document.cookie = 'specialCare=true'
      })
    }
  }
}
</script>

<style lang="scss" scoped></style>
