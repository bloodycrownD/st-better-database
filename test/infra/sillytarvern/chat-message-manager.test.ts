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

import { ChatMessageManager } from '@/infra/sillytarvern/message/chat-message-manager.ts';

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

        it('should extract last commit if multiple exist', () => {
            const message = '<commit>first</commit> text <commit>second</commit>';
            const result = ChatMessageManager.extractCommit(message);
            expect(result).toBe('second');
        });
    });

    describe('extractCommitted', () => {
        it('should extract committed content correctly', () => {
            const message = 'text <committed>INSERT INTO $t0 ($t0c0) VALUES (1)</committed> more text';
            const result = ChatMessageManager.extractCommitted(message);
            expect(result).toBe('INSERT INTO $t0 ($t0c0) VALUES (1)');
        });

        it('should return null if no committed tag', () => {
            const message = 'text without tags';
            const result = ChatMessageManager.extractCommitted(message);
            expect(result).toBeNull();
        });
    });

    describe('replaceCommitWithCommitted', () => {
        it('should replace commit with new committed', () => {
            mockChat.push({ id: 0, mes: 'text <commit>sql</commit>', name: 'test', role: 'assistant' });

            ChatMessageManager.replaceCommitWithCommitted(0, 'compact sql');

            expect(mockChat[0].mes).toBe('text <committed>compact sql</committed>');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should update existing committed and remove commit', () => {
            mockChat.push({ id: 0, mes: '<committed>old</committed> <commit>sql</commit>', name: 'test', role: 'assistant' });

            ChatMessageManager.replaceCommitWithCommitted(0, 'new');

            expect(mockChat[0].mes).toBe('<committed>new</committed> ');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should handle message with text around tags', () => {
            mockChat.push({ id: 0, mes: 'before <commit>sql</commit> after', name: 'test', role: 'assistant' });

            ChatMessageManager.replaceCommitWithCommitted(0, 'row');

            expect(mockChat[0].mes).toBe('before after<committed>row</committed>');
            expect(mockSaveChat).toHaveBeenCalled();
        });
    });

    describe('getCommitted', () => {
        it('should return empty string for no messages', () => {
            const result = ChatMessageManager.getCommitted();
            expect(result).toBe('');
        });

        it('should extract committed from messages', () => {
            mockChat.push({ id: 0, mes: 'text <committed>sql1</committed> more text', name: 'test', role: 'assistant' });
            mockChat.push({ id: 1, mes: '<committed>sql2</committed>', name: 'test', role: 'assistant' });

            const result = ChatMessageManager.getCommitted();

            expect(result).toBe('sql1;\nsql2');
        });

        it('should skip messages with no committed tag', () => {
            mockChat.push({ id: 0, mes: 'text without tags', name: 'test', role: 'assistant' });
            mockChat.push({ id: 1, mes: '<committed>sql</committed>', name: 'test', role: 'assistant' });

            const result = ChatMessageManager.getCommitted();

            expect(result).toBe('sql');
        });

        it('should skip messages with invalid content', () => {
            mockChat.push({ id: 0, mes: 'text', name: 'test', role: 'assistant' });
            mockChat.push({ id: 1, mes: '', name: 'test', role: 'assistant' });

            const result = ChatMessageManager.getCommitted();

            expect(result).toBe('');
        });
    });

    describe('processCommit', () => {
        it('should process commit content', () => {
            mockChat.push({ id: 0, mes: '<commit>original</commit>', name: 'test', role: 'assistant' });

            ChatMessageManager.processCommit(0, (content) => {
                expect(content).toBe('original');
                return `<commit>${content} processed</commit>`;
            });

            expect(mockChat[0].mes).toBe('<commit>original processed</commit>');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should handle null content', () => {
            mockChat.push({ id: 0, mes: 'text without commit', name: 'test', role: 'assistant' });

            ChatMessageManager.processCommit(0, (content) => {
                expect(content).toBeNull();
                return '<commit>new content</commit>';
            });

            expect(mockChat[0].mes).toBe('<commit>new content</commit>');
            expect(mockSaveChat).toHaveBeenCalled();
        });
    });

    describe('processCommitted', () => {
        it('should process committed content', () => {
            mockChat.push({ id: 0, mes: '<committed>original</committed>', name: 'test', role: 'assistant' });

            ChatMessageManager.processCommitted(0, (content) => {
                expect(content).toBe('original');
                return `<committed>${content} processed</committed>`;
            });

            expect(mockChat[0].mes).toBe('<committed>original processed</committed>');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should handle null content', () => {
            mockChat.push({ id: 0, mes: 'text without committed', name: 'test', role: 'assistant' });

            ChatMessageManager.processCommitted(0, (content) => {
                expect(content).toBeNull();
                return '<committed>new content</committed>';
            });

            expect(mockChat[0].mes).toBe('text without committed<committed>new content</committed>');
            expect(mockSaveChat).toHaveBeenCalled();
        });
    });

    describe('processLastCommitted', () => {
        it('should create message if chat is empty', () => {
            mockChat = [];

            ChatMessageManager.processLastCommitted((content) => {
                expect(content).toBeNull();
                return '<committed>new</committed>';
            });

            expect(mockChat.length).toBe(1);
            expect(mockChat[0].mes).toBe('<committed>new</committed>');
        });

        it('should process last message', () => {
            mockChat.push({ id: 0, mes: 'first', name: 'test', role: 'assistant' });
            mockChat.push({ id: 1, mes: 'last', name: 'test', role: 'assistant' });

            ChatMessageManager.processLastCommitted((content) => {
                expect(content).toBeNull();
                return '<committed>processed</committed>';
            });

            expect(mockChat[1].mes).toBe('last<committed>processed</committed>');
            expect(mockChat[0].mes).toBe('first');
        });
    });
});
