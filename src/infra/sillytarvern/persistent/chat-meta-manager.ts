import {ChatSqlExecutor, type SqlExecutor} from "@/infra/sql";
import {
    createAutoSaveProxy,
    ExtensionSettingManager
} from "@/infra/sillytarvern/persistent/extension-setting-manager.ts";

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
 *
 * 序列化失败的可能原因及修复方式：
 *
 * 【1. chatMetadata 引用过期】
 * 原因：每次切换聊天时，SillyTavern 会创建新的 chatMetadata 对象引用
 *      如果缓存了旧引用，后续的保存和读取操作会作用于错误的对象
 *      根据官方文档（https://docs.sillytavern.app/for-contributors/writing-extensions/#chat-metadata）：
 *      "Do not save the reference to chatMetadata in a long-lived variable, as the reference
 *       will change when the chat is switched. Always use SillyTavern.getContext().chatMetadata"
 * 修复：
 *   - 不缓存 chatMetadata 引用到长期变量
 *   - 每次访问时都使用 SillyTavern.getContext().chatMetadata
 *   - 监听 CHAT_CHANGED 事件，切换聊天时重新加载数据
 *
 * 【2. 序列化格式不兼容】
 * 原因：SimpleSqlExecutor 和 ChatSqlExecutor 的序列化格式不同
 *      SimpleSqlExecutor.serialize() 返回 { structure, dataStorage }
 *      ChatSqlExecutor.serialize() 应该直接返回 tableTemplate.serialize() 的结果
 *      如果 ChatSqlExecutor 包装了一层 { tableTemplate: ... }，会导致反序列化失败
 * 修复：
 *   - 确保 ChatSqlExecutor.serialize() 直接返回 tableTemplate.serialize()
 *   - 确保 ChatSqlExecutor.deserialize() 直接调用 tableTemplate.deserialize(data)
 *   - 统一序列化格式，保持兼容性
 *
 * 【3. 缓存策略错误】
 * 原因：如果缓存的是 SqlExecutor 实例而不是序列化数据，
 *      可能导致：
 *      a) 每次保存时都重新序列化，性能问题
 *      b) 序列化格式不一致，导致反序列化失败
 *      c) 缓存的对象类型错误（比如存储了 ChatSqlExecutor 但期望 SimpleSqlExecutor 的格式）
 * 修复：
 *   - 使用双重缓存：_serializedTemplateCache 存储序列化数据，_tableTemplateCache 存储实例
 *   - _serializedTemplateCache 存储的是 object 类型，与序列化格式一致
 *   - 首次访问 tableTemplate 时才从 _serializedTemplateCache 创建实例
 *
 * 【4. 聊天切换时未重新加载】
 * 原因：ChatMetaManager 是单例，但 chatMetadata 会随着聊天切换而改变
 *      如果不重新加载，会一直使用旧的缓存数据
 * 修复：
 *   - 实现 reload() 方法，清空缓存并重新从 chatMetadata 加载
 *   - 监听 CHAT_CHANGED 事件，调用 reload()
 *   - _loadFromMetadata() 中每次都使用 SillyTavern.getContext().chatMetadata
 *
 * 【5. saveMetadata() 未被调用或失败】
 * 原因：自动保存代理可能失效，或者 SillyTavern 的 saveMetadata() 函数有问题
 * 修复：
 *   - 使用 createAutoSaveProxy 拦截 execute 方法，每次执行后自动调用 _saveToMetadata()
 *   - 确保 _saveToMetadata() 中正确调用了 SillyTavern.getContext().saveMetadata()
 *   - 可以添加日志验证 saveMetadata() 是否被正确调用
 *
 * 【6. 数据结构初始化时机错误】
 * 原因：如果在 SillyTavern API 未完全初始化时就访问 chatMetadata，
 *      可能会获取到错误的引用或空对象
 * 修复：
 *   - 使用延迟初始化（lazy initialization），在第一次访问 instance 时才创建
 *   - 不在类加载时调用 SillyTavern.getContext()
 *   - 确保在 APP_READY 事件后再使用 ChatMetaManager
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

    /**
     * 序列化数据缓存
     * 存储的是 object 类型的序列化数据，与 SimpleSqlExecutor.serialize() 的格式一致
     * 这样可以避免频繁序列化，同时保证格式兼容
     */
    private _serializedTemplateCache: object | null = null;

    /**
     * SqlExecutor 实例缓存
     * 首次访问 tableTemplate 时才从 _serializedTemplateCache 创建
     * 避免重复创建实例
     */
    private _tableTemplateCache: SqlExecutor | null = null;

    /**
     * 自动保存代理缓存
     * 拦截 execute 方法，每次执行后自动调用 _saveToMetadata()
     */
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

    /**
     * 从 chatMetadata 加载数据
     *
     * 重要：必须始终使用 SillyTavern.getContext().chatMetadata，不要缓存引用
     * 因为每次切换聊天时，chatMetadata 引用都会改变
     */
    private _loadFromMetadata(): void {
        const {chatMetadata} = SillyTavern.getContext();
        const settings = chatMetadata[ChatMetaManager.MODULE_NAME];

        if (!settings || !settings.tableTemplate) {
            const template = ExtensionSettingManager.instance.tableTemplate;
            const executor = new ChatSqlExecutor(template);
            this._serializedTemplateCache = executor.serialize();
        } else {
            this._serializedTemplateCache = settings.tableTemplate;
        }
        this._tableTemplateCache = null;
        this._tableTemplateProxy = null;
    }

    /**
     * 保存数据到 chatMetadata
     *
     * 重要：必须始终使用 SillyTavern.getContext().chatMetadata，不要缓存引用
     * 因为每次切换聊天时，chatMetadata 引用都会改变
     */
    private _saveToMetadata(): void {
        const {chatMetadata} = SillyTavern.getContext();
        const metadata = chatMetadata[ChatMetaManager.MODULE_NAME] || {};
        metadata.tableTemplate = this._serializedTemplateCache;
        chatMetadata[ChatMetaManager.MODULE_NAME] = metadata;
        SillyTavern.getContext().saveMetadata();
    }

    get tableTemplate(): SqlExecutor {
        if (!this._tableTemplateCache && this._serializedTemplateCache) {
            const template = ExtensionSettingManager.instance.tableTemplate;
            this._tableTemplateCache = new ChatSqlExecutor(template);
            this._tableTemplateCache.deserialize(this._serializedTemplateCache);
        }

        if (!this._tableTemplateProxy && this._tableTemplateCache) {
            this._tableTemplateProxy = createAutoSaveProxy(this._tableTemplateCache, () => {
                this._saveToMetadata();
            });
        }

        return this._tableTemplateProxy || ExtensionSettingManager.instance.tableTemplate;
    }

    set tableTemplate(v: SqlExecutor | object) {
        if (typeof v === 'object' && 'serialize' in v) {
            this._serializedTemplateCache = (v as any).serialize();
        } else {
            this._serializedTemplateCache = v as object;
        }

        this._tableTemplateCache = null;
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

    /**
     * 重新加载元数据
     *
     * 在聊天切换时调用，重新从 chatMetadata 加载数据
     *
     * 重要：每次切换聊天时，chatMetadata 引用会改变（见官方文档）
     * 必须调用此方法清空缓存并重新加载，否则会一直使用旧数据
     */
    public reload(): void {
        this._tableTemplateCache = null;
        this._tableTemplateProxy = null;
        this._loadFromMetadata();
    }
}

