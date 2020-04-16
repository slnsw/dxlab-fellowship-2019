<template>
  <div class="wrapper">
    <section class="intro">
      <h1 id="aereo">
        <img
          class="logo-aereo"
          :src="baseUrl + 'assets/logo-txt.svg'"
          alt="Aereo"
        />
        <span class="visuallyhidden">Aereo</span>
      </h1>
      <div class="hero">
        <img
          class="image-hero"
          :src="`${baseUrl}assets/hero@0.5x.jpg`"
          alt=""
          :srcset="
            `${baseUrl}assets/hero.jpg 1x, ${baseUrl}assets/hero@2x.jpg 2x`
          "
        />
      </div>
      <p class="lede">
        <em>Aereo</em> is an attempt at looking at library digital collections
        as a whole, rather than a list of discrete items or files in response to
        a keyword search. By displaying everything<sup class="footnote-ref"
          ><a href="#fn1" id="fnref1">1</a></sup
        >
        in a single interface there is hopefully more opportunity for a
        broad-based and serendipitous exploration of the collection.
      </p>
      <router-link class="enter" to="/viewer">ENTER</router-link>
    </section>
    <section class="categories">
      <img
        class="standalone image-categories"
        :src="`${baseUrl}assets/categories@0.5x.jpg`"
        alt="The main view of categories in Aereo"
        :srcset="
          `${baseUrl}assets/categories.jpg 1x, ${baseUrl}assets/categories@2x.jpg 2x`
        "
      />
      <p>
        To the layperson, a library “item” can represent many different things:
        <a href="https://collection.sl.nsw.gov.au/record/1l4lKpX1"
          >a collection of personal records, architectural drawings,
          photographs, and other documents from the construction of the Sydney
          Opera House</a
        >;
        <a href="https://collection.sl.nsw.gov.au/record/nV2qer7n"
          >a group of sketches</a
        >
        from that same collection;
        <a href="https://collection.sl.nsw.gov.au/digital/yJz2xMPA07eWa"
          >a photograph of a scale model</a
        >
        during the construction phase of the project, in that same collection.
        <em>Aereo</em> is only concerned with the digital surrogates of these
        items: the <em>files</em>, photographs taken by library staff to these
        items. The categories and years for these files are inherited from the
        items they portray. An item might fall under multiple categories (e.g.:
        medals are also objects) and can also have multiple files, like
        <a href="https://collection.sl.nsw.gov.au/record/n88X6WJn"
          >this model of the Globe Theatre, London</a
        >
        which can be seen from different angles and even has
        <a href="https://collection.sl.nsw.gov.au/digital/jjV5LQrwxpVdL"
          >a drawer</a
        >.
      </p>
      <img
        class="standalone image-globe"
        :src="`${baseUrl}assets/globe@0.5x.jpg`"
        alt="Model of the Globe Theatre, London"
        :srcset="
          `${baseUrl}assets/globe.jpg 1x, ${baseUrl}assets/globe@2x.jpg 2x`
        "
      />
      <p>
        Not every item is (or will be) photographed by SLNSW to be published
        online. As of early February 2020, when this fellowship began and I
        received a bulk data set, SLNSW had provided access to over two million
        item files. I selected a subset of {{ total }} categories (or “formats”
        in library parlance) to work with:
        <span v-for="(bucket, index) in bucketNames" :key="'b_' + index">
          <span v-if="index === bucketNames.length - 1"> and </span>
          <router-link :to="pathFor(sort, { key: bucket.key })">{{
            bucket.name
          }}</router-link>
          <span v-if="index < bucketNames.length - 1">, </span>
          <span v-if="index === bucketNames.length - 1">.</span>
        </span>
        These categories comprise about 1.2 million files which were then
        analysed with different algorithms to produce <em>Aereo</em>.
      </p>
      <p>
        This selection left out, for example, books (some interesting book
        covers but mostly text and remember that each image of each page of
        every book would be present in <em>Aereo</em> and we’re talking of about
        1.5 million books here so… skipped this one), audio and music (although
        it would be interesting to explore an interface that would combine both
        audio and images).
      </p>
      <p>
        If you look at the formats available currently in the
        <a href="https://collection.sl.nsw.gov.au/digital">library website</a>
        you will notice only 11 and I have just mentioned {{ total + 3 }}. That
        is because I had access to a bit more granular data about the items.
        This data is not surfaced directly in the site either because it is
        incomplete or otherwise not up to the high standards the library has in
        serving its materials to patrons <mark>(need to double-check)</mark>.
        You will probably see things that seem off and that is to be expected.
        For any questions regarding the categorization, you can
        <a
          href="https://www.sl.nsw.gov.au/research-and-collections/ask-librarian"
          >ask a librarian</a
        >.
      </p>
    </section>
    <section class="sorting">
      <h2 id="sorting-and-machine-learning">Sorting and machine learning</h2>
      <p>
        <em>Aereo</em> comprises about 1.2 million files in
        {{ total }} different categories that can each be organized in four
        ways: unsorted, year, colour, and “look alike”.
      </p>
      <video
        class="video"
        type="video/mp4"
        height="auto"
        preload
        loop
        autoplay
        muted
        playsInline
      >
        <source :src="`${baseUrl}assets/sorting.mp4`" type="video/mp4" />
        <p>
          This displays a video. You can
          <a
            :href="`${baseUrl}assets/sorting.mp4`"
            target="_blank"
            rel="noopener"
            >download the video</a
          >
          instead.
        </p>
      </video>

      <h3 id="unsorted">1. Unsorted</h3>
      <p>
        Pretty self-explanatory, except that it isn’t
        <em>really</em> “unsorted”. This sorting is just the default way the
        files were returned by a query done to the library database. It is kind
        of like doing an empty search on a given category and receiving results
        sorted by “relevance”. This relevance is simply a measure of different
        weights given to different parts of the metadata of items and ranking
        them by the score they get. For example, the title of an item could be
        weighted higher than its author or format, so an item with title “May
        Gibbs” and format “photograph” could appear before an item with title
        “Illustration for Snugglepot and Cuddlepie” and author “May Gibbs”. As
        you can imagine, fine-tuning these weights is a difficult process and
        can be counterbalanced by the presence of other sorting criteria. The
        most common being alphabetical (by author or title) and…
      </p>
      <h3 id="year">2. Year</h3>
      <p>
        Dates are another common criteria for search interface sorting, that is,
        when items <em>do</em> have a date associated with them. In the SLNSW
        data set an item can have multiple dates or none at all. For the purpose
        of this project I chose to work with what the data set calls
        <code>published.date_creation</code> and
        <code>archive.date_production</code> as items have either one or the
        other and it corresponds to what their name implies
        <mark>(need to verify that this is the case)</mark>. These dates are
        sometimes also represented as a range (e.g. 28 July 1914 to 11 November
        1918) so I selected the year of the lower bound of any range I found
        (e.g.: 1914). In case of no date found it will be zero and not
        displayed.
      </p>
      <h3 id="colour">3. Colour</h3>
      <p>
        I wanted to provide new ways of sorting and looking at the items, beyond
        of what already existed in the SLNSW data set. I processed all 2 million
        images through a
        <a href="http://mkweb.bcgsc.ca/colorsummarizer/">colour summarizer</a>
        that extracts the most prominent colours from an image as well as other
        information such as its histogram. This information is displayed above
        the selected image as coloured boxes, the size of which is proportional
        to the amount of that colour in the image:
      </p>
      <div class="palettes">
        <img
          class="image-palette"
          :src="`${baseUrl}assets/palette1@0.5x.png`"
          alt="An example color palette"
          :srcset="
            `${baseUrl}assets/palette1.png 1x, ${baseUrl}assets/palette1@2x.png 2x`
          "
        />
        <img
          class="image-palette"
          :src="`${baseUrl}assets/palette2@0.5x.png`"
          alt="An example color palette"
          :srcset="
            `${baseUrl}assets/palette2.png 1x, ${baseUrl}assets/palette2@2x.png 2x`
          "
        />
        <img
          class="image-palette"
          :src="`${baseUrl}assets/palette3@0.5x.png`"
          alt="An example color palette"
          :srcset="
            `${baseUrl}assets/palette3.png 1x, ${baseUrl}assets/palette3@2x.png 2x`
          "
        />
      </div>
      <p>
        As a bonus, clicking on a colour will copy its hexadecimal red, green,
        blue value (e.g.: “#FF0000” for red) to the clipboard.
      </p>
      <p>
        Sorting by colour
        <a href="https://www.alanzucconi.com/2015/09/30/colour-sorting/"
          >is hard</a
        >, especially when we’re talking about 500 thousand images as is the
        case for manuscripts. For simplicity, I’m choosing the
        <strong>first colour</strong>, which is the most prominent from the list
        of five and sorting by hue, then saturation and, finally, lightness.
        Colour sorting is
        <router-link
          :to="{ path: '/viewer', query: { bucket: 'pictures', sort: 'hue' } }"
          >better viewed when image thumbnails are not visible</router-link
        >:
      </p>
      <img
        class="standalone image-colour"
        :src="`${baseUrl}assets/colour@0.5x.png`"
        alt="Colour sorting example"
        :srcset="
          `${baseUrl}assets/colour.png 1x, ${baseUrl}assets/colour@2x.png 2x`
        "
      />
      <h3 id="“look-alike”">4. “Look alike”</h3>
      <p>
        The Library has done some
        <a
          href="https://www.sl.nsw.gov.au/blogs/tiger-using-artificial-intelligence-discover-our-collections"
          >great work using machine learning to automatically create descriptive
          keywords</a
        >
        for item files called TIGER. A similar process is used for the “look
        alike” sorting in <em>Aereo</em> but, while TIGER aims to provide a
        description of an individual file, I use it to determine how similar
        images are to each other. The process basically provides a score between
        0 and 1 for 4,096 words for every one of the 2 million images. This
        score represents how confident the algorithm is on a given word being
        present in an image: 0 being total certainty it <em>is not</em> present
        and 1 being total certainty it <em>is</em> present. Since there will
        always be some level of uncertainty, zeroes or ones will rarely come up,
        and more often values in between will be returned:
      </p>
      <div class="predictions first">
        <img
          class="image-predictions"
          :src="`${baseUrl}assets/predictions1@0.5x.jpg`"
          alt="An example of (very wrong) text predictions"
          :srcset="
            `${baseUrl}assets/predictions1.jpg 1x, ${baseUrl}assets/predictions1@2x.jpg 2x`
          "
        />
        <img
          class="image-predictions"
          :src="`${baseUrl}assets/predictions2@0.5x.jpg`"
          alt="An example of (very wrong) text predictions"
          :srcset="
            `${baseUrl}assets/predictions2.jpg 1x, ${baseUrl}assets/predictions2@2x.jpg 2x`
          "
        />
      </div>
      <div class="predictions second">
        <img
          class="image-predictions"
          :src="`${baseUrl}assets/predictions3@0.5x.jpg`"
          alt="An example of (very wrong) text predictions"
          :srcset="
            `${baseUrl}assets/predictions3.jpg 1x, ${baseUrl}assets/predictions3@2x.jpg 2x`
          "
        />
        <img
          class="image-predictions"
          :src="`${baseUrl}assets/predictions4@0.5x.jpg`"
          alt="An example of (very wrong) text predictions"
          :srcset="
            `${baseUrl}assets/predictions4.jpg 1x, ${baseUrl}assets/predictions4@2x.jpg 2x`
          "
        />
      </div>
      <p>
        Machine learning algorithms are only as good as their training data:
        somebody has previously classified by hand as many images as possible
        with a set of words or labels, and the algorithm “learns” what, for
        example, a photo with a cat or a dog “looks like”. These algorithms and
        training sets are hard to produce so there aren’t many available and
        companies that have proprietary versions charge a lot of money for their
        use. Fortunately there are open source data sets, one of which, called
        <a href="http://image-net.org/about-stats">Imagenet</a> is in use in
        <em>Aereo</em>. Imagenet is trained on contemporary images, so it is
        “looking” for things like “food processor”, “vacuum cleaner”, or
        “Frisbee”, which may not be present in a collection that spans hundreds
        of years to the past and, conversely, contains images for words not
        present in the Imagenet vocabulary. While these words won’t be useful to
        describe the images themselves, it can be useful to find images that
        <em>look similar to the algorithm</em>. The algorithm will make
        mistakes, classifying an image as, for example, a Frisbee, but it will
        make similar mistakes for images that look similar (other images that
        look like Frisbees to the algorithm). Notice how, in the two black and
        white images above, the algorithm has mistakenly classified them as
        “barbershop” and “barber chair” but the images do look similar: black
        and white, a person in a white outfit standing holding something,
        indoors in a relatively asceptic environment. The complete process of
        converting these values into a similarity score will be described in a
        separate post but you can
        <router-link
          :to="{
            path: '/viewer',
            query: { bucket: 'paintings', sort: 'similar' }
          }"
          >see it in action</router-link
        >.
      </p>
      <img
        class="standalone image-similarity"
        :src="`${baseUrl}assets/similarity@0.5x.jpg`"
        alt="Images sorted by similarity"
        :srcset="
          `${baseUrl}assets/similarity.jpg 1x, ${baseUrl}assets/similarity@2x.jpg 2x`
        "
      />
    </section>
    <section class="data">
      <h2 id="its-all-yours">It’s all yours!</h2>
      <p>
        <em>Aereo</em> is only an interface to a bunch of data that I have
        produced with the help of the awesome DX-Lab and web teams of the State
        Library of New South Wales and all of it is available for you to
        download and do whatever you want to with it.
        <strong
          >Processing and classifying two million images was no small
          task</strong
        >, and you don’t have to!
      </p>
      <h3 id="code-repositories">Code repositories</h3>
      <ul>
        <li>
          <a href="https://github.com/slnsw/dxlab-fellowship-2019"
            >Repository for <em>Aereo</em> interface</a
          >
        </li>
        <li>
          <a href="https://github.com/mgiraldo/image-utils"
            >Repository for image colour and similarity processing</a
          >
        </li>
        <li>
          <a href="https://github.com/mgiraldo/aereo-pixels"
            >Repository for thumbnail processing for <em>Aereo</em></a
          >
        </li>
      </ul>
      <h3 id="data-and-files">Data and files</h3>
      <table>
        <thead>
          <tr>
            <th class="name">Name</th>
            <th class="files">
              File count<sup class="footnote-ref"
                ><a href="#fn2" id="fnref2">2</a></sup
              >
            </th>
            <th class="size">Size</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>File ID to URL mapping for categories/full set</td>
            <td>22</td>
            <td>48.1 MB</td>
          </tr>
          <tr>
            <td>Colour summarizing (full version, gzipped)</td>
            <td>2,212,318</td>
            <td>64.3 GB</td>
          </tr>
          <tr>
            <td>Colour summarizing (compact version)</td>
            <td>2,231,480</td>
            <td>1.3 GB</td>
          </tr>
          <tr>
            <td>Image predictions (4,096 word values)</td>
            <td>2,231,222</td>
            <td>33.8 GB</td>
          </tr>
          <tr>
            <td>Image similarity intermediate data</td>
            <td>81</td>
            <td>2.9 GB</td>
          </tr>
          <tr>
            <td>Image thumbnails (150x150 pixels)</td>
            <td>2,231,496</td>
            <td>9.8 GB</td>
          </tr>
          <tr>
            <td>Image thumbnails (32x32 pixels)</td>
            <td>2,238,557</td>
            <td>3.5 GB</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="footnotes">
      <ol class="footnotes-list">
        <li id="fn1" class="footnote-item">
          <p>
            [1] “everything” is a complicated word in library land and will be
            addressed in a future post but for now let’s say it means everything
            that was digitised at SLNSW by early February 2020 and was
            classified in the selected categories.
            <a href="#fnref1" class="footnote-backref">↩︎</a>
          </p>
        </li>
        <li id="fn2" class="footnote-item">
          <p>
            [2] The discrepancy in file counts is due to some images being
            unable to be processed on any given step. Some files may also be
            empty.
            <a href="#fnref2" class="footnote-backref">↩︎</a>
          </p>
        </li>
      </ol>
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
    <SpecialCare />
  </div>
