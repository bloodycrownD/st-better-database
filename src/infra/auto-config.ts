import {ChatMessageHandler} from "@/infra/sillytarvern";
import {Openapi} from "@/infra/openapi";
import {TemplateRenderer} from "@/infra/sillytarvern/template-render";
import {ExtensionSettingManager} from "@/infra/sillytarvern/persistent/extension-setting-manager";

export class AutoConfig {
    static init() {
        ChatMessageHandler.init();
        Openapi.init();

        const templateRenderer = TemplateRenderer.getInstance();
        templateRenderer.updateChatTemplateDisplay();

        ExtensionSettingManager.instance.onChatStatusBarChange(() => {
            templateRenderer.updateChatTemplateDisplay();
        });
    }
}
