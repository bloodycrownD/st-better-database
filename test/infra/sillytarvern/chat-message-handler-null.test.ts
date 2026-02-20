import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

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
import { ChatMetaManager } from '@/infra/sillytarvern/persistent/chat-meta-manager.ts';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType } from '@/infra/sql';

describe('ChatMessageHandler - NULL value and PRIMARY KEY', () => {
    let mockChat: any[];
    let mockSaveChat: any;

    beforeEach(() => {
        mockChat = [];
        mockSaveChat = vi.fn();
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

        const template = new SimpleSqlExecutor();
        template.execute('CREATE TABLE story_setting (name STRING PRIMARY KEY, content STRING)', [SqlType.DDL]);

        const mockTableTemplate = {
            dml2row: vi.fn((sql: string) => {
                return template.dml2row(sql);
            }),
            getTables: template.getTables.bind(template),
            clone: template.clone.bind(template)
        };

        vi.spyOn(ChatMetaManager, 'instance', 'get').mockReturnValue({
            get tableTemplate() {
                return mockTableTemplate;
            }
        } as any);
    });

    it('should handle INSERT with NULL value', () => {
        mockChat.push({
            id: 0,
            mes: '<commit>INSERT INTO story_setting (name, content) VALUES (\'xx\', NULL);</commit>',
            name: 'test',
            role: 'assistant'
        });

        const handler = new ChatMessageHandler();
        (handler as any).processMessage(0);

        console.log('Final message:', mockChat[0].mes);

        expect(mockChat[0].mes).not.toContain('<commit>');
        expect(mockChat[0].mes).toContain('<row>');
        expect(mockSaveChat).toHaveBeenCalled();
    });
});
