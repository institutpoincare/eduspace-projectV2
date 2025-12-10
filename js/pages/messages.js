/**
 * Messages Page - Système de Messagerie Dynamique
 * Conversations, envoi/réception de messages
 */

class MessagesPage {
    constructor() {
        this.currentUser = null;
        this.conversations = [];
        this.messages = [];
        this.activeConversation = null;
    }

    /**
     * Initialiser la page
     */
    async init() {
        console.log('💬 Initialisation Page Messages');

        await dataManager.init();

        // Récupérer l'utilisateur connecté
        this.currentUser = await this.getCurrentUser();

        if (!this.currentUser) {
            console.error('❌ Aucun utilisateur connecté');
            return;
        }

        // Charger les conversations
        await this.loadConversations();

        // Initialiser les événements
        this.initializeEvents();

        console.log('✅ Page messages chargée');
    }

    /**
     * Récupérer l'utilisateur connecté
     */
    async getCurrentUser() {
        const userId = localStorage.getItem('currentUserId') || 'user-1';
        return await dataManager.getById('users', userId);
    }

    /**
     * Charger les conversations
     */
    async loadConversations() {
        try {
            const data = await dataManager.getAll('conversations');
            this.conversations = data.filter(conv =>
                conv.participants.includes(this.currentUser.id)
            );

            this.renderConversations();
            console.log(`✅ ${this.conversations.length} conversations chargées`);
        } catch (error) {
            console.error('❌ Erreur chargement conversations:', error);
        }
    }

    /**
     * Afficher les conversations
     */
    renderConversations() {
        const container = document.getElementById('conversationsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.conversations.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i data-lucide="message-circle" class="w-16 h-16 mx-auto text-gray-400 mb-4"></i>
                    <p class="text-gray-500">Aucune conversation</p>
                </div>
            `;
            return;
        }

        this.conversations.forEach(conv => {
            const card = this.createConversationCard(conv);
            container.appendChild(card);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Créer une carte conversation
     */
    createConversationCard(conversation) {
        const otherUserId = conversation.participants.find(id => id !== this.currentUser.id);
        const unreadCount = conversation.unreadCount[this.currentUser.id] || 0;

        const card = document.createElement('div');
        card.className = `p-4 border-b hover:bg-gray-50 cursor-pointer ${this.activeConversation?.id === conversation.id ? 'bg-indigo-50' : ''
            }`;
        card.onclick = () => this.selectConversation(conversation.id);

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    ${otherUserId.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-gray-900">${otherUserId}</h4>
                        <span class="text-xs text-gray-500">${this.formatTime(conversation.lastMessageAt)}</span>
                    </div>
                    <p class="text-sm text-gray-600 truncate">Dernière conversation...</p>
                </div>
                ${unreadCount > 0 ? `
                    <span class="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        ${unreadCount}
                    </span>
                ` : ''}
            </div>
        `;

        return card;
    }

    /**
     * Sélectionner une conversation
     */
    async selectConversation(conversationId) {
        this.activeConversation = this.conversations.find(c => c.id === conversationId);
        await this.loadMessages(conversationId);
        this.renderConversations(); // Refresh pour mettre à jour l'active
    }

    /**
     * Charger les messages d'une conversation
     */
    async loadMessages(conversationId) {
        try {
            const allMessages = await dataManager.getAll('messages');
            this.messages = allMessages.filter(m => m.conversationId === conversationId);

            this.renderMessages();

            // Marquer comme lu
            await this.markAsRead(conversationId);

            console.log(`✅ ${this.messages.length} messages chargés`);
        } catch (error) {
            console.error('❌ Erreur chargement messages:', error);
        }
    }

    /**
     * Afficher les messages
     */
    renderMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!this.activeConversation) {
            container.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <i data-lucide="message-square" class="w-16 h-16 mx-auto text-gray-400 mb-4"></i>
                        <p class="text-gray-500">Sélectionnez une conversation</p>
                    </div>
                </div>
            `;
            return;
        }

        this.messages.forEach(message => {
            const div = this.createMessageBubble(message);
            container.appendChild(div);
        });

        // Scroll vers le bas
        container.scrollTop = container.scrollHeight;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Créer une bulle de message
     */
    createMessageBubble(message) {
        const isMe = message.senderId === this.currentUser.id;

        const div = document.createElement('div');
        div.className = `flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`;

        div.innerHTML = `
            <div class="max-w-[70%]">
                <div class="${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-900'} 
                            rounded-2xl px-4 py-2">
                    <p class="text-sm">${message.content}</p>
                </div>
                <p class="text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'}">
                    ${this.formatTime(message.sentAt)}
                </p>
            </div>
        `;

        return div;
    }

    /**
     * Envoyer un message (CREATE)
     */
    async sendMessage(content) {
        if (!content.trim() || !this.activeConversation) return;

        try {
            const otherUserId = this.activeConversation.participants.find(
                id => id !== this.currentUser.id
            );

            const message = await dataManager.create('messages', {
                conversationId: this.activeConversation.id,
                senderId: this.currentUser.id,
                receiverId: otherUserId,
                content: content.trim(),
                read: false,
                sentAt: new Date().toISOString()
            });

            // Mettre à jour la conversation
            await dataManager.update('conversations', this.activeConversation.id, {
                lastMessage: message.id,
                lastMessageAt: message.sentAt
            });

            console.log('✅ Message envoyé');
            await this.loadMessages(this.activeConversation.id);

            // Vider l'input
            const input = document.getElementById('messageInput');
            if (input) input.value = '';
        } catch (error) {
            console.error('❌ Erreur envoi message:', error);
        }
    }

    /**
     * Marquer les messages comme lus (UPDATE)
     */
    async markAsRead(conversationId) {
        try {
            const unreadMessages = this.messages.filter(m =>
                m.receiverId === this.currentUser.id && !m.read
            );

            for (const message of unreadMessages) {
                await dataManager.update('messages', message.id, { read: true });
            }

            // Mettre à jour le compteur de non-lus
            const conversation = await dataManager.getById('conversations', conversationId);
            const unreadCount = { ...conversation.unreadCount };
            unreadCount[this.currentUser.id] = 0;

            await dataManager.update('conversations', conversationId, { unreadCount });

            await this.loadConversations();
        } catch (error) {
            console.error('❌ Erreur marquage lu:', error);
        }
    }

    /**
     * Formater le temps
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return date.toLocaleDateString('fr-FR');
    }

    /**
     * Initialiser les événements
     */
    initializeEvents() {
        // Formulaire d'envoi
        const form = document.getElementById('messageForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('messageInput');
                if (input) {
                    this.sendMessage(input.value);
                }
            });
        }

        // Bouton envoyer
        const sendBtn = document.getElementById('sendMessageBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const input = document.getElementById('messageInput');
                if (input) {
                    this.sendMessage(input.value);
                }
            });
        }
    }
}

// Instance globale
const messagesPage = new MessagesPage();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    messagesPage.init();
});
