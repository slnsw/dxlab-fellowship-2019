import * as VueThreejs from 'vue-threejs'

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

Vue.use(VueThreejs)

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')
