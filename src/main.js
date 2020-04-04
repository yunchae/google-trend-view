import Vue from 'vue'
import App from './App.vue'
import Axios from "axios"
import Xlsx from 'xlsx'
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';

import Moment from 'moment-timezone'
Moment.tz.setDefault("Asia/Tokyo")

Vue.config.productionTip = true
Vue.prototype.$axios = Axios
Vue.prototype.$xlsx = Xlsx
Vue.prototype.$moment = Moment

Vue.use(Loading)

Vue.config.keyCodes.backspace = 8;

new Vue({
  render: h => h(App),
}).$mount('#app')
