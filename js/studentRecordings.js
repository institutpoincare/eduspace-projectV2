/**
 * Interface Étudiant : Affichage des Enregistrements
 * Affichage automatique des vidéos synchronisées depuis Google Drive
 */

class StudentRecordingsViewer {
    constructor() {
        this.classId = null;
        this.recordings = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.init();
    }

    async init() {
        // Récupérer l'ID de la classe
        const params = new URLSearchParams(window.location.search);
        this.classId = params.get('id');

        if (!this.classId) {
            this.showError('ID de classe manquant');
            return;
        }

        // Charger les enregistrements
        await this.loadRecordings();
    }

    /**
     * Charger les enregistrements depuis l'API
     */
    async loadRecordings(page = 1) {
        try {
            this.showLoading();

            const response = await fetch(`/api/drive/recordings/${this.classId}?page=${page}&limit=20`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des enregistrements');
            }

            const data = await response.json();

            if (data.success) {
                this.recordings = data.recordings;
                this.currentPage = data.pagination.page;
                this.totalPages = data.pagination.pages;
                this.render();
            } else {
                throw new Error(data.message || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            this.showError('Impossible de charger les enregistrements');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Rendre l'interface
     */
    render() {
        const container = document.getElementById('recordings-container');
        if (!container) return;

        if (this.recordings.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <i data-lucide="video" class="w-6 h-6 text-red-600"></i>
                    Enregistrements des Séances
                </h2>
                <span class="text-sm text-gray-500">
                    ${this.recordings.length} vidéo${this.recordings.length > 1 ? 's' : ''}
                </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.recordings.map(recording => this.renderRecordingCard(recording)).join('')}
            </div>

            ${this.renderPagination()}
        `;

        lucide.createIcons();
    }

    /**
     * Rendre une carte d'enregistrement
     */
    renderRecordingCard(recording) {
        const date = new Date(recording.added_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const size = this.formatFileSize(recording.size);
        const thumbnail = recording.thumbnail || 'https://via.placeholder.com/400x225/1f2937/ffffff?text=Vidéo';

        return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
            <!-- Thumbnail -->
            <div class="relative aspect-video bg-gray-900 overflow-hidden">
                <img 
                    src="${thumbnail}" 
                    alt="${recording.title}"
                    class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    loading="lazy"
                >
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                        <i data-lucide="play" class="w-8 h-8 text-white fill-white"></i>
                    </div>
                </div>
                <div class="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">
                    ${size}
                </div>
            </div>

            <!-- Informations -->
            <div class="p-4">
                <h3 class="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    ${recording.title}
                </h3>
                
                <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <i data-lucide="calendar" class="w-3 h-3"></i>
                    <span>${date}</span>
                </div>

                <div class="flex gap-2">
                    <button 
                        onclick="window.studentRecordings.openVideo('${recording.webViewLink}', '${recording.title.replace(/'/g, "\\'")}')"
                        class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <i data-lucide="play" class="w-4 h-4"></i>
                        Regarder
                    </button>
                    <a 
                        href="${recording.webViewLink}" 
                        target="_blank"
                        class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
                        title="Ouvrir dans Drive"
                    >
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                    </a>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * Rendre la pagination
     */
    renderPagination() {
        if (this.totalPages <= 1) return '';

        const pages = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }

        return `
        <div class="mt-8 flex justify-center gap-2">
            <button 
                onclick="window.studentRecordings.loadRecordings(${this.currentPage - 1})"
                ${this.currentPage === 1 ? 'disabled' : ''}
                class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>

            ${pages.map(page => `
                <button 
                    onclick="window.studentRecordings.loadRecordings(${page})"
                    class="px-4 py-2 ${page === this.currentPage ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'} rounded-lg text-sm font-bold transition-colors"
                >
                    ${page}
                </button>
            `).join('')}

            <button 
                onclick="window.studentRecordings.loadRecordings(${this.currentPage + 1})"
                ${this.currentPage === this.totalPages ? 'disabled' : ''}
                class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
        </div>
        `;
    }

    /**
     * Rendre l'état vide
     */
    renderEmptyState() {
        return `
        <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i data-lucide="video-off" class="w-10 h-10 text-gray-400"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Aucun enregistrement</h3>
            <p class="text-gray-500 max-w-md">
                Les enregistrements des séances apparaîtront ici automatiquement lorsque votre professeur les ajoutera.
            </p>
        </div>
        `;
    }

    /**
     * Ouvrir une vidéo dans un modal
     */
    openVideo(url, title) {
        // Convertir l'URL Drive en format preview
        const previewUrl = url.replace('/view', '/preview');

        const modalHTML = `
        <div id="video-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div class="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                <!-- Header -->
                <div class="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
                    <h3 class="text-white font-medium truncate pr-4">${title}</h3>
                    <button 
                        onclick="document.getElementById('video-modal').remove()"
                        class="text-white hover:text-red-500 font-bold p-2 transition-colors"
                    >
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>

                <!-- Video Player -->
                <iframe 
                    src="${previewUrl}" 
                    class="w-full h-full border-0" 
                    allowfullscreen 
                    allow="autoplay; encrypted-media"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                ></iframe>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();

        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';

        // Restaurer le scroll lors de la fermeture
        const modal = document.getElementById('video-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });
    }

    /**
     * Formater la taille du fichier
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Afficher le loading
     */
    showLoading() {
        const container = document.getElementById('recordings-container');
        if (!container) return;

        container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-gray-500">Chargement des enregistrements...</p>
        </div>
        `;
    }

    /**
     * Masquer le loading
     */
    hideLoading() {
        // Le loading est remplacé par le contenu dans render()
    }

    /**
     * Afficher une erreur
     */
    showError(message) {
        const container = document.getElementById('recordings-container');
        if (!container) return;

        container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <i data-lucide="alert-circle" class="w-10 h-10 text-red-600"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Erreur</h3>
            <p class="text-gray-500 max-w-md">${message}</p>
            <button 
                onclick="window.studentRecordings.loadRecordings()"
                class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
            >
                Réessayer
            </button>
        </div>
        `;

        lucide.createIcons();
    }
}

// Initialiser au chargement de la page
window.studentRecordings = new StudentRecordingsViewer();
