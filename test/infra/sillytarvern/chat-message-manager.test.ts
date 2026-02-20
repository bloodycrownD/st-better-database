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

import { ChatMessageManager } from '@/infra/sillytarvern/chat-message-manager';

describe('ChatMessageManager', () => {
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
    });

    describe('extractCommit', () => {
        it('should extract commit content correctly', () => {
            const message = 'text <commit>INSERT INTO table VALUES (1)</commit> more text';
            const result = ChatMessageManager.extractCommit(message);
            expect(result).toBe("INSERT INTO table VALUES (1)");
        });

        it('should return null if no commit tag', () => {
            const message = 'text without tags';
            const result = ChatMessageManager.extractCommit(message);
            expect(result).toBeNull();
        });

        it('should return null if only opening tag', () => {
            const message = 'text <commit> no closing';
            const result = ChatMessageManager.extractCommit(message);
            expect(result).toBeNull();
        });

        it('should extract the last commit if multiple exist', () => {
            const message = '<commit>first</commit> text <commit>second</commit>';
            const result = ChatMessageManager.extractCommit(message);
            expect(result).toBe('second');
        });
    });

    describe('extractRow', () => {
        it('should extract row content correctly', () => {
            const message = 'text <row>[{"tableIdx":0}]</row> more text';
            const result = ChatMessageManager.extractRow(message);
            expect(result).toBe('[{"tableIdx":0}]');
        });

        it('should return null if no row tag', () => {
            const message = 'text without tags';
            const result = ChatMessageManager.extractRow(message);
            expect(result).toBeNull();
        });
    });

    describe('replaceCommitWithRow', () => {
        it('should replace commit with new row', () => {
            mockChat.push({ id: 0, mes: 'text <commit>sql</commit>', name: 'test', role: 'assistant' });

            ChatMessageManager.replaceCommitWithRow(0, 'rowdata');

            expect(mockChat[0].mes).toBe('text <row>rowdata</row>');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should update existing row and remove commit', () => {
            mockChat.push({ id: 0, mes: '<row>old</row> <commit>sql</commit>', name: 'test', role: 'assistant' });

            ChatMessageManager.replaceCommitWithRow(0, 'new');

            expect(mockChat[0].mes).toBe('<row>new</row> ');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should handle message with text around tags', () => {
            mockChat.push({ id: 0, mes: 'before <commit>sql</commit> after', name: 'test', role: 'assistant' });

            ChatMessageManager.replaceCommitWithRow(0, 'row');

            expect(mockChat[0].mes).toBe('before  after<row>row</row>');
            expect(mockSaveChat).toHaveBeenCalled();
        });
    });

    describe('getRows', () => {
        it('should return empty array for no messages', () => {
            const rows = ChatMessageManager.getRows();
            expect(rows).toEqual([]);
        });

        it('should extract rows from messages', () => {
            mockChat.push({
                id: 0,
                mes: '<row>[{"tableIdx":0,"action":"insert","after":{"0":1}}]</row>',
                name: 'test',
                role: 'assistant'
            });

            const rows = ChatMessageManager.getRows();
            expect(rows.length).toBe(1);
            expect(rows[0].tableIdx).toBe(0);
        });

        it('should skip messages with invalid row json', () => {
            mockChat.push({
                id: 0,
                mes: '<row>invalid json</row>',
                name: 'test',
                role: 'assistant'
            });

            const rows = ChatMessageManager.getRows();
            expect(rows).toEqual([]);
        });
    });
});
