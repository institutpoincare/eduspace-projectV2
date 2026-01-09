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
        this.refreshInterval = null;
        this.previousUnreadCount = 0;
        this.REFRESH_RATE = 3000; // تحديث كل 3 ثوانٍ
    }

    async init() {
        console.log('📧 Initialisation du système de messages...');
        await dataManager.init();

        // Récupérer l'utilisateur actuel - vérifier localStorage puis sessionStorage
        let userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
            // Synchroniser avec sessionStorage pour cohérence
            sessionStorage.setItem('user', userStr);
        } else {
            console.warn('⚠️ Aucun utilisateur trouvé, redirection...');
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
        this.startAutoRefresh();
    }

    /**
     * بدء التحديث التلقائي للرسائل
     */
    startAutoRefresh() {
        // إيقاف أي تحديث سابق
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // بدء التحديث الدوري
        this.refreshInterval = setInterval(async () => {
            await this.refreshMessages();
        }, this.REFRESH_RATE);

        console.log('🔄 Auto-refresh started: every', this.REFRESH_RATE / 1000, 'seconds');
    }

    /**
     * إيقاف التحديث التلقائي
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('⏸️ Auto-refresh stopped');
        }
    }

    /**
     * تحديث الرسائل في الخلفية
     */
    async refreshMessages() {
        try {
            const allMessages = await dataManager.getAll('messages');
            const newMessages = allMessages.filter(msg => 
                msg.to.id === this.currentUser.id || msg.from.id === this.currentUser.id
            );

            // ترتيب الرسائل حسب التاريخ (الأحدث أولاً)
            newMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // التحقق من وجود رسائل جديدة أو تحديثات
            const hasChanges = JSON.stringify(newMessages) !== JSON.stringify(this.messages);
            
            if (hasChanges) {
                console.log('📬 New messages detected! Updating...');
                
                // حفظ الرسالة المحددة الحالية
                const currentSelectedId = this.selectedMessage?.id;
                
                // حساب عدد الرسائل غير المقروءة الجديدة
                const newUnreadCount = newMessages.filter(m => !m.isRead && m.to.id === this.currentUser.id).length;
                const hasNewUnread = newUnreadCount > this.previousUnreadCount;
                
                this.messages = newMessages; // Already sorted((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                // تحديث قائمة الرسائل
                this.renderMessagesList();
                this.updateUnreadCount();

                // إظهار إشعار إذا كانت هناك رسائل جديدة
                if (hasNewUnread) {
                    this.showNotification(newUnreadCount - this.previousUnreadCount);
                }

                // إذا كانت هناك رسالة محددة، تحديث تفاصيلها دون مسح حقل الرد
                if (currentSelectedId) {
                    const updatedMessage = this.messages.find(m => m.id === currentSelectedId);
                    if (updatedMessage) {
                        // حفظ حالة حقل الرد قبل التحديث
                        const replyInput = document.getElementById('reply-text');
                        const savedReplyText = replyInput ? replyInput.value : '';
                        const wasFocused = replyInput && document.activeElement === replyInput;
                        const cursorPosition = replyInput ? replyInput.selectionStart : 0;
                        
                        this.selectedMessage = updatedMessage;
                        this.renderMessageDetail();
                        
                        // استعادة حالة حقل الرد بعد التحديث
                        if (savedReplyText || wasFocused) {
                            const newReplyInput = document.getElementById('reply-text');
                            if (newReplyInput) {
                                // استعادة النص
                                newReplyInput.value = savedReplyText;
                                
                                // استعادة التركيز وموضع المؤشر
                                if (wasFocused) {
                                    newReplyInput.focus();
                                    newReplyInput.setSelectionRange(cursorPosition, cursorPosition);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error refreshing messages:', error);
        }
    }

    async loadMessages() {
        try {
            const allMessages = await dataManager.getAll('messages');
            // Filtrer les messages pour ce formateur - messages envoyés à lui ou par lui
            this.messages = allMessages.filter(msg => 
                msg.to.id === this.currentUser.id || msg.from.id === this.currentUser.id
            );
            
            // تهيئة عداد الرسائل غير المقروءة
            this.previousUnreadCount = this.messages.filter(m => !m.isRead && m.to.id === this.currentUser.id).length;
            
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

    // إزالة كلاسات التوسيط الافتراضية
    container.classList.remove('items-center', 'justify-center', 'text-gray-400', 'flex');
    container.classList.add('block', 'h-full');

    const msg = this.selectedMessage;
    const roleIcon = msg.from.role === 'parent' ? 'users' : 'user';
    const roleLabel = msg.from.role === 'parent' ? 'Parent' : 'Étudiant';
    const roleColor = msg.from.role === 'parent' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
    const isSent = msg.from.id === this.currentUser.id;

    container.innerHTML = `
        <div class="flex flex-col h-full">
            <!-- Message Header - Messenger Style -->
            <div class="message-header">
                <div class="message-header-avatar" style="background: linear-gradient(135deg, ${msg.from.role === 'parent' ? '#9333ea, #a855f7' : '#3b82f6, #60a5fa'})">
                    ${msg.from.name.charAt(0).toUpperCase()}
                </div>
                <div class="message-header-info">
                    <div class="message-header-name">${msg.from.name}</div>
                    <div class="message-header-role">
                        <span class="inline-block px-2 py-1 rounded-full text-xs font-bold ${roleColor}">
                            <i data-lucide="${roleIcon}" class="w-3 h-3 inline mr-1"></i>${roleLabel}
                        </span>
                    </div>
                </div>
                <span class="text-sm text-gray-500">${this.formatDate(msg.createdAt)}</span>
            </div>

            <!-- Messages Area - Messenger Style Bubbles -->
            <div class="chat-messages flex-1">
                <!-- Subject Header -->
                <div class="message-time-divider">
                    <span><strong>${msg.subject}</strong></span>
                </div>

                <!-- Original Message Bubble -->
                <div class="flex flex-col ${isSent ? 'items-end' : 'items-start'} mb-4">
                    ${!isSent ? `
                        <div class="message-sender-info">
                            <div class="message-sender-avatar" style="background: linear-gradient(135deg, ${msg.from.role === 'parent' ? '#9333ea, #a855f7' : '#3b82f6, #60a5fa'})">
                                ${msg.from.name.charAt(0).toUpperCase()}
                            </div>
                            <span class="message-sender-name">${msg.from.name}</span>
                        </div>
                    ` : ''}
                    <div class="message-bubble ${isSent ? 'message-sent' : 'message-received'}">
                        ${msg.message}
                    </div>
                    <div class="message-timestamp ${isSent ? 'text-right' : 'text-left'}">
                        ${this.getTimeAgo(msg.createdAt)}
                    </div>
                </div>

                <!-- Replies as Bubbles -->
                ${msg.replies && msg.replies.length > 0 ? 
                    msg.replies.map(reply => {
                        const isMyReply = reply.from === this.currentUser.id;
                        const replyFrom = isMyReply ? this.currentUser : msg.from;
                        
                        return `
                            <div class="flex flex-col ${isMyReply ? 'items-end' : 'items-start'} mb-4">
                                ${!isMyReply ? `
                                    <div class="message-sender-info">
                                        <div class="message-sender-avatar" style="background: linear-gradient(135deg, ${msg.from.role === 'parent' ? '#9333ea, #a855f7' : '#3b82f6, #60a5fa'})">
                                            ${replyFrom.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span class="message-sender-name">${replyFrom.name}</span>
                                    </div>
                                ` : ''}
                                <div class="message-bubble ${isMyReply ? 'message-sent' : 'message-received'}">
                                    ${reply.message}
                                </div>
                                <div class="message-timestamp ${isMyReply ? 'text-right' : 'text-left'}">
                                    ${this.getTimeAgo(reply.createdAt)}
                                </div>
                            </div>
                        `;
                    }).join('')
                : ''}
            </div>

            <!-- Reply Input Area - Messenger Style -->
            <div class="chat-input-area">
                <textarea id="reply-text" rows="3" required
                    class="flex-1"
                    placeholder="Écrivez un message..."></textarea>
                <button onclick="instructorMessages.sendReply()" class="btn-send">
                    <i data-lucide="send" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Auto-resize textarea
    const textarea = document.getElementById('reply-text');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 300) + 'px'; // كبرناه للـ 300px
        });
    }

    // Scroll to bottom
    const messagesContainer = container.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
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
        const unreadCount = this.messages.filter(m => !m.isRead && m.to.id === this.currentUser.id).length;
        const countEl = document.getElementById('unread-count');
        if (countEl) {
            countEl.textContent = unreadCount;
        }

        // تحديث العداد السابق
        this.previousUnreadCount = unreadCount;

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

    /**
     * إظهار إشعار عند وصول رسائل جديدة
     */
    showNotification(newMessagesCount) {
        // إشعار صوتي
        this.playNotificationSound();
        
        // إشعار مرئي في أعلى الصفحة
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce';
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <i data-lucide="mail" class="w-6 h-6"></i>
                <div>
                    <p class="font-bold">Nouveau${newMessagesCount > 1 ? 'x' : ''} message${newMessagesCount > 1 ? 's' : ''}!</p>
                    <p class="text-sm opacity-90">Vous avez ${newMessagesCount} nouveau${newMessagesCount > 1 ? 'x' : ''} message${newMessagesCount > 1 ? 's' : ''}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:bg-blue-700 rounded p-1">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // إزالة الإشعار تلقائياً بعد 5 ثوانٍ
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
        
        // تحديث عنوان الصفحة
        const originalTitle = document.title;
        document.title = `(${newMessagesCount}) Nouveau${newMessagesCount > 1 ? 'x' : ''} message${newMessagesCount > 1 ? 's' : ''}!`;
        setTimeout(() => {
            document.title = originalTitle;
        }, 5000);
    }

    /**
     * تشغيل صوت الإشعار
     */
    playNotificationSound() {
        // استخدام Web Audio API لإنشاء صوت بسيط
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Notification sound not available');
        }
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

