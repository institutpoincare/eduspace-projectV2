/**
 * Instructor Messages System - نظام رسائل المدرس
 * Handles inbox, conversations, and notifications dynamically
 */

class InstructorMessages {
    constructor() {
        this.currentUser = null;
        this.messages = [];
        this.selectedMessage = null;
        this.currentFilter = 'all';
    }

    async init() {
        console.log('📧 Initialisation du système de messages...');
        await dataManager.init();

        // Récupérer l'utilisateur actuel depuis la session
        const user = sessionStorage.getItem('user');
        if (user) {
            this.currentUser = JSON.parse(user);
        } else {
            window.location.href = '../../pages/login-formateur.html';
            return;
        }

        if (this.currentUser.role !== 'formateur') {
            console.error('❌ L\'utilisateur n\'est pas un formateur');
            window.location.href = '../../pages/login-formateur.html';
            return;
        }

        console.log('👤 Formateur connecté:', this.currentUser.name, 'ID:', this.currentUser.id);

        await this.loadMessages();
        this.updateUnreadCount();
    }

    async loadMessages() {
        try {
            const allMessages = await dataManager.getAll('messages');
            // Filtrer les messages pour ce formateur - messages envoyés à lui ou par lui
            this.messages = allMessages.filter(msg => 
                msg.to.id === this.currentUser.id || msg.from.id === this.currentUser.id
            );
            
            console.log('📧 Total messages dans la base:', allMessages.length);
            console.log('✅ Messages du formateur:', this.messages.length);
            
            // Trier par date (plus récent en premier)
            this.messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            this.renderMessagesList();
        } catch (error) {
            console.error('❌ Erreur lors du chargement des messages:', error);
            this.messages = [];
            this.renderMessagesList();
        }
    }

