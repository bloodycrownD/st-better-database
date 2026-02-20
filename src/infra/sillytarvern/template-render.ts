import {ExtensionSettingManager} from './persistent/extension-setting-manager';

const TEMPLATE_CONTAINER_ID = 'chatTemplateContainer';
const CHAT_CONTAINER_ID = 'chat';

export class TemplateRenderer {
    private static _instance: TemplateRenderer | null = null;

    private constructor() {}

    public static getInstance(): TemplateRenderer {
        if (!TemplateRenderer._instance) {
            TemplateRenderer._instance = new TemplateRenderer();
        }
        return TemplateRenderer._instance;
    }

    public updateChatTemplateDisplay(): void {
        const settings = ExtensionSettingManager.instance;

        if (!settings.chatStatusBarSwitch) {
            this.removeTemplateContainer();
            return;
        }

        const template = settings.chatStatusBarCode.trim();
        if (!template) {
            this.removeTemplateContainer();
            return;
        }

        this.renderTemplateToChat(template);
    }

    private removeTemplateContainer(): void {
        const templateContainer = document.getElementById(TEMPLATE_CONTAINER_ID);
        if (templateContainer) {
            templateContainer.remove();
        }
    }

    private renderTemplateToChat(templateHTML: string): void {
        const escapedHTML = this.escapeIframeContent(templateHTML);
        const chatContainer = document.getElementById(CHAT_CONTAINER_ID);
        if (!chatContainer) return;

        const existingContainer = document.getElementById(TEMPLATE_CONTAINER_ID);
        if (existingContainer) {
            existingContainer.remove();
        }

        chatContainer.insertAdjacentHTML('beforeend', `<div class="wide100p" id="${TEMPLATE_CONTAINER_ID}">${escapedHTML}</div>`);

        const newContainer = document.getElementById(TEMPLATE_CONTAINER_ID);
        if (newContainer) {
            this.attachTouchEventHandlers(newContainer);
        }
    }

    private attachTouchEventHandlers(container: HTMLElement): void {
        const stopPropagation = (e: Event) => e.stopPropagation();

        container.addEventListener('touchstart', stopPropagation, {passive: false});
        container.addEventListener('touchmove', stopPropagation, {passive: false});
        container.addEventListener('touchend', stopPropagation, {passive: false});
    }

    private escapeIframeContent(input: string): string {
        return input.replace(/<iframe\b([^>]*)>([\s\S]*?)<\/iframe>/gi, (match, attributes, content) => {
            if (/\bsrcdoc=/i.test(attributes)) {
                return match;
            }

            const escapedContent = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            return `<iframe${attributes} srcdoc="${escapedContent}"></iframe>`;
        });
    }
}
