import {ChatSqlExecutor, type SqlExecutor} from "../sql";
import {createAutoSaveProxy, ExtensionSettingManager} from "@/infra/sillytarvern/extension-setting-manager.ts";

/**
 * ChatMetaManager 管理 SillyTavern 聊天级别的元数据持久化
 * 
 * 设计说明：
 * 1. 单例延迟初始化：使用延迟初始化（lazy initialization）而非立即初始化
 *    - 避免类加载时就访问 SillyTavern.getContext()
 *    - 确保第一次访问时 SillyTavern API 已完全初始化
 *    - 防止获取到错误的 chatMetadata 引用，导致保存和加载的数据不一致
 * 
 * 2. 代理自动保存：通过 Proxy 拦截 execute 方法，每次 SQL 执行后自动持久化
 *    - 确保表结构修改（DDL）立即保存到 chatMetadata
 *    - chatMetadata 绑定到当前聊天，刷新或切换聊天时会加载不同数据
 */
export class ChatMetaManager {
    static readonly MODULE_NAME = 'ST_BETTER_DATABASE';

    /**
     * 单例实例，使用 null 初始化实现延迟初始化
     * 
     * 延迟初始化的原因：
     * - 如果使用 readonly _instance = new ChatMetaManager()，会在类加载时就创建实例
     * - 此时 SillyTavern.getContext() 可能返回未完全初始化的上下文
     * - 导致 chatMetadata 引用错误，后续的保存和加载操作无法正确持久化
     */
    private static _instance: ChatMetaManager | null = null;

    private _tableTemplateCache: SqlExecutor | null = null;
    private _tableTemplateProxy: SqlExecutor | null = null;

    private constructor() {
        const {chatMetadata} = SillyTavern.getContext();

        if (!chatMetadata[ChatMetaManager.MODULE_NAME]) {
            chatMetadata[ChatMetaManager.MODULE_NAME] = {
                tableTemplate: null
            };
        }

        this._loadFromMetadata();
    }

    private _loadFromMetadata(): void {
        const {chatMetadata} = SillyTavern.getContext();
        const settings = chatMetadata[ChatMetaManager.MODULE_NAME];

        if (!settings || !settings.tableTemplate) {
            const template = ExtensionSettingManager.instance.tableTemplate;
            this._tableTemplateCache = new ChatSqlExecutor(template);
            this._tableTemplateProxy = createAutoSaveProxy(this._tableTemplateCache, () => {
                this._saveToMetadata();
            });
            this._saveToMetadata();
        } else {
            try {
                this._tableTemplateCache = new ChatSqlExecutor(ExtensionSettingManager.instance.tableTemplate);
                this._tableTemplateCache.deserialize(settings.tableTemplate);
                this._tableTemplateProxy = createAutoSaveProxy(this._tableTemplateCache, () => {
                    this._saveToMetadata();
                });
            } catch (e) {
                console.error('Failed to deserialize tableTemplate from metadata:', e);
                this._tableTemplateCache = null;
                this._tableTemplateProxy = null;
            }
        }
    }

    private _saveToMetadata(): void {
        const {chatMetadata} = SillyTavern.getContext();
        const metadata = chatMetadata[ChatMetaManager.MODULE_NAME] || {};
        metadata.tableTemplate = this._tableTemplateCache?.serialize();
        chatMetadata[ChatMetaManager.MODULE_NAME] = metadata;
        SillyTavern.getContext().saveMetadata();
    }

    get tableTemplate(): SqlExecutor {
        if (!this._tableTemplateCache) {
            const template = ExtensionSettingManager.instance.tableTemplate;
            this._tableTemplateCache = new ChatSqlExecutor(template);
        }

        if (!this._tableTemplateProxy) {
            this._tableTemplateProxy = createAutoSaveProxy(this._tableTemplateCache, () => {
                this._saveToMetadata();
            });
        }

        return this._tableTemplateProxy;
    }

    set tableTemplate(v: SqlExecutor | object) {
        if (typeof v === 'object' && 'serialize' in v) {
            const serialized = (v as any).serialize();
            const template = ExtensionSettingManager.instance.tableTemplate;
            this._tableTemplateCache = new ChatSqlExecutor(template);
            this._tableTemplateCache.deserialize(serialized);
        } else {
            this._tableTemplateCache = new ChatSqlExecutor(v as SqlExecutor);
        }

        this._tableTemplateProxy = null;
        this._saveToMetadata();
    }

    /**
     * 获取单例实例
     * 
     * 延迟初始化：第一次访问时才创建实例
     * 确保此时 SillyTavern.getContext() 已完全初始化
     */
    public static get instance(): ChatMetaManager {
        if (!ChatMetaManager._instance) {
            ChatMetaManager._instance = new ChatMetaManager();
        }
        return ChatMetaManager._instance;
    }
}

