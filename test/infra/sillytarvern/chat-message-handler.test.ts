import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

beforeAll(() => {
    global.SillyTavern = {
        getContext: () => ({
            chat: [],
            chatMetadata: {},
            extensionSettings: {},
            saveChat: vi.fn(),
            saveMetadata: vi.fn(),
            saveSettingsDebounced: vi.fn()
        })
    } as any;
});

import { ChatMessageHandler } from '@/infra/sillytarvern/message/chat-message-handler.ts';
import { ChatMessageManager } from '@/infra/sillytarvern/message/chat-message-manager.ts';
import { ChatMetaManager } from '@/infra/sillytarvern/persistent/chat-meta-manager.ts';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType } from '@/infra/sql';

describe('ChatMessageHandler', () => {
    let mockChat: any[];
    let mockSaveChat: any;
    let mockEventSource: any;

    beforeEach(() => {
        // Reset ChatMetaManager singleton to prevent state accumulation between tests
        // This fixes the issue where tests would hang due to singleton carrying over state
        (ChatMetaManager as any)._instance = null;
 
        mockChat = [];
        mockSaveChat = vi.fn();
        mockEventSource = {
            on: vi.fn()
        };

        global.SillyTavern = {
            getContext: () => ({
                chat: mockChat,
                chatMetadata: {},
                extensionSettings: {},
                saveChat: mockSaveChat,
                saveMetadata: vi.fn(),
                saveSettingsDebounced: vi.fn()
            })
        } as any;
    });

    describe('init', () => {
        it('should initialize only once', () => {
            const handler1 = ChatMessageHandler.init();
            const handler2 = ChatMessageHandler.init();
            expect(handler1).toBe(handler2);
        });
    });

    describe('processMessage - commit to row conversion', () => {
        let spy: any;
 
        beforeEach(() => {
            // Spy on ChatMetaManager.instance to provide a mock tableTemplate
            // This prevents the actual ChatMetaManager from accessing SillyTavern.getContext()
            // which may not be properly mocked in all test scenarios
            mockChat = [];
            mockSaveChat = vi.fn();
 
            const template = new SimpleSqlExecutor();
            template.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);
 
            const mockTableTemplate = {
                dml2row: vi.fn((sql: string) => {
                    return template.dml2row(sql);
                }),
                getTables: template.getTables.bind(template),
                clone: template.clone.bind(template)
            };
 
            spy = vi.spyOn(ChatMetaManager, 'instance', 'get').mockReturnValue({
                get tableTemplate() {
                    return mockTableTemplate;
                }
            } as any);
        });
 
        afterEach(() => {
            // Restore the spy to prevent interference with other tests
            spy.mockRestore();
        });

        it('should convert commit to row and remove commit tag', () => {
            mockChat.push({
                id: 0,
                mes: 'text <commit>INSERT INTO users (id, name) VALUES (1, \'Alice\')</commit>',
                name: 'test',
                role: 'assistant'
            });

            const handler = new ChatMessageHandler();
            (handler as any).processMessage(0);

            expect(mockChat[0].mes).not.toContain('<commit>');
            expect(mockChat[0].mes).toContain('<row>');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should append to existing row', () => {
            mockChat.push({
                id: 0,
                mes: '<row>[{"tableIdx":0,"action":"insert","after":{"0":1,"1":"Bob"}}]</row> ' +
                     '<commit>INSERT INTO users (id, name) VALUES (2, \'Alice\')</commit>',
                name: 'test',
                role: 'assistant'
            });

            const handler = new ChatMessageHandler();
            (handler as any).processMessage(0);

            const rowContent = ChatMessageManager.extractRow(mockChat[0].mes);
            const rows = JSON.parse(rowContent!);
            expect(rows.length).toBe(2);
            expect(mockChat[0].mes).not.toContain('<commit>');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should not modify message without commit', () => {
            const originalMes = 'message without commit';
            mockChat.push({
                id: 0,
                mes: originalMes,
                name: 'test',
                role: 'assistant'
            });

            const handler = new ChatMessageHandler();
            (handler as any).processMessage(0);

            expect(mockChat[0].mes).toBe(originalMes);
            expect(mockSaveChat).not.toHaveBeenCalled();
        });

        it('should preserve text outside commit tag', () => {
            mockChat.push({
                id: 0,
                mes: 'before text <commit>INSERT INTO users (id, name) VALUES (1, \'Alice\')</commit> after text',
                name: 'test',
                role: 'assistant'
            });

            const handler = new ChatMessageHandler();
            (handler as any).processMessage(0);

            expect(mockChat[0].mes).toContain('before text');
            expect(mockChat[0].mes).toContain('after text');
            expect(mockChat[0].mes).not.toContain('<commit>');
            expect(mockChat[0].mes).toContain('<row>');
        });
    });

    describe('event handling', () => {
        beforeEach(() => {
            global.SillyTavern = {
                getContext: () => ({
                    chat: mockChat,
                    chatMetadata: {},
                    extensionSettings: {},
                    saveChat: mockSaveChat,
                    saveMetadata: vi.fn(),
                    saveSettingsDebounced: vi.fn(),
                    eventSource: mockEventSource,
                    event_types: {
                        MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
                        MESSAGE_EDITED: 'MESSAGE_EDITED',
                        MESSAGE_DELETED: 'MESSAGE_DELETED',
                        CHAT_CHANGED: 'CHAT_CHANGED'
                    }
                })
            } as any;
        });

        it('should register event listeners', () => {
            const handler = new ChatMessageHandler();
            handler.registerEventListeners();
            expect(mockEventSource.on).toHaveBeenCalled();
        });
    });
});
