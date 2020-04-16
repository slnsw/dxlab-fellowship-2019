import Vue from 'vue'
import VueA11yDialog from 'vue-a11y-dialog'

import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

Vue.use(VueA11yDialog)

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')
