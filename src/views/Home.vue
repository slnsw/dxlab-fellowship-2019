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
      <p>
        <a
          href="https://www.sl.nsw.gov.au/research-and-collections/ask-librarian"
          rel="noopener"
          target="_blank"
          >Ask a librarian</a
        >
      </p>
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
          ><img :src="baseUrl + 'logo-dxlab.png'"
        /></a>
        <a
          class="nsw-link"
          href="http://sl.nsw.gov.au/"
          rel="noopener"
          target="_blank"
          ><img :src="baseUrl + 'logo-slnsw-white.png'"
        /></a>
      </div>
    </footer>
    <SpecialCare />
  </div>
</template>

<script>
import SpecialCare from '@/components/SpecialCare'

const BASE_URL = process.env.BASE_URL

export default {
  components: { SpecialCare },
  data() {
    return {
      baseUrl: BASE_URL
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
