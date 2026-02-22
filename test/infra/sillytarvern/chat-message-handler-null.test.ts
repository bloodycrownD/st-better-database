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
            getTables: template.getTables.bind(template),
            clone: template.clone.bind(template),
            compressDml: (sql: string) => {
                const tableSchemas: any = {};
                const tables = template.getTables();
                for (let i = 0; i < tables.length; i++) {
                    tableSchemas[i] = tables[i];
                }
                const tableEntries = Object.entries(tableSchemas);
                tableEntries.sort((a: any, b: any) => b[1].tableName.length - a[1].tableName.length);
                let result = sql;
                for (const entry of tableEntries as any) {
                    const [idxStr, schema]: [string, any] = entry;
                    const tableIdx = parseInt(idxStr);
                    const tableId = `@t${tableIdx}`;
                    const columnEntries = Object.entries(schema.columnSchemas);
                    columnEntries.sort((a: any, b: any) => b[1].name.length - a[1].name);
                    for (const colEntry of columnEntries as any) {
                        const [colIdxStr, colSchema]: [string, any] = colEntry;
                        const colIdx = parseInt(colIdxStr);
                        const colId = `@t${tableIdx}c${colIdx}`;
                        result = result.replace(new RegExp(`\\b${colSchema.name}\\b`, 'g'), colId);
                    }
                    result = result.replace(new RegExp(`\\b${schema.tableName}\\b`, 'g'), tableId);
                }
                return result;
            }
        } as any;

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
        expect(mockChat[0].mes).toContain('<committed>');
        expect(mockSaveChat).toHaveBeenCalled();
    });
});
