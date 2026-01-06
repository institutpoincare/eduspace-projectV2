/**
 * Interface Professeur : Connexion Google Drive
 * Gestion de l'authentification et configuration du dossier Drive
 */

class TeacherDriveManager {
    constructor() {
        this.isConnected = false;
        this.folderId = null;
        this.init();
    }

    async init() {
        // Vérifier le statut de connexion au chargement
        await this.checkConnectionStatus();
        
        // Gérer les paramètres de callback OAuth
        this.handleOAuthCallback();
        
        // Initialiser les event listeners
        this.setupEventListeners();
    }

    /**
     * Vérifier si Google Drive est connecté
     */
    async checkConnectionStatus() {
        try {
            const response = await fetch('/api/drive/status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.isConnected = data.connected;
                this.folderId = data.folderId;
                this.updateUI();
            }
        } catch (error) {
            console.error('❌ Erreur lors de la vérification du statut:', error);
        }
    }

    /**
     * Gérer le callback OAuth
     */
    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('drive_connected')) {
            this.showNotification('✅ Google Drive connecté avec succès !', 'success');
            this.isConnected = true;
            this.updateUI();
            
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Afficher le formulaire de configuration
            setTimeout(() => this.showFolderConfigModal(), 500);
        }
        
        if (urlParams.has('error')) {
            const error = urlParams.get('error');
            let message = 'Erreur lors de la connexion à Google Drive';
            
            if (error === 'oauth_denied') {
                message = 'Vous avez refusé l\'autorisation Google Drive';
            } else if (error === 'oauth_failed') {
                message = 'Échec de la connexion à Google Drive';
            }
            
            this.showNotification(`❌ ${message}`, 'error');
            
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    /**
     * Initialiser les event listeners
     */
    setupEventListeners() {
        // Bouton de connexion Drive
        const connectBtn = document.getElementById('connect-drive-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectGoogleDrive());
        }

        // Bouton de configuration du dossier
        const configBtn = document.getElementById('config-folder-btn');
        if (configBtn) {
            configBtn.addEventListener('click', () => this.showFolderConfigModal());
        }

        // Bouton de synchronisation manuelle
        const syncBtn = document.getElementById('sync-now-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncNow());
        }

        // Bouton de déconnexion
        const disconnectBtn = document.getElementById('disconnect-drive-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnectDrive());
        }
    }

    /**
     * Initier la connexion Google Drive
     */
    async connectGoogleDrive() {
        try {
            this.showLoading('Connexion à Google Drive...');

            const response = await fetch('/api/auth/google-drive', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la génération de l\'URL OAuth');
            }

            const data = await response.json();
            
            if (data.success && data.authUrl) {
                // Rediriger vers Google OAuth
                window.location.href = data.authUrl;
            } else {
                throw new Error('URL d\'autorisation invalide');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la connexion:', error);
            this.hideLoading();
            this.showNotification('❌ Erreur lors de la connexion à Google Drive', 'error');
        }
    }

    /**
     * Afficher le modal de configuration du dossier
     */
    showFolderConfigModal() {
        const modalHTML = `
        <div id="folder-config-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i data-lucide="folder" class="w-6 h-6 text-blue-600"></i>
                        Configurer le Dossier Drive
                    </h3>
                    <button onclick="document.getElementById('folder-config-modal').remove()" class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">
                            URL du Dossier Google Drive
                        </label>
                        <input 
                            type="url" 
                            id="drive-folder-url" 
                            class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium" 
                            placeholder="https://drive.google.com/drive/folders/..."
                        >
                        <p class="mt-2 text-xs text-gray-500">
                            💡 Collez l'URL complète du dossier contenant vos enregistrements OBS
                        </p>
                    </div>

                    <div class="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <h4 class="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <i data-lucide="info" class="w-4 h-4"></i>
                            Comment obtenir l'URL ?
                        </h4>
                        <ol class="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                            <li>Ouvrez Google Drive</li>
                            <li>Naviguez vers votre dossier d'enregistrements</li>
                            <li>Copiez l'URL depuis la barre d'adresse</li>
                            <li>Collez-la ci-dessus</li>
                        </ol>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-end gap-3">
                    <button onclick="document.getElementById('folder-config-modal').remove()" class="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                        Annuler
                    </button>
                    <button onclick="window.teacherDrive.configureFolder()" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        Configurer
                    </button>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();
        document.getElementById('drive-folder-url').focus();
    }

    /**
     * Configurer le dossier Drive
     */
    async configureFolder() {
        try {
            const folderUrl = document.getElementById('drive-folder-url').value.trim();
            
            if (!folderUrl) {
                this.showNotification('⚠️ Veuillez entrer l\'URL du dossier', 'warning');
                return;
            }

            // Validation basique de l'URL
            if (!folderUrl.includes('drive.google.com/drive/folders/')) {
                this.showNotification('⚠️ URL du dossier invalide', 'warning');
                return;
            }

            this.showLoading('Configuration du dossier...');

            const response = await fetch('/api/drive/configure-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    folderUrl,
                    classId: this.getCurrentClassId()
                })
            });

            const data = await response.json();

            if (data.success) {
                this.folderId = data.folderId;
                this.showNotification('✅ Dossier configuré avec succès !', 'success');
                document.getElementById('folder-config-modal').remove();
                this.updateUI();
                
                // Lancer une synchronisation initiale
                setTimeout(() => this.syncNow(), 1000);
            } else {
                throw new Error(data.message || 'Erreur de configuration');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la configuration:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Synchroniser manuellement
     */
    async syncNow() {
        try {
            this.showLoading('Synchronisation en cours...');

            const response = await fetch(`/api/drive/sync-now/${this.getCurrentClassId()}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                const message = `✅ Synchronisation terminée: ${data.newCount} nouveaux, ${data.updatedCount} mis à jour`;
                this.showNotification(message, 'success');
            } else {
                throw new Error(data.message || 'Erreur de synchronisation');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la synchronisation:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Déconnecter Google Drive
     */
    async disconnectDrive() {
        if (!confirm('Êtes-vous sûr de vouloir déconnecter Google Drive ?')) {
            return;
        }

        try {
            this.showLoading('Déconnexion...');

            const response = await fetch('/api/drive/disconnect', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.isConnected = false;
                this.folderId = null;
                this.updateUI();
                this.showNotification('✅ Google Drive déconnecté', 'success');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error);
            this.showNotification('❌ Erreur lors de la déconnexion', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Mettre à jour l'interface
     */
    updateUI() {
        const connectBtn = document.getElementById('connect-drive-btn');
        const configBtn = document.getElementById('config-folder-btn');
        const syncBtn = document.getElementById('sync-now-btn');
        const disconnectBtn = document.getElementById('disconnect-drive-btn');
        const statusBadge = document.getElementById('drive-status-badge');

        if (this.isConnected) {
            if (connectBtn) connectBtn.classList.add('hidden');
            if (configBtn) configBtn.classList.remove('hidden');
            if (syncBtn) syncBtn.classList.remove('hidden');
            if (disconnectBtn) disconnectBtn.classList.remove('hidden');
            if (statusBadge) {
                statusBadge.textContent = 'Connecté';
                statusBadge.className = 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold';
            }
        } else {
            if (connectBtn) connectBtn.classList.remove('hidden');
            if (configBtn) configBtn.classList.add('hidden');
            if (syncBtn) syncBtn.classList.add('hidden');
            if (disconnectBtn) disconnectBtn.classList.add('hidden');
            if (statusBadge) {
                statusBadge.textContent = 'Non connecté';
                statusBadge.className = 'px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold';
            }
        }
    }

    /**
     * Obtenir l'ID de la classe courante
     */
    getCurrentClassId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id') || localStorage.getItem('currentClassId');
    }

    /**
     * Afficher une notification
     */
    showNotification(message, type = 'info') {
        // Utiliser votre système de notification existant
        // ou créer un simple toast
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top duration-300`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('animate-out', 'fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Afficher le loading
     */
    showLoading(message = 'Chargement...') {
        const loader = document.createElement('div');
        loader.id = 'drive-loader';
        loader.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
        loader.innerHTML = `
            <div class="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p class="text-gray-700 font-medium">${message}</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    /**
     * Masquer le loading
     */
    hideLoading() {
        const loader = document.getElementById('drive-loader');
        if (loader) loader.remove();
    }
}

// Initialiser au chargement de la page
window.teacherDrive = new TeacherDriveManager();
