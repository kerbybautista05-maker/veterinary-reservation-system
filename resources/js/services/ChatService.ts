import { BaseService } from './BaseService';
import { ApiResponse, ListParams, ChatConversation, ChatMessage, ChatConversationStatus } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ConversationListParams extends ListParams {
    status?: ChatConversationStatus;
    unassigned?: boolean;   // Admin only
    mine?: boolean;         // Admin only — conversations assigned to me
}

export interface MessageListParams extends ListParams { /* per_page etc. inherited */ }

export interface SendMessageData {
    message?: string;
    attachment?: File;
}

// ─── Service class ────────────────────────────────────────────────────────────

class ChatService extends BaseService {

    // ── Conversations ────────────────────────────────────────────────────────

    /** GET /api/chat/conversations */
    async getConversations(params: ConversationListParams = {}): Promise<ApiResponse<ChatConversation[]>> {
        return this.get<ChatConversation[]>('/api/chat/conversations', params as Record<string, unknown>);
    }

    /** POST /api/chat/conversations — Pet Owner starts (or reuses) a conversation */
    async startConversation(): Promise<ApiResponse<ChatConversation>> {
        return this.post<ChatConversation>('/api/chat/conversations');
    }

    /** GET /api/chat/conversations/{id} — also marks messages read for the caller */
    async getConversation(id: number): Promise<ApiResponse<ChatConversation>> {
        return this.get<ChatConversation>(`/api/chat/conversations/${id}`);
    }

    /** POST /api/chat/conversations/{id}/assign — Admin assigns self */
    async assignConversation(id: number): Promise<ApiResponse<ChatConversation>> {
        return this.post<ChatConversation>(`/api/chat/conversations/${id}/assign`);
    }

    /** POST /api/chat/conversations/{id}/close */
    async closeConversation(id: number): Promise<ApiResponse<ChatConversation>> {
        return this.post<ChatConversation>(`/api/chat/conversations/${id}/close`);
    }

    /** POST /api/chat/conversations/{id}/reopen */
    async reopenConversation(id: number): Promise<ApiResponse<ChatConversation>> {
        return this.post<ChatConversation>(`/api/chat/conversations/${id}/reopen`);
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    /** GET /api/chat/conversations/{conversationId}/messages */
    async getMessages(conversationId: number, params: MessageListParams = {}): Promise<ApiResponse<ChatMessage[]>> {
        return this.get<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages`, params as Record<string, unknown>);
    }

    /** POST /api/chat/conversations/{conversationId}/messages (multipart if attachment present) */
    async sendMessage(conversationId: number, data: SendMessageData): Promise<ApiResponse<ChatMessage>> {
        if (data.attachment instanceof File) {
            const fd = new FormData();
            if (data.message) fd.append('message', data.message);
            fd.append('attachment', data.attachment);
            return this.postFormData<ChatMessage>(`/api/chat/conversations/${conversationId}/messages`, fd);
        }
        return this.post<ChatMessage>(`/api/chat/conversations/${conversationId}/messages`, { message: data.message });
    }

    /** POST /api/chat/conversations/{conversationId}/messages/mark-read */
    async markMessagesRead(conversationId: number): Promise<ApiResponse<null>> {
        return this.post<null>(`/api/chat/conversations/${conversationId}/messages/mark-read`);
    }

    /** DELETE /api/chat/messages/{id} — Admin moderation */
    async deleteMessage(id: number): Promise<ApiResponse<null>> {
        return this.delete<null>(`/api/chat/messages/${id}`);
    }

    // ── Convenience wrappers ─────────────────────────────────────────────────

    async getUnassignedConversations(): Promise<ApiResponse<ChatConversation[]>> {
        return this.getConversations({ unassigned: true });
    }

    async getMyAssignedConversations(): Promise<ApiResponse<ChatConversation[]>> {
        return this.getConversations({ mine: true });
    }
}

export const chatService = new ChatService();
