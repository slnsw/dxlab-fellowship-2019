<template>
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
        ><img :src="baseUrl + 'assets/logo-dxlab.png'"
      /></a>
      <a
        class="nsw-link"
        href="http://sl.nsw.gov.au/"
        rel="noopener"
        target="_blank"
        ><img :src="baseUrl + 'assets/logo-slnsw-white.png'"
      /></a>
    </div>
  </footer>
</template>

<script>
const BASE_URL = process.env.BASE_URL

export default {
  data() {
    return {
      baseUrl: BASE_URL
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

footer {
  background-color: $bg-color;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  font-size: 0.9rem;
  padding: 0.5rem;

  @media screen and (max-width: 720px) {
    font-size: 0.8rem;
    flex-direction: column;
  }
}

.links {
  text-align: center;
  margin-right: 1rem;
}

.corporate {
  display: flex;
  margin-right: auto;

  @media screen and (max-width: 720px) {
    margin-right: initial;
  }
}

.dxlab-link,
.nsw-link {
  img {
    height: 1.25rem;
    margin: 1.1rem;
  }
}

.dxlab-link {
  margin-right: auto;

  img {
    height: 1.1rem;
  }
}
</style>
