/**
 * Student Messages System - نظام رسائل الطالب
 * Handles inbox, conversations with instructors, and notifications
 */

class StudentMessages {
  constructor() {
    this.currentUser = null;
    this.messages = [];
    this.instructors = [];
    this.selectedMessage = null;
    this.currentFilter = 'all';
    this.refreshInterval = null;
    this.REFRESH_RATE = 3000; // تحديث كل 3 ثوانٍ
  }

  async init() {
    console.log('🚀 Initializing Student Messages...');
    
    // Get current user
    this.currentUser = JSON.parse(sessionStorage.getItem('user'));
    if (!this.currentUser) {
      window.location.href = '../../pages/login-etudiant.html';
      return;
    }

    await this.loadData();
    this.setupEventListeners();
    this.checkPendingChat();
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
      const newMessages = (allMessages || []).filter(msg => 
        msg.from.id === this.currentUser.id || msg.to.id === this.currentUser.id
      );

      // Detection des nouveaux messages
      if (this.messages.length > 0) {
          const oldIds = new Set(this.messages.map(m => m.id));
          const brandNew = newMessages.filter(m => !oldIds.has(m.id) && m.from.id !== this.currentUser.id);
          
          if (brandNew.length > 0) {
              const senderName = brandNew[0].from.name;
              this.showVisualNotification(`Nouveau message de ${senderName}`);
          } else {
             // Check replies
             newMessages.forEach(newMsg => {
                 const oldMsg = this.messages.find(m => m.id === newMsg.id);
                 if (oldMsg && newMsg.replies && newMsg.replies.length > (oldMsg.replies ? oldMsg.replies.length : 0)) {
                     // Last reply is not from me?
                     const lastReply = newMsg.replies[newMsg.replies.length - 1];
                     if (lastReply && lastReply.from !== this.currentUser.id) {
                         this.showVisualNotification(`Nouvelle réponse dans: ${newMsg.subject}`);
                     }
                 }
             });
          }
      }

      // Check change
      const hasChanges = JSON.stringify(newMessages) !== JSON.stringify(this.messages);
      
      if (hasChanges) {
        console.log('📬 New messages detected! Updating...');
        this.messages = newMessages;
        
        // Update List
        this.renderMessagesList();
        this.updateUnreadCount();

        // Update Active Conversation Non-Destructively
        if (this.selectedMessage) {
          const updatedMessage = this.messages.find(m => m.id === this.selectedMessage.id);
          if (updatedMessage) {
            // Save Input State
            const replyInput = document.getElementById('reply-input');
            const savedReplyText = replyInput ? replyInput.value : '';
            const wasFocused = replyInput && document.activeElement === replyInput;
            const cursorPosition = replyInput ? replyInput.selectionStart : 0;
            
            this.selectedMessage = updatedMessage;
            this.renderMessageDetail();
            
            // Restore Input State
            if (savedReplyText || wasFocused) {
              const newReplyInput = document.getElementById('reply-input');
              if (newReplyInput) {
                newReplyInput.value = savedReplyText;
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

  checkPendingChat() {
    const chatWith = sessionStorage.getItem('chatWith');
    if (chatWith) {
      try {
        const { userId } = JSON.parse(chatWith);
        sessionStorage.removeItem('chatWith');
        
        if (userId) {
          this.showNewMessageModal(userId);
        }
      } catch (e) {
        console.error('Error handling pending chat:', e);
      }
    }
  }

  async loadData() {
    try {
      // Charger les messages et instructeurs depuis la base de données
      const allMessages = await dataManager.getAll('messages');
      const allInstructors = await dataManager.getAll('instructors');
      
      this.instructors = allInstructors || [];
      
      // Filtrer les messages pour l'étudiant actuel uniquement
      this.messages = (allMessages || []).filter(msg => 
        msg.from.id === this.currentUser.id || msg.to.id === this.currentUser.id
      );

      console.log('📧 Messages chargés:', this.messages.length, 'pour l\'étudiant:', this.currentUser.name);
      console.log('👥 Nombre d\'instructeurs:', this.instructors.length);
      
      this.renderMessagesList();
      this.updateUnreadCount();
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      this.messages = [];
      this.instructors = [];
    }
  }

  setupEventListeners() {
    // New message form
    const form = document.getElementById('new-message-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendNewMessage();
      });
    }
  }

  renderMessagesList() {
    const container = document.getElementById('messages-list');
    if (!container) return;

    // Filter messages based on current filter
    let filteredMessages = this.messages;
    if (this.currentFilter === 'unread') {
      filteredMessages = this.messages.filter(msg => !msg.isRead && msg.to.id === this.currentUser.id);
    } else if (this.currentFilter === 'read') {
      filteredMessages = this.messages.filter(msg => msg.isRead || msg.from.id === this.currentUser.id);
    }

    // Sort by date (newest first)
    filteredMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filteredMessages.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-400">
          <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
          <p class="font-medium">Aucun message</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = filteredMessages.map(msg => {
      const isUnread = !msg.isRead && msg.to.id === this.currentUser.id;
      const isSent = msg.from.id === this.currentUser.id;
      const otherPerson = isSent ? msg.to : msg.from;
      const hasReplies = msg.replies && msg.replies.length > 0;

      return `
        <div class="message-item p-4 border-b border-gray-100 cursor-pointer transition-all ${isUnread ? 'unread' : ''}"
          onclick="window.studentMessages.selectMessage('${msg.id}')">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              ${otherPerson.name.charAt(0)}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h4 class="font-semibold text-gray-900 truncate">${otherPerson.name}</h4>
                <span class="text-xs text-gray-500 flex-shrink-0 ml-2">${this.getTimeAgo(msg.createdAt)}</span>
              </div>
              <p class="text-sm font-medium text-gray-700 truncate mb-1">${msg.subject}</p>
              <p class="text-sm text-gray-500 truncate">${msg.message}</p>
              <div class="flex items-center gap-3 mt-2">
                ${isUnread ? '<span class="text-xs font-medium text-blue-600 flex items-center gap-1">Nouveau</span>' : ''}
                ${isSent ? '<span class="text-xs text-gray-400 flex items-center gap-1">Envoyé</span>' : ''}
                ${hasReplies ? `<span class="text-xs text-gray-400 flex items-center gap-1">${msg.replies.length} réponse(s)</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  }

  async selectMessage(messageId) {
    this.selectedMessage = this.messages.find(m => m.id === messageId);
    if (!this.selectedMessage) return;

    // Mark as read if it's received and unread
    if (!this.selectedMessage.isRead && this.selectedMessage.to.id === this.currentUser.id) {
      this.selectedMessage.isRead = true;
      await dataManager.updateMessage(messageId, { isRead: true });
      this.renderMessagesList();
      this.updateUnreadCount();
    }

    this.renderMessageDetail();
  }

  renderMessageDetail() {
    const container = document.getElementById('message-detail-container');
    if (!container || !this.selectedMessage) return;

    // Remove any centering classes from the placeholder state
    container.classList.remove('items-center', 'justify-center', 'text-gray-400');
    container.classList.add('block', 'w-full', 'h-full');

    const isSent = this.selectedMessage.from.id === this.currentUser.id;
    const otherPerson = isSent ? this.selectedMessage.to : this.selectedMessage.from;

    container.innerHTML = `
      <div class="flex flex-col h-full w-full bg-white">
        <!-- Header -->
        <div class="message-header">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                ${otherPerson.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 class="font-bold text-gray-900 text-lg">${otherPerson.name}</h3>
                <span class="text-sm text-gray-500">${otherPerson.role === 'formateur' ? 'Formateur' : 'Étudiant'}</span>
            </div>
        </div>

        <!-- Messages Area -->
        <div class="chat-messages custom-scrollbar">
          <!-- Subject Header -->
          <div class="text-center my-4">
             <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                ${this.selectedMessage.subject}
             </span>
          </div>

          <!-- Original Message -->
          <div class="flex flex-col ${isSent ? 'items-end' : 'items-start'} mb-2">
            <div class="message-bubble ${isSent ? 'message-sent' : 'message-received'}">
              ${this.selectedMessage.message}
            </div>
            <span class="text-xs text-gray-400 mt-1 mx-1">
              ${this.formatTime(this.selectedMessage.createdAt)}
            </span>
          </div>

          <!-- Replies -->
          ${this.selectedMessage.replies && this.selectedMessage.replies.length > 0 ? 
            this.selectedMessage.replies.map(reply => {
              const isMyReply = reply.from === this.currentUser.id;
              return `
                <div class="flex flex-col ${isMyReply ? 'items-end' : 'items-start'} mb-2">
                  <div class="message-bubble ${isMyReply ? 'message-sent' : 'message-received'}">
                    ${reply.message}
                  </div>
                  <span class="text-xs text-gray-400 mt-1 mx-1">
                    ${this.formatTime(reply.createdAt)}
                  </span>
                </div>
              `;
            }).join('')
          : ''}
        </div>

        <!-- Input Area (Instructor Style) -->
        <div class="chat-input-area">
          <textarea id="reply-input" rows="1" placeholder="Écrivez un message..."></textarea>
          <button onclick="window.studentMessages.sendReply()" class="btn-send font-bold text-sm px-4 w-auto rounded-full">
            Envoyer
          </button>
        </div>
      </div>
    `;

    lucide.createIcons();
    
    // Auto-resize textarea logic
    const textarea = document.getElementById('reply-input');
    if (textarea) {
        // Submit on Enter
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendReply();
            }
        });
        
        // Auto grow
        textarea.addEventListener('input', function() {
            this.style.height = 'auto'; 
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
    }

    // Scroll to bottom
    const messagesBody = container.querySelector('.chat-messages');
    if (messagesBody) {
        messagesBody.scrollTop = messagesBody.scrollHeight;
    }
  }

  formatTime(dateStr) {
      return new Date(dateStr).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
  }

  async sendReply() {
    const input = document.getElementById('reply-input');
    if (!input || !input.value.trim()) return;

    const replyMessage = input.value.trim();
    
    const newReply = {
      id: `reply_${Date.now()}`,
      from: this.currentUser.id,
      message: replyMessage,
      createdAt: new Date().toISOString()
    };

    if (!this.selectedMessage.replies) {
      this.selectedMessage.replies = [];
    }
    this.selectedMessage.replies.push(newReply);

    await dataManager.updateMessage(this.selectedMessage.id, {
      replies: this.selectedMessage.replies,
      updatedAt: new Date().toISOString()
    });

    input.value = '';
    this.renderMessageDetail();
    console.log('✅ Reply sent successfully');
  }

  showNewMessageModal(preSelectedId = null) {
    const modal = document.getElementById('new-message-modal');
    const select = document.getElementById('recipient-select');
    
    if (modal && select) {
      // Populate instructors
      select.innerHTML = '<option value="">Sélectionnez un formateur...</option>' +
        this.instructors.map(instructor => 
          `<option value="${instructor.id}" ${preSelectedId === instructor.id ? 'selected' : ''}>${instructor.name}</option>`
        ).join('');
      
      modal.classList.remove('hidden');
      lucide.createIcons();
    }
  }

  closeNewMessageModal() {
    const modal = document.getElementById('new-message-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.getElementById('new-message-form').reset();
    }
  }

  async sendNewMessage() {
    const recipientId = document.getElementById('recipient-select').value;
    const subject = document.getElementById('message-subject').value.trim();
    const content = document.getElementById('message-content').value.trim();

    if (!recipientId || !subject || !content) return;

    const recipient = this.instructors.find(i => i.id === recipientId);
    if (!recipient) return;

    const newMessage = {
      id: `msg_${Date.now()}`,
      from: {
        id: this.currentUser.id,
        name: this.currentUser.name,
        role: 'etudiant',
        avatar: ''
      },
      to: {
        id: recipient.id,
        name: recipient.name,
        role: 'formateur'
      },
      subject: subject,
      message: content,
      isRead: false,
      createdAt: new Date().toISOString(),
      replies: []
    };

    await dataManager.createMessage(newMessage);
    this.messages.unshift(newMessage);
    
    this.closeNewMessageModal();
    this.renderMessagesList();
    console.log('✅ Message sent successfully');
  }

  updateUnreadCount() {
    const unreadCount = this.messages.filter(msg => 
      !msg.isRead && msg.to.id === this.currentUser.id
    ).length;
    
    const countElement = document.getElementById('unread-count');
    if (countElement) {
      countElement.textContent = unreadCount;
    }

    this.updateGlobalNotification(unreadCount);
  }

  updateGlobalNotification(count) {
    const badge = document.querySelector('[data-notification-badge="messages"]');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  filterMessages(filter) {
    this.currentFilter = filter;
    
    // Update filter buttons
    ['all', 'unread', 'read'].forEach(f => {
      const btn = document.getElementById(`filter-${f}`);
      if (btn) {
        if (f === filter) {
          btn.classList.add('border-blue-600', 'text-blue-600');
          btn.classList.remove('border-transparent', 'text-gray-500');
        } else {
          btn.classList.remove('border-blue-600', 'text-blue-600');
          btn.classList.add('border-transparent', 'text-gray-500');
        }
      }
    });

    this.renderMessagesList();
  }

  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  playNotificationSound() {
    // Son de notification (Petit "Ping" agréable)
    // Utilisation d'un fichier audio hébergé ou base64 si nécessaire.
    // Ici on utilise une URL publique fiable pour l'exemple
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio autoplay bloqué (interaction requise):", e));
  }

  showVisualNotification(text) {
    // Création d'un toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-6 right-6 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-bounce cursor-pointer';
    toast.innerHTML = `<i data-lucide="bell" class="w-6 h-6"></i> <span class="font-bold">${text}</span>`;
    toast.onclick = () => { toast.remove(); window.focus(); };
    
    document.body.appendChild(toast);
    if(window.lucide) lucide.createIcons();

    // Sound
    this.playNotificationSound();

    // Auto remove
    setTimeout(() => {
        if(toast.parentElement) toast.remove();
    }, 4000);
  }
}

// Global instance
window.studentMessages = new StudentMessages();

// Global functions
function filterMessages(filter) {
  window.studentMessages.filterMessages(filter);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await window.studentMessages.init();
  lucide.createIcons();
});
