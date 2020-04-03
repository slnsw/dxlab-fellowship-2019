import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueA11yDialog from 'vue-a11y-dialog'

Vue.config.productionTip = false

Vue.use(VueA11yDialog)

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')
