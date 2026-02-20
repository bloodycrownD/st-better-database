import {createApp} from 'vue'
import MainView from '@/app/screens/pure-screens/MainView.vue'
import {ChatMessageHandler} from "@/infra/sillytarvern";


const container = document.createElement('div')
const extensionsSettings = document.querySelector('#extensions_settings')
if (extensionsSettings) {
    extensionsSettings.appendChild(container)
    const app = createApp(MainView)
    app.mount(container)
}
ChatMessageHandler.init();