</template>

<script>
import { mapState } from 'vuex'

import SpecialCare from '@/components/SpecialCare'

const BASE_URL = process.env.BASE_URL

export default {
  components: { SpecialCare },
  data() {
    return {
      baseUrl: BASE_URL
    }
  },
  computed: {
    total() {
      return this.bucketNames.length
    },
    bucketNames() {
      return Object.values(this.stuff)
    },
    ...mapState(['stuff'])
  },
  methods: {
    pathFor(sort, bucket) {
      const path = { path: '/viewer', query: {} }
      if (bucket) path.query.bucket = bucket.key
      if (sort && sort !== 'default') path.query.sort = sort
      return path
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

.wrapper {
  min-height: 100%;
  max-width: 70ch;
  margin: 0 auto;
  padding: 0 1rem;
}

section {
  margin-bottom: 3rem;
}

.logo-aereo {
  width: 8rem;
  height: 8rem;
  margin: 1rem 0 1rem -3rem;

  @media screen and (max-width: 90ch) {
    width: 6rem;
    height: 6rem;
    margin-left: -1rem;
  }
}

h3 {
  margin-top: 2rem;
}

p {
  margin-bottom: 1rem;
}

table {
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border-bottom: 0.0625rem solid $border-color;
    padding: 0.25rem 0.5rem;
  }

  td {
    text-align: right;
  }

  td:nth-child(1) {
    text-align: left;
  }

  th {
    white-space: nowrap;
  }

  .name {
    text-align: left;
  }
}

.hero {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  z-index: -1;
  filter: brightness(0.75);
  mask-image: linear-gradient(
    transparentize($bg-color, 0.75),
    transparent 80vh
  );
  overflow: hidden;
}

.image-hero {
  @media screen and (max-width: 90ch) {
    height: 100%;
    max-width: initial;
  }
}

.lede {
  font-size: 1.5rem;
  text-align: center;

  @media screen and (max-width: 90ch) {
    font-size: 1.2rem;
  }
}

.enter {
  font-size: 1.5rem;
  background-color: $main-color;
  color: $bg-color;
  text-decoration: none;
  display: block;
  width: 8rem;
  text-align: center;
  border-radius: 0.2rem;
  margin: 2rem auto;
  padding: 0.25rem 1rem;
}

.standalone {
  display: block;
  margin: 2rem auto;
}

.video {
  display: block;
  width: 70%;
  margin: 2rem auto;
}

.palettes,
.predictions {
  align-items: start;
  display: flex;
  margin: 2rem auto;
}

.predictions {
  width: 100%;

  &.first {
    margin-bottom: 1px;
  }

  &.second {
    margin-top: 0;
  }
}

.image-predictions {
  width: 50%;
  margin-right: 1px;

  &:last-child {
    margin-right: 0;
  }
}

.image-palette {
  margin-right: 1px;
  width: 33%;

  &:last-child {
    margin-right: 0;
  }
}

.footnotes {
  background-color: lighten($bg-color, 5%);
  border-top: 0.125rem solid $border-color;
  padding: 0.5rem 0.5rem 0.25rem;
}

footer {
  padding: 5rem 0 10rem;
}

.links {
  text-align: center;
}

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
