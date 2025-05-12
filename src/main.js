import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // 라우터 임포트

// Vuetify 관련 임포트
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import './assets/css/fonts.css'

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App)

app.use(vuetify)
app.use(router) // ◀◀◀ Vue 앱에 라우터 플러그인 사용 등록

app.mount('#app')