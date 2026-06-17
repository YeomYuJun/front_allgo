import { createApp } from 'vue'
import './style.css'
import './assets/css/tokens.css'
import App from './App.vue'
import router from './router'
import './assets/css/fonts.css'

const app = createApp(App)

app.use(router)

app.mount('#app')