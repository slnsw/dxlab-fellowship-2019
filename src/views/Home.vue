<template>
  <div>
    <section class="intro">
      <h1>
        Home
      </h1>
      <p>intro</p>
      <router-link to="/viewer">
        Enter
      </router-link>
    </section>
    <section>
      <h2>Background</h2>
      <p>some background text</p>
    </section>
    <section class="faq">
      <h2>FAQ</h2>
      <h3>q1</h3>
      <p>answer</p>
      <h3>q2</h3>
      <p>answer</p>
      <h3>q3</h3>
      <p>answer</p>
      <h3>q4</h3>
      <p>answer</p>
    </section>
    <footer>
      <div class="links">
        <a
          href="https://www.sl.nsw.gov.au/disclaimer"
          rel="noopener"
          target="_blank"
          >Disclaimer</a
        >
        /
        <a
          href="https://www.sl.nsw.gov.au/privacy/web-privacy-statement"
          rel="noopener"
          target="_blank"
          >Privacy</a
        >
        /
        <a
          href="https://www.sl.nsw.gov.au/copyright"
          rel="noopener"
          target="_blank"
          >Copyright</a
        >
        /
        <a
          href="https://www.sl.nsw.gov.au/right-to-information"
          rel="noopener"
          target="_blank"
          >Right to information</a
        >
      </div>
      <div class="corporate">
        <a
          class="dxlab-link"
          href="https://dxlab.sl.nsw.gov.au/"
          rel="noopener"
          target="_blank"
          ><img src="/logo-dxlab.png"
        /></a>
        <a
          class="nsw-link"
          href="http://sl.nsw.gov.au/"
          rel="noopener"
          target="_blank"
          ><img src="/logo-slnsw-white.png"
        /></a>
      </div>
    </footer>
    <a11y-dialog
      id="app-dialog"
      app-root="#app"
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
        <span>Special Care Notice</span>
      </template>
      <div>
        <p>
          This website may contain images or documentation relating to
          Aboriginal and Torres Strait Islander people who are deceased.
        </p>
        <p>
          The State Library of NSW acknowledges that its historical collection
          items can be offensive and confronting in today’s context. They are
          published with respect to the descendants and communities of the
          individuals they depict.
        </p>
      </div>
    </a11y-dialog>
  </div>
</template>

<script>
export default {
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

<style lang="scss" scoped>
@import '@/assets/variables';

.corporate {
  display: flex;
}
.dxlab-link,
.nsw-link {
  img {
    height: 1.5rem;
    margin: 2rem;
  }
}
.dxlab-link {
  margin-right: auto;

  img {
    height: 1.3rem;
  }
}
</style>