    renderMessagesList() {
        const container = document.getElementById('messages-list');
        if (!container) return;

        let filteredMessages = this.messages;
        
        // Appliquer le filtre
        if (this.currentFilter === 'unread') {
            filteredMessages = this.messages.filter(m => !m.isRead && m.to.id === this.currentUser.id);
        } else if (this.currentFilter === 'read') {
            filteredMessages = this.messages.filter(m => m.isRead || m.from.id === this.currentUser.id);
        }

        if (filteredMessages.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center text-gray-400">
                    <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                    <p class="text-sm">Aucun message</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = filteredMessages.map(msg => {
            const timeAgo = this.getTimeAgo(msg.createdAt);
            // Déterminer si le message est non lu (seulement si envoyé au formateur)
            const isUnread = !msg.isRead && msg.to.id === this.currentUser.id;
            // Déterminer si le message est envoyé par le formateur
            const isSent = msg.from.id === this.currentUser.id;
            // L'autre personne dans la conversation
            const otherPerson = isSent ? msg.to : msg.from;
            
            const roleIcon = otherPerson.role === 'parent' ? 'users' : 'user';
            const roleColor = otherPerson.role === 'parent' ? 'text-purple-600' : 'text-blue-600';
            const bgColor = otherPerson.role === 'parent' ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600';
            
            return `
                <div onclick="instructorMessages.selectMessage('${msg.id}')" 
                    class="message-item p-4 border-b border-gray-100 cursor-pointer transition-all ${isUnread ? 'unread' : ''} ${this.selectedMessage?.id === msg.id ? 'bg-blue-50' : ''}">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center text-white font-bold shrink-0">
                            ${otherPerson.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start mb-1">
                                <h4 class="font-bold text-gray-900 truncate ${isUnread ? 'font-extrabold' : ''}">
                                    ${otherPerson.name}
                                    ${isSent ? '<span class="text-xs text-gray-400 font-normal ml-2">← Vous</span>' : ''}
                                </h4>
                                <span class="text-xs text-gray-400 ml-2 shrink-0">${timeAgo}</span>
                            </div>
                            <p class="text-sm font-medium text-gray-700 truncate mb-1 ${isUnread ? 'font-bold' : ''}">${msg.subject}</p>
                            <p class="text-xs text-gray-500 truncate">${msg.message}</p>
                            ${msg.replies && msg.replies.length > 0 ? `
                                <div class="flex items-center gap-1 mt-2 text-xs text-blue-600">
                                    <i data-lucide="corner-down-right" class="w-3 h-3"></i>
                                    <span>${msg.replies.length} réponse(s)</span>
                                </div>
                            ` : ''}
                        </div>
                        ${isUnread ? '<div class="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"></div>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async selectMessage(messageId) {
        this.selectedMessage = this.messages.find(m => m.id === messageId);
        if (!this.selectedMessage) return;

        // Mark as read
        if (!this.selectedMessage.isRead) {
            this.selectedMessage.isRead = true;
            await dataManager.update('messages', messageId, this.selectedMessage);
            this.updateUnreadCount();
            this.renderMessagesList();
        }

        this.renderMessageDetail();
    }

    renderMessageDetail() {
        const container = document.getElementById('message-detail-container');
        if (!container || !this.selectedMessage) return;

        const msg = this.selectedMessage;
        const roleIcon = msg.from.role === 'parent' ? 'users' : 'user';
        const roleLabel = msg.from.role === 'parent' ? 'Parent' : 'Étudiant';
        const roleColor = msg.from.role === 'parent' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

        container.innerHTML = `
            <div class="flex flex-col h-full">
                <!-- Header -->
                <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br ${msg.from.role === 'parent' ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600'} flex items-center justify-center text-white font-bold text-lg">
                                ${msg.from.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 class="font-bold text-lg text-gray-900">${msg.from.name}</h3>
                                <span class="inline-block px-2 py-1 rounded-full text-xs font-bold ${roleColor} mt-1">
                                    <i data-lucide="${roleIcon}" class="w-3 h-3 inline mr-1"></i>${roleLabel}
                                </span>
                            </div>
                        </div>
                        <span class="text-sm text-gray-500">${this.formatDate(msg.createdAt)}</span>
                    </div>
                    <h2 class="text-xl font-bold text-gray-900">${msg.subject}</h2>
                </div>

                <!-- Message Content -->
                <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <!-- Original Message -->
                    <div class="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
                        <p class="text-gray-700 leading-relaxed whitespace-pre-line">${msg.message}</p>
                    </div>

                    <!-- Replies -->
                    ${msg.replies && msg.replies.length > 0 ? `
                        <div class="space-y-3">
                            <h4 class="font-bold text-gray-700 flex items-center gap-2">
                                <i data-lucide="message-circle" class="w-4 h-4"></i> Réponses
                            </h4>
                            ${msg.replies.map(reply => `
                                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 ml-8">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="font-bold text-blue-900">Vous</span>
                                        <span class="text-xs text-blue-600">${this.formatDate(reply.createdAt)}</span>
                                    </div>
                                    <p class="text-gray-700 leading-relaxed whitespace-pre-line">${reply.message}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- Reply Box -->
                <div class="p-6 border-t border-gray-200 bg-gray-50">
                    <div class="flex flex-col gap-3">
                        <textarea id="reply-text" rows="3" 
                            class="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Écrivez votre réponse..."></textarea>
                        <div class="flex justify-end gap-2">
                            <button onclick="instructorMessages.sendReply()" 
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-all">
                                <i data-lucide="send" class="w-4 h-4"></i> Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async sendReply() {
        const replyText = document.getElementById('reply-text');
        if (!replyText || !replyText.value.trim()) {
            alert('⚠️ Veuillez écrire un message');
            return;
        }

        const reply = {
            id: 'reply_' + Date.now(),
            from: this.currentUser.id,
            message: replyText.value.trim(),
            createdAt: new Date().toISOString()
        };

        if (!this.selectedMessage.replies) {
            this.selectedMessage.replies = [];
        }
        this.selectedMessage.replies.push(reply);

        await dataManager.update('messages', this.selectedMessage.id, this.selectedMessage);
        
        replyText.value = '';
        this.renderMessageDetail();
        alert('✅ Réponse envoyée!');
    }

    updateUnreadCount() {
        const unreadCount = this.messages.filter(m => !m.isRead).length;
        const countEl = document.getElementById('unread-count');
        if (countEl) {
            countEl.textContent = unreadCount;
        }

        // Update global notification badge
        this.updateGlobalNotification(unreadCount);
    }

    updateGlobalNotification(count) {
        // This will be called to update notification badge in sidebar/header
        if (window.updateMessageNotification) {
            window.updateMessageNotification(count);
        }
        
        // Store in localStorage for other pages
        localStorage.setItem('unreadMessagesCount', count);
    }

    filterMessages(filter) {
        this.currentFilter = filter;
        
        // Update button styles
        document.querySelectorAll('[id^="filter-"]').forEach(btn => {
            btn.classList.remove('border-blue-600', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });
        
        const activeBtn = document.getElementById(`filter-${filter}`);
        if (activeBtn) {
            activeBtn.classList.add('border-blue-600', 'text-blue-600');
            activeBtn.classList.remove('border-transparent', 'text-gray-500');
        }
        
        this.renderMessagesList();
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins}min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global instance
window.instructorMessages = new InstructorMessages();

// Global functions
window.filterMessages = function(filter) {
    window.instructorMessages.filterMessages(filter);
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    await window.instructorMessages.init();
    lucide.createIcons();
});
