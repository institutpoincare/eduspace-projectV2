/**
 * Instructor Class Dashboard
 * Mimics Student View but with Edit Capabilities (Create Folders, Upload Resources)
 */

class InstructorClassDashboard {
    constructor() {
        this.courseId = null;
        this.course = null;
        this.currentFolder = null; // null = root
    }

    async init() {
        if (!window.dataManager) {
            console.error('DataManager non trouvé');
            return;
        }
        await dataManager.init();

        const params = new URLSearchParams(window.location.search);
        this.courseId = params.get('id');

        if (!this.courseId) {
            window.location.href = 'classes.html';
            return;
        }

        await this.loadData();
        this.render();
    }

    async loadData() {
        this.course = await dataManager.getById('courses', this.courseId);
        if (!this.course) {
            alert('Cours non trouvé');
            window.location.href = 'classes.html';
        }
    }

    // --- State Modifiers (The "Creation" Part) ---

    async addFolder() {
        const name = prompt("Nom du nouveau dossier (ex: Chapitre 1):");
        if (!name) return;

        if (!this.course.folders) this.course.folders = [];
        
        const newFolder = { id: Date.now().toString(), name: name };
        this.course.folders.push(newFolder);

        await this.saveCourse("Dossier créé !");
    }

    async deleteFolder(folderId) {
        if (!confirm("Supprimer ce dossier ? Les fichiers à l'intérieur seront déplacés à la racine.")) return;

        this.course.folders = this.course.folders.filter(f => f.id !== folderId);
        
        // Move orphaned resources to root
        if(this.course.resources) {
            this.course.resources.forEach(r => {
                if (r.folderId === folderId) r.folderId = null;
            });
        }

        await this.saveCourse("Dossier supprimé");
        this.currentFolder = null; 
    }

    async addResource() {
        const title = prompt("Titre du contenu (Vidéo, PDF, Lien...):");
        if (!title) return;
        
        const link = prompt("Collez le lien (Drive, YouTube, etc.):");
        if (!link) return;

        // Simple Auto-detection
        let type = 'file-text';
        const lowerLink = link.toLowerCase();
        
        if (lowerLink.includes('drive.google.com') || lowerLink.includes('youtube') || lowerLink.includes('.mp4') || lowerLink.includes('vimeo')) {
            type = 'video';
        } else if (lowerLink.includes('.pdf')) {
            type = 'pdf';
        }

        if (!this.course.resources) this.course.resources = [];

        this.course.resources.push({
            id: Date.now(),
            type: type,
            title: title,
            link: link,
            folderId: this.currentFolder
        });

        await this.saveCourse("Contenu ajouté !");
    }

    async deleteResource(resourceId) {
        if (!confirm("Supprimer cette ressource ?")) return;
        this.course.resources = this.course.resources.filter(r => r.id !== resourceId);
        await this.saveCourse("Ressource supprimée");
    }

    async updateRecordingsFolder() {
        const currentUrl = this.course.recordingsFolderUrl || this.course.recordingsFolder || '';
        const newUrl = prompt("Entrez le lien du Dossier Google Drive contenant les vidéos:", currentUrl);
        
        if (newUrl === null) return; // Cancelled
        
        let finalUrl = newUrl.trim();
        // Basic cleanup if user pastes just ID? Assuming full link usually.
        
        this.course.recordingsFolderUrl = finalUrl;
        
        await this.saveCourse("Lien du dossier mis à jour !");
    }

    async saveCourse(msg) {
        this.course.updatedAt = new Date().toISOString();
        // FIXED: update signature is (collection, id, updates)
        await dataManager.update("courses", this.course.id, this.course);
        if(msg) alert(msg);
        this.render();
    }

    // --- Rendering ---

