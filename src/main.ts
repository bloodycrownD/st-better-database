import { createApp } from 'vue'
import MainView from './app/pages/MainView.vue'


const container = document.createElement('div')
const extensionsSettings = document.querySelector('#extensions_settings')
if (extensionsSettings) {
    extensionsSettings.appendChild(container)
    const app = createApp(MainView)
    app.mount(container)
}
