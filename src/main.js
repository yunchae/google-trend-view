import Vue from 'vue'
import App from './App.vue'
import Axios from "axios"
import Xlsx from 'xlsx'

Vue.config.productionTip = false
Vue.prototype.$axios = Axios
Vue.prototype.$xlsx = Xlsx

Vue.config.keyCodes.backspace = 8;

new Vue({
  render: h => h(App),
}).$mount('#app')