    render() {
        const container = document.getElementById('class-dashboard-container');
        if (!container) return;

        container.innerHTML = `
            ${this.renderHeader()}
            
            <div class="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full flex-1 overflow-hidden">
                <!-- Main Content (Resources) -->
                <div class="flex-1 flex flex-col gap-6 overflow-y-auto">
                     ${this.renderResourcesSection()}
                     ${this.renderRecordingsSection()}
                </div>

                <!-- Sidebar (Schedule & Quick Actions) -->
                <div class="w-full lg:w-80 shrink-0 space-y-6">
                    ${this.renderScheduleCard()}
                    ${this.renderQuickActions()}
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    renderHeader() {
        return `
        <header class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <a href="classes.html" class="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </a>
                        <span class="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold uppercase tracking-wider border border-yellow-100">
                             Mode Édition
                        </span>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">${this.course.title}</h1>
                </div>
            </div>
        </header>
        `;
    }

    renderResourcesSection() {
        const folders = this.course.folders || [];
        const resources = this.course.resources || [];
        
        let content = '';

        if (this.currentFolder === null) {
            // ROOT VIEW
            const folderCards = folders.map(f => {
                const count = resources.filter(r => r.folderId === f.id).length;
                return `
                    <div class="relative group">
                        <div class="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all" onclick="dashboard.openFolder('${f.id}')">
                            <i data-lucide="folder" class="w-12 h-12 text-blue-200 group-hover:text-blue-500 fill-current mb-2 transition-colors"></i>
                            <h4 class="font-bold text-gray-900 group-hover:text-blue-700 max-w-full truncate px-2">${f.name}</h4>
                            <p class="text-xs text-gray-500">${count} éléments</p>
                        </div>
                        <button onclick="event.stopPropagation(); dashboard.deleteFolder('${f.id}')" class="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer le dossier">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                `;
            }).join('');

            // NEW FOLDER BUTTON
            const addFolderBtn = `
                <button onclick="dashboard.addFolder()" class="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all group h-full">
                    <div class="bg-white p-3 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                        <i data-lucide="plus" class="w-6 h-6 text-blue-600"></i>
                    </div>
                    <h4 class="font-bold text-gray-600 group-hover:text-blue-700">Nouveau Dossier</h4>
                </button>
            `;

            const rootFiles = resources.filter(r => !r.folderId);
            const rootFilesList = this.renderFilesList(rootFiles);

            content = `
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    ${folderCards}
                    ${addFolderBtn}
                </div>
                ${rootFilesList ? `<h3 class="font-bold text-gray-700 mb-3 ml-1">Fichiers à la racine</h3>${rootFilesList}` : ''}
            `;
        } else {
            // INSIDE FOLDER
            const folder = folders.find(f => f.id === this.currentFolder);
            if (!folder) { this.currentFolder = null; return this.renderResourcesSection(); }

            const folderResources = resources.filter(r => r.folderId === folder.id);

            content = `
                <div class="mb-4 flex items-center justify-between">
                    <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                    </button>
                    <button onclick="dashboard.addResource()" class="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black flex items-center gap-2 transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i> Ajouter un contenu
                    </button>
                </div>
                <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <i data-lucide="folder-open" class="w-5 h-5 text-blue-500"></i> ${folder.name}
                </h3>
                
                ${this.renderFilesList(folderResources)}
            `;
        }

        return `
            <section class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative">
                 <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i data-lucide="files" class="w-5 h-5 text-gray-400"></i>
                        Ressources & Documents
                    </h2>
                     ${this.currentFolder === null ? `
                        <button onclick="dashboard.addResource('video')" class="hidden md:flex px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors items-center gap-2">
                            <i data-lucide="plus" class="w-4 h-4"></i> Ajouter un fichier racine
                        </button>
                    ` : ''}
                </div>
                ${content}
            </section>
        `;
    }

    renderFilesList(resources) {
        if (resources.length === 0) return '<div class="text-center py-8 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">Dossier vide</div>';

        return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${resources.map(r => {
                const isVideo = r.type === 'video' || r.type === 'drive';
                const icon = isVideo ? 'play-circle' : 'file-text';
                const colorClass = isVideo ? 'purple' : 'red';
                
                return `
                <div class="relative group bg-white border border-gray-100 rounded-xl p-3 flex items-start gap-3 hover:shadow-md transition-all">
                    <div class="p-2 bg-${colorClass}-50 text-${colorClass}-600 rounded-lg shrink-0">
                        <i data-lucide="${icon}" class="w-5 h-5"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-gray-900 text-sm truncate">${r.title}</h4>
                        <a href="${r.link}" target="_blank" class="text-xs text-gray-400 hover:text-blue-600 truncate block mt-1">${r.link}</a>
                    </div>
                    <button onclick="dashboard.deleteResource(${r.id})" class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                `;
            }).join('')}
        </div>`;
    }



    async addRecording() {
        // Create a modal form for adding videos
        const modalHTML = `
        <div id="add-video-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900">Ajouter une Vidéo</h3>
                    <button onclick="document.getElementById('add-video-modal').remove()" class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Titre</label>
                        <input type="text" id="video-title-input" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium" placeholder="Ex: Séance 1: Introduction">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Lien Drive</label>
                        <div class="relative">
                            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                            <input type="url" id="video-url-input" class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium" placeholder="https://drive.google.com/file/d/...">
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Collez le lien de partage Google Drive</p>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-end gap-3">
                    <button onclick="document.getElementById('add-video-modal').remove()" class="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                    <button onclick="window.confirmAddVideo()" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition-all">Ajouter</button>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('video-title-input').focus();
    }
    
    // Internal Player for Instructor Preview
    playVideo(url, title) {
        if (!url) return;

        // SAFETY CHECK: Folder Links are NOT videos
        if (url.includes('/folders/') || url.includes('drive.google.com/drive/u/')) {
            alert("⚠️ Ceci est un lien de DOSSIER, pas une vidéo.\n\nImpossible de le lire dans le lecteur.\nVeuillez ajouter le lien d'un fichier vidéo spécifique.");
            return;
        }
        
        // Convert to preview link
        let embedUrl = url;
        if (url.includes('drive.google.com')) {
            embedUrl = url.replace(/\/view.*/, '/preview').replace(/\/edit.*/, '/preview');
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
             let videoId = null;
             if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
             else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
             if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }

        const existing = document.getElementById('video-modal');
        if (existing) existing.remove();

        const modalHTML = `
        <div id="video-modal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div class="relative w-full max-w-6xl aspect-video bg-black rounded-xl border border-gray-700 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div class="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800">
                    <h3 class="text-white font-bold truncate flex items-center gap-2"><span class="text-lg">🎬</span> ${title} (Aperçu)</h3>
                    <button onclick="document.getElementById('video-modal').remove()" class="text-gray-400 hover:text-red-400 font-bold p-2 transition-colors">✕ FERMER</button>
                </div>
                <iframe src="${embedUrl}" class="w-full h-full" allow="autoplay; fullscreen" frameborder="0"></iframe>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async deleteRecording(id) {
        if(!confirm("Supprimer cette vidéo ?")) return;
        
        this.course.recordings = this.course.recordings.filter(r => r.id !== id);
        await this.saveCourse("Vidéo supprimée");
    }

    renderRecordingsSection() {
        const recordings = this.course.recordings || [];
        const driveFolderUrl = this.course.recordingsFolderUrl || this.course.recordingsFolder;

        return `
            <section class="mt-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div class="mb-8 border-b border-gray-100 pb-6">
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <i data-lucide="monitor-play" class="w-6 h-6 text-purple-600"></i>
                        Gestion des Enregistrements
                    </h2>
                    <p class="text-sm text-gray-500">
                        Voici ce que vos étudiants voient : un "Dossier" qui contient vos vidéos configurées ci-dessous.
                    </p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <!-- COLUMN 1: CONFIGURATION (Add Videos to the "Folder") -->
                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-bold text-gray-800 flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</span> 
                                Remplir le Dossier
                            </h3>
                            <button onclick="dashboard.addRecording()" class="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors flex items-center gap-2">
                                <i data-lucide="plus" class="w-4 h-4"></i> Ajouter vidéo
                            </button>
                        </div>

                        ${recordings.length === 0 ? `
                            <div class="p-6 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors" onclick="dashboard.addRecording()">
                                <p class="text-sm text-gray-500 font-medium">Le dossier est vide.</p>
                                <p class="text-xs text-gray-400">Ajoutez des vidéos pour qu'elles apparaissent dans le dossier élève.</p>
                            </div>
                        ` : `
                            <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                ${recordings.map(rec => `
                                    <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm group">
                                        <div class="flex items-center gap-3 min-w-0">
                                             <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
                                                <i data-lucide="play" class="w-4 h-4 fill-current"></i>
                                            </div>
                                            <div class="min-w-0">
                                                <h4 class="font-bold text-gray-900 text-sm truncate">${rec.title}</h4>
                                                <p class="text-xs text-gray-400 truncate">Visible dans le dossier</p>
                                            </div>
                                        </div>
                                        <button onclick="dashboard.deleteRecording(${rec.id})" class="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <!-- COLUMN 2: PREVIEW (The "Folder Card") -->
                    <div class="lg:border-l lg:border-gray-100 lg:pl-8">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-bold text-gray-800 flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">2</span> 
                                Aperçu Étudiant
                            </h3>
                        </div>
                        
                        <div class="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                             <p class="text-xs text-gray-500 uppercase tracking-wider mb-3 font-bold">L'étudiant verra ça :</p>
                             
                             <button onclick="openFolderContentModal()" 
                                    class="w-full bg-white hover:bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group cursor-pointer">
                                <div class="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                                </div>
                                <div class="flex-1">
                                    <h3 class="font-bold text-gray-900 group-hover:text-indigo-700">Dossier des Séances</h3>
                                    <p class="text-xs text-gray-500">${recordings.length} éléments</p>
                                </div>
                                <div class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                                    TESTER
                                </div>
                            </button>
                            
                            <p class="text-[10px] text-gray-400 mt-2 text-center">
                                Cliquez sur "TESTER" pour ouvrir le dossier sans quitter le site.
                            </p>
                        </div>
                    </div>

                </div>
            </section>
        `;
    }

    openFolder(id) {
        this.currentFolder = id;
        this.render();
    }

    renderScheduleCard() {
         return `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i data-lucide="calendar" class="w-5 h-5 text-gray-400"></i> Emploi du temps
            </h3>
            <!-- Read-only schedule for reference -->
            <div class="space-y-2">
                ${(this.course.schedule || []).map(s => `
                    <div class="flex justify-between text-sm">
                        <span class="font-bold text-gray-700">${s.day}</span>
                        <span class="text-gray-500">${s.startTime} - ${s.endTime}</span>
                    </div>
                `).join('')}
            </div>
            <button onclick="alert('Modifier l\\'emploi du temps via \'Modifier la classe\' dans le menu principal.')" class="w-full mt-4 py-2 border border-blue-200 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
                Modifier
            </button>
        </div>
        `;
    }
    
    renderQuickActions() {
         return `
        <div class="bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 p-6 text-white">
            <h3 class="font-bold text-lg mb-2">Actions Rapides</h3>
            <p class="text-indigo-100 text-sm mb-4">Gérez votre classe efficacement.</p>
            
            <div class="space-y-2">
                 <button onclick="window.location.href='classes.html'" class="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold text-left px-3 flex items-center gap-2 transition-colors">
                    <i data-lucide="arrow-left" class="w-4 h-4 opacity-70"></i> Retour à mes classes
                </button>
                 <button onclick="window.open('${this.course.meetLink || '#'}', '_blank')" class="w-full py-2 bg-white text-indigo-700 rounded-lg text-sm font-bold text-left px-3 flex items-center gap-2 hover:bg-indigo-50 transition-colors">
                    <i data-lucide="video" class="w-4 h-4"></i> Lancer le Live
                </button>
            </div>
        </div>
        `;
    }
}

// Global helper function for adding videos
window.confirmAddVideo = async () => {
    const title = document.getElementById('video-title-input').value.trim();
    const url = document.getElementById('video-url-input').value.trim();
    
    if (!title || !url) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    // VALIDATION: Reject Folder Links
    if (url.includes('/folders/') || url.includes('drive.google.com/drive/u/')) {
        alert("⛔ Erreur : Vous essayez d'ajouter un lien de DOSSIER.\n\nLe lecteur vidéo a besoin d'un fichier vidéo spécifique (finissant souvent par /view).\n\nPour partager un dossier, utilisez le bouton 'Configurer' à droite.");
        return;
    }
    
    // Ensure recordings array exists
    if (!dashboard.course.recordings) dashboard.course.recordings = [];
    
    // Push new video object
    dashboard.course.recordings.push({
        id: Date.now(),
        title: title,
        url: url,
        addedAt: new Date().toISOString()
    });
    
    document.getElementById('add-video-modal').remove();
    await dashboard.saveCourse("Vidéo ajoutée !");
};
// --- 2. MODAL FUNCTION (Forces Embed Mode - Shared Logic) ---
window.openFolderContentModal = () => {
    // 1. Get Recordings directly from the dashboard instance
    const recordings = dashboard.course.recordings || [];
    
    // 2. Remove existing
    const existing = document.getElementById('folder-modal');
    if (existing) existing.remove();

    // 3. Render Modal with INTERNAL GRID (Simulating Folder View)
    const modalHTML = `
    <div id="folder-modal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
        <div class="absolute inset-0" onclick="document.getElementById('folder-modal').remove()"></div>
        
        <div class="relative w-full max-w-6xl h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
            
            <!-- Header -->
            <div class="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">Enregistrements du Cours</h3>
                        <p class="text-xs text-gray-500">${recordings.length} vidéo(s)</p>
                    </div>
                </div>
                <button onclick="document.getElementById('folder-modal').remove()" class="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
                </button>
            </div>

            <!-- Scrollable Content -->
            <div class="p-8 overflow-y-auto bg-gray-50/50 flex-1">
                ${recordings.length === 0 
                  ? `<div class="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-50"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                        <p class="font-medium">Ce dossier est vide.</p>
                        <p class="text-xs opacity-70">Les enregistrements apparaîtront ici.</p>
                     </div>`
                  : `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        ${recordings.map(video => `
                            <!-- VIDEO CARD (Internal Playback enabled for Instructor) -->
                             <div onclick="dashboard.playVideo('${video.url || ''}', '${(video.title || 'Vidéo').replace(/'/g, "\\'")}')" 
                                 class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-indigo-200 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 block">
                                
                                <!-- Thumbnail Area -->
                                <div class="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900"></div>
                                    <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                    
                                    <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/30 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="text-white ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                    </div>
                                    <span class="absolute bottom-2 right-2 px-2 py-0.5 bg-green-500 text-white text-[10px] rounded font-bold uppercase tracking-wider">Lecture Interne</span>
                                </div>

                                <!-- Info Area -->
                                <div class="p-4">
                                    <h4 class="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors h-10 leading-snug">${video.title}</h4>
                                    <div class="flex items-center justify-between text-xs text-gray-400">
                                        <span class="flex items-center gap-1"><i data-lucide="play-circle" class="w-3 h-3 text-green-500"></i> Testez maintenant</span>
                                        <span>${new Date(video.addedAt || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                     </div>`
                }
            </div>
            
            <!-- Footer hint -->
             <div class="px-6 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
                <span>Contenu sécurisé Eduspace</span>
                <span class="flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Aperçu Prof</span>
             </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    // Re-init icons inside modal
    if(window.lucide) window.lucide.createIcons();
};

const dashboard = new InstructorClassDashboard();
window.dashboard = dashboard;
document.addEventListener('DOMContentLoaded', () => dashboard.init());
