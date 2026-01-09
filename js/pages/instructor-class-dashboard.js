/**
 * Instructor Class Dashboard
 * Mimics Student View but with Edit Capabilities (Create Folders, Upload Resources)
 */

class InstructorClassDashboard {
    constructor() {
        this.courseId = null;
        this.course = null;
        this.currentFolder = null; // null = root
        this.driveRecordings = [];
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
            return;
        }

        // --- INTELLIGENT MODE INTERCEPTOR ---
        // Inject memory recordings if loadFromMemory finished first
        if (window.recordings && window.recordings.length > 0) {
            console.log("⚡ Injection des données en mémoire dans le cours...");
            const others = (this.course.resources || []).filter(r => 
                !['video', 'drive', 'drive-pdf'].includes(r.type)
            );
            this.course.resources = [...others, ...window.recordings];
        }
    }

    // --- State Modifiers (The "Creation" Part) ---

    async addFolder() {
        // New Modal Implementation
        const modalHTML = `
        <div id="add-folder-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900">Nouveau Dossier</h3>
                    <button onclick="document.getElementById('add-folder-modal').remove()" class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Nom du dossier</label>
                        <input type="text" id="folder-name-input" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium" placeholder="Ex: Chapitre 1">
                    </div>
                    
                    <div>
                         <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            Lien Dossier (Optionnel)
                            <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] uppercase">Google Drive</span>
                        </label>
                        <input type="url" id="folder-link-input" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium" placeholder="https://drive.google.com/drive/folders/...">
                        
                        <div class="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex gap-2">
                            <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0"></i>
                            <p>
                                <strong>Important :</strong> Un dossier lié affichera vos fichiers, mais les ouvertures se feront dans Google Drive (nouvel onglet).
                                <br><br>
                                👉 <span class="font-bold underline">Pour le lecteur vidéo interne</span> : Laissez ce champ vide, créez le dossier, puis ajoutez les vidéos manuellement dedans.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-end gap-3">
                    <button onclick="document.getElementById('add-folder-modal').remove()" class="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                    <button onclick="window.confirmAddFolder()" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition-all">Créer</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('folder-name-input').focus();
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


    async saveCourse(msg) {
        this.course.updatedAt = new Date().toISOString();
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
                <div class="flex-1 overflow-y-auto">
                    ${this.renderResourcesSection()}
                </div>

                <!-- Sidebar (Schedule & Quick Actions) -->
                <div class="w-full lg:w-80 shrink-0 space-y-6">
                    ${this.renderScheduleCard()}
                    ${this.renderDriveSection()}
                    ${this.renderQuickActions()}
                </div>
            </div>
        `;
        lucide.createIcons();
        
        // Initialize Drive Manager if present
        if (window.teacherDrive) {
            window.teacherDrive.mount();
        }
    }

    renderDriveSection() {
        return `
        <div class="relative overflow-hidden bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-900/5 p-6 group" id="drive-management-card">
            <!-- Decorative Background Element -->
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:bg-blue-100 transition-colors duration-500"></div>

            <h3 class="relative font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <i data-lucide="hard-drive" class="w-5 h-5"></i>
                </div>
                <span>Google Drive</span>
                <span id="drive-status-badge" class="ml-auto px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded-full text-[10px] font-extrabold uppercase tracking-wider">...</span>
            </h3>
            
            <div class="space-y-3 relative">
                <div class="flex gap-2 w-full">
                    <button onclick="window.configureDriveFolder()" class="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors font-bold text-sm flex items-center gap-2" title="Choisir le dossier Drive">
                        ⚙️ <span class="hidden xl:inline">Config</span>
                    </button>

                    <button id="google-auth-btn" class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 group/btn">
                        <i data-lucide="log-in" class="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform"></i>
                        Connecter Drive
                    </button>
                </div>
                
                <!-- Hidden old buttons for reference or safe removal -->
                <button id="config-folder-btn" class="hidden"></button>
                <button id="sync-now-btn" class="hidden"></button>
                
                <button id="disconnect-drive-btn" class="hidden w-full py-1 text-red-500/70 hover:text-red-600 text-[10px] font-medium hover:underline text-center transition-colors">
                    Déconnecter le compte
                </button>
            </div>
            
            <!-- Helper Text -->
            <p class="mt-4 text-xs text-gray-400 text-center leading-relaxed">
                Connectez votre Drive pour synchroniser automatiquement vos enregistrements OBS.
            </p>
        </div>
        `;
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
        
        // UNIFIED SOURCE OF TRUTH: All videos come from resources
        const allVideos = resources.filter(r => r.type === 'video' || r.type === 'drive');
        // UNIFIED SOURCE FOR PDFS
        const allPdfs = resources.filter(r => r.type === 'pdf' || r.type === 'drive-pdf');

        let content = '';

        if (this.currentFolder === null) {
            // ROOT VIEW
            
            // 1. DYNAMIC "ENREGISTREMENTS" FOLDER
            const recordingsFolderCard = `
                 <div class="relative group h-full">
                    <div class="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-2xl hover:shadow-lg hover:shadow-red-500/10 cursor-pointer transition-all duration-300 h-full group-hover:-translate-y-1" onclick="dashboard.openFolder('recordings-root')">
                        <div class="relative mb-3">
                            <div class="absolute inset-0 bg-red-400 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div class="relative p-4 bg-white text-red-600 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <i data-lucide="play-circle" class="w-8 h-8 fill-red-50 text-red-600"></i>
                            </div>
                        </div>
                        <h4 class="font-extrabold text-gray-900 group-hover:text-red-600 max-w-full truncate px-2 text-center text-lg transition-colors">Enregistrements</h4>
                        <div class="mt-2 px-3 py-1 bg-white/60 rounded-full border border-red-100 text-xs font-medium text-red-600">
                            ${allVideos.length} vidéos
                        </div>
                    </div>
                </div>
            `;

            // 2. DYNAMIC "DOCUMENTS" FOLDER (NEW)
            const documentsFolderCard = `
                 <div class="relative group h-full">
                    <div class="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer transition-all duration-300 h-full group-hover:-translate-y-1" onclick="dashboard.openFolder('documents-root')">
                        <div class="relative mb-3">
                            <div class="absolute inset-0 bg-amber-400 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div class="relative p-4 bg-white text-amber-600 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <i data-lucide="book-open" class="w-8 h-8 fill-amber-50 text-amber-600"></i>
                            </div>
                        </div>
                        <h4 class="font-extrabold text-gray-900 group-hover:text-amber-600 max-w-full truncate px-2 text-center text-lg transition-colors">Resources Nécessaires</h4>
                        <div class="mt-2 px-3 py-1 bg-white/60 rounded-full border border-amber-100 text-xs font-medium text-amber-600">
                            ${allPdfs.length} fichiers
                        </div>
                    </div>
                </div>
            `;

            const folderCards = folders.map(f => {
                const count = resources.filter(r => r.folderId === f.id).length;
                const isLinked = !!f.link;
                const clickAction = `dashboard.openFolder('${f.id}')`;
                const iconColor = isLinked ? 'text-green-500' : 'text-blue-200 group-hover:text-blue-500';
                const iconName = isLinked ? 'folder-search' : 'folder';
                
                return `
                    <div class="relative group">
                        <div class="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all" onclick="${clickAction}">
                            <i data-lucide="${iconName}" class="w-12 h-12 ${iconColor} fill-current mb-2 transition-colors"></i>
                            <h4 class="font-bold text-gray-900 group-hover:text-blue-700 max-w-full truncate px-2 text-center">${f.name}</h4>
                            <p class="text-xs text-gray-500">${isLinked ? 'Dossier Drive' : count + ' éléments'}</p>
                        </div>
                        <button onclick="event.stopPropagation(); dashboard.deleteFolder('${f.id}')" class="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer le dossier">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                `;
            }).join('');

            const addFolderBtn = `
                <button onclick="dashboard.addFolder()" class="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all group h-full">
                    <div class="bg-white p-3 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                        <i data-lucide="plus" class="w-6 h-6 text-blue-600"></i>
                    </div>
                    <h4 class="font-bold text-gray-600 group-hover:text-blue-700">Nouveau Dossier</h4>
                </button>
            `;

            content = `
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    ${recordingsFolderCard}
                    ${documentsFolderCard}
                    ${folderCards}
                    ${addFolderBtn}
                </div>
            `;
            
        } else if (this.currentFolder === 'recordings-root') {
             // VIEW: RECORDINGS
            const listHTML = this.renderFilesList(allVideos);

            content = `
                 <div class="mb-4 flex items-center justify-between gap-4">
                    <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                    </button>
                    
                    <div class="flex gap-2">
                         <button onclick="window.teacherDrive.syncNow().then(() => dashboard.openFolder('recordings-root'))" class="px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync Drive
                        </button>
                    </div>
                </div>

                <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <i data-lucide="info" class="w-5 h-5 text-blue-600 shrink-0 mt-0.5"></i>
                    <div class="text-sm text-blue-800">
                        <p class="font-bold mb-1">D'où viennent ces vidéos ?</p>
                        <p class="opacity-90">
                            Ce dossier est <strong>automatiquement synchronisé</strong> avec le dossier Google Drive configuré.
                        </p>
                    </div>
                </div>
                
                <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <i data-lucide="play-circle" class="w-5 h-5 text-red-500"></i> Tous les enregistrements
                    <span class="text-xs font-normal text-gray-400 ml-2">(${allVideos.length})</span>
                </h3>
                
                ${listHTML}
            `;
        } else if (this.currentFolder === 'documents-root') {
            // VIEW: DOCUMENTS (PDFs)
             const listHTML = this.renderFilesList(allPdfs);

            content = `
                 <div class="mb-4 flex items-center justify-between gap-4">
                    <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 font-medium transition-colors">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                    </button>
                    
                    <div class="flex gap-2">
                         <button onclick="window.teacherDrive.syncNow().then(() => dashboard.openFolder('documents-root'))" class="px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync Drive
                        </button>
                    </div>
                </div>

                <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <i data-lucide="book-open" class="w-5 h-5 text-amber-600 shrink-0 mt-0.5"></i>
                    <div class="text-sm text-amber-800">
                        <p class="font-bold mb-1">Resources Nécessaires</p>
                        <p class="opacity-90">
                            Ce dossier contient les manuels, livres et documents nécessaires pour le cours.
                        </p>
                    </div>
                </div>
                
                <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <i data-lucide="library" class="w-5 h-5 text-amber-500"></i> Tous les documents
                    <span class="text-xs font-normal text-gray-400 ml-2">(${allPdfs.length})</span>
                </h3>
                
                ${listHTML}
            `;
        } else {
             // REGULAR FOLDER VIEW
             const folder = folders.find(f => f.id === this.currentFolder);
             if (!folder) { this.currentFolder = null; return this.renderResourcesSection(); }
             
             if (folder.link) {
                  // Linked Folder Logic (External Drive)
                  const idMatch = folder.link.match(/[-\w]{25,}/);
                  const id = idMatch ? idMatch[0] : null;
                  const embedUrl = `https://drive.google.com/embeddedfolderview?id=${id}#grid`;
                  
                  content = `
                    <div class="mb-4 flex items-center justify-between">
                        <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                        </button>
                    </div>
                    ${id ? `<div class="w-full h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"><iframe src="${embedUrl}" class="w-full h-full border-0"></iframe></div>` : '<p class="p-10 text-center text-red-500">Lien Drive invalide</p>'}
                  `;
             } else {
                 // Standard Folder
                 const folderResources = resources.filter(r => r.folderId === folder.id);
                 content = `
                    <div class="mb-4 flex items-center justify-between">
                        <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                        </button>
                    </div>
                    <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <i data-lucide="folder-open" class="w-5 h-5 text-blue-500"></i> ${folder.name}
                    </h3>
                    ${this.renderFilesList(folderResources)}
                 `;
             }
        }

        return `
            <section class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative">
                 <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i data-lucide="files" class="w-5 h-5 text-gray-400"></i>
                        Ressources & Documents
                    </h2>
                </div>
                ${content}
            </section>
        `;
    }

    renderFilesList(resources) {
        if (resources.length === 0) return '<div class="text-center py-8 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">Dossier vide</div>';

        // Add Thumbnail Styles explicitly if not present
        if (!document.getElementById('video-card-styles')) {
             const styleSheet = document.createElement("style");
             styleSheet.id = 'video-card-styles';
             styleSheet.innerText = `
                .video-thumbnail-card {
                    position: relative; cursor: pointer; overflow: hidden; border-radius: 16px; background: #0f172a; aspect-ratio: 16/9; transition: all 0.4s; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .video-thumbnail-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); border-color: rgba(59, 130, 246, 0.5); }
                .play-icon-overlay { width: 56px; height: 56px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s; z-index: 10; pointer-events: none; }
                .video-thumbnail-card:hover .play-icon-overlay { background: #ef4444; border-color: #ef4444; transform: scale(1.1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
             `;
             document.head.appendChild(styleSheet);
        }

        return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${resources.map(r => {
                const isVideo = r.type === 'video' || r.type === 'drive';
                const isPdf = r.type === 'pdf' || r.type === 'drive-pdf';

                if (isVideo) {
                    let videoUrl = r.link || r.url || r.webViewLink;
                    if (!videoUrl && r.id && isNaN(r.id)) videoUrl = `https://drive.google.com/file/d/${r.id}/preview`;
                    const safeTitle = (r.title || 'Vidéo sans titre').replace(/'/g, "\\'").replace(/"/g, '&quot;');

                    return `
                    <div class="flex flex-col gap-2 group">
                        <div class="video-thumbnail-card group relative cursor-pointer" onclick="window.globalPlayVideo('${videoUrl}', '${safeTitle}')">
                            <div class="play-icon-overlay pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
                            <div class="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-medium">VIDÉO</div>
                        </div>
                        <div class="flex justify-between items-start px-1">
                             <div class="min-w-0">
                                <h4 class="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">${r.title || 'Sans titre'}</h4>
                                <p class="text-xs text-gray-400">Lecture interne</p>
                             </div>
                             <button onclick="event.stopPropagation(); dashboard.deleteResource('${r.id}')" class="text-gray-300 hover:text-red-500 transition-colors" title="Supprimer">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                             </button>
                        </div>
                    </div>`;
                }

                if (isPdf) {
                    let pdfUrl = r.link || r.url || r.webViewLink;
                    if (!pdfUrl && r.id && isNaN(r.id)) pdfUrl = `https://drive.google.com/file/d/${r.id}/preview`;
                    const safeTitle = (r.title || 'Document PDF').replace(/'/g, "\\'").replace(/"/g, '&quot;');

                    return `
                    <div class="flex flex-col gap-2 group">
                         <div class="video-thumbnail-card group relative cursor-pointer" style="background: #fffbeb; border-color: #fcd34d;" onclick="window.globalPlayVideo('${pdfUrl}', '${safeTitle}')">
                            <div class="play-icon-overlay pointer-events-none" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            </div>
                            <div class="absolute bottom-2 right-2 px-2 py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">PDF</div>
                        </div>
                        <div class="flex justify-between items-start px-1">
                             <div class="min-w-0">
                                <h4 class="font-bold text-gray-900 text-sm truncate group-hover:text-amber-600 transition-colors">${r.title || 'Document'}</h4>
                                <p class="text-xs text-gray-400">Lecture interne</p>
                             </div>
                             <button onclick="event.stopPropagation(); dashboard.deleteResource('${r.id}')" class="text-gray-300 hover:text-red-500 transition-colors" title="Supprimer">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                             </button>
                        </div>
                    </div>`;
                }
                
                // RENDER AS STANDARD FILE CARD
                return `
                <div class="relative group bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-all cursor-pointer" onclick="window.open('${r.link}', '_blank')">
                    <div class="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
                        <i data-lucide="file-text" class="w-6 h-6"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">${r.title}</h4>
                        <p class="text-xs text-gray-400 truncate mt-1">Document externe</p>
                    </div>
                    <button onclick="event.stopPropagation(); dashboard.deleteResource(${r.id})" class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                `;
            }).join('')}
        </div>`;
    }

    // PART 1: Instructor Dashboard (Bulk Import Tool)
    handleBulkImport() {
        if (!this.currentFolder) {
            alert("Veuillez d'abord entrer dans un dossier.");
            return;
        }

        const text = prompt("Collez votre liste de liens Drive ici (un par ligne ou texte complet):");
        if (!text) return;

        const urlRegex = /https:\/\/drive\.google\.com\/file\/d\/([-\w]+)\/view/g;
        let match;
        let count = 0;
        let newResources = [];

        while ((match = urlRegex.exec(text)) !== null) {
            newResources.push({
                id: Date.now() + count, // Simple safe ID generation
                title: `Séance ${count + 1} (Importée)`,
                link: match[0], // Keep original /view link
                type: 'video', // Treat as video for internal player
                folderId: this.currentFolder,
                date: new Date().toISOString()
            });
            count++;
        }

        if (newResources.length > 0) {
            if (!this.course.resources) this.course.resources = [];
            this.course.resources.push(...newResources);
            
            this.render();
            // Trigger save
            this.saveCourse(`${count} vidéos importées avec succès !`);
        } else {
            alert("Aucun lien Drive valide trouvé (format requis: .../file/d/ID/view).");
        }
    }

    // Bridge method to use the new VideoModal class
    playVideo(url, title) {
        if (!url) return;
        
        // Use the new URGENT FIX implementation
        if (window.playPopup) {
            window.playPopup(url, title);
        } else {
            console.error("playPopup not found");
            window.open(url, '_blank');
        }
    }


// 1. Restore the openFolder method cleanly
    async openFolder(id) {
        this.currentFolder = id;
        this.render();
    }

// 2. We remove the global functions from here because they are syntactically invalid inside a class.
// We will append them at the end or use a designated area.
// Since I can't easily append in the same tool call without complex targeting, 
// I will just delete the injected code from here first.

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
    
    async addRecording() {
        const title = prompt("Titre de la vidéo :");
        if (!title) return;
        
        const link = prompt("Lien de la vidéo (Drive, YouTube, etc.) :");
        if (!link) return;

        if (!this.course.resources) this.course.resources = [];
        
        const newRecording = {
            id: Date.now(),
            type: 'video',
            title: title,
            link: link,
            folderId: 'recordings-root', // Special Virtual Folder
            addedAt: new Date().toISOString(),
            isManual: true
        };

        this.course.resources.push(newRecording);

        await this.saveCourse("Vidéo ajoutée manuellement !");
        
        // Refresh current folder view if we are inside recordings
        if (this.currentFolder === 'recordings-root') {
            this.openFolder('recordings-root');
        }
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

// Global helper for Adding Folder
window.confirmAddFolder = async () => {
    const name = document.getElementById('folder-name-input').value.trim();
    const link = document.getElementById('folder-link-input').value.trim();
    
    if (!name) return alert("Le nom est requis");
    
    if (!dashboard.course.folders) dashboard.course.folders = [];
    
    const newFolder = { 
        id: Date.now().toString(), 
        name: name,
        link: link || null // Store link if present
    };
    
    dashboard.course.folders.push(newFolder);
    document.getElementById('add-folder-modal').remove();
    await dashboard.saveCourse("Dossier créé !");
};

// --- NEW VIDEO MODAL IMPLEMENTATION (Iframe Popup) ---
class VideoModal {
    constructor() {
        this.modal = null;
        this.iframe = null;
        this.init();
    }
    
    init() {
        // Inject CSS
        if (!document.getElementById('iframe-video-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'iframe-video-modal-styles';
            style.textContent = `
                /* Style pour le modal vidéo */
                .video-popup {
                    display: none;
                    position: fixed;
                    z-index: 9999;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: transparent; /* Overlay handles background */
                }

                .popup-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .popup-content {
                    position: relative;
                    width: 90%;
                    max-width: 1000px;
                    height: 80vh;
                    background: #000;
                    border-radius: 8px;
                    overflow: hidden;
                    z-index: 10000;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    display: flex; /* Centering helper */
                    flex-direction: column;
                }

                .close-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 10001;
                    transition: background 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                #videoFrame {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: #000;
                }
            `;
            document.head.appendChild(style);
        }

        // Create Modal HTML
        if (!document.getElementById('videoPopup')) {
            this.createModal();
        }
        
        this.modal = document.getElementById('videoPopup');
        this.iframe = document.getElementById('videoFrame');
        this.setupEventListeners();
    }
    
    createModal() {
        const modalHTML = `
            <div id="videoPopup" class="video-popup" style="display: none;">
                <div class="popup-overlay"></div>
                <div class="popup-content">
                    <button class="close-btn">&times;</button>
                    <iframe id="videoFrame" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    setupEventListeners() {
        // Close Button
        const closeBtn = this.modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.close());
        
        // Click Outside (Overlay)
        const overlay = this.modal.querySelector('.popup-overlay');
        overlay.addEventListener('click', () => this.close());
        
        // Escape Key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.close();
            }
        });
    }
    
    open(videoUrl) {
        // Convert Google Drive URL to Embed URL
        const embedUrl = this.convertToEmbedUrl(videoUrl);
        
        this.iframe.src = embedUrl;
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.iframe.src = ''; // Stop video
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    convertToEmbedUrl(url) {
        // Handle Google Drive Links
        if (url.includes('drive.google.com')) {
            // Try extracting ID
            const fileIdMatch = url.match(/\/file\/d\/([^\/]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                 return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
            }
            // Logic for other drive links if needed, but manual video entry usually implies direct link
            // Fallback for ID match without typical structure
            const idMatch = url.match(/[-\w]{25,}/);
            if(idMatch) return `https://drive.google.com/file/d/${idMatch[0]}/preview`;
        }
        // Handle YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
             let videoId = null;
             if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
             else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
             if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
        
        return url;
    }
}

// Global helper for adding videos
const dashboard = new InstructorClassDashboard();
window.dashboard = dashboard;

// (Ancien Script de Mémoire supprimé - Remplacé par le mode intelligent ci-dessous)

// URGENT FIX: Force Preview Mode to avoid redirects
// --- FIX FINAL: LECTEUR UNIVERSEL (يحل أي رابط Drive) ---
window.playPopup = (url, title) => {
    console.log("🎬 محاولة تشغيل:", title, url);

    // 1. استخراج ID بطريقة ذكية (تقبل كل أنواع روابط Drive)
    // يقبل: /file/d/ID, /open?id=ID, ?id=ID, etc.
    let fileId = null;
    const regex = /(?:\/d\/|id=|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    
    if (match && match[1]) {
        fileId = match[1];
    }

    if (!fileId) {
        // محاولة أخيرة: بالكشي الرابط هو بيدو ID
        if (url.length > 20 && !url.includes('/')) {
            fileId = url;
        } else {
            alert("⚠️ Lien vidéo non reconnu. Vérifiez qu'il s'agit bien d'une vidéo Drive.");
            return;
        }
    }

    // 2. صنع رابط Preview (السحري)
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

    // 3. تنظيف القديم
    if (document.getElementById('video-modal')) document.getElementById('video-modal').remove();

    // 4. Affichage
    const modalHTML = `
    <div id="video-modal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in">
        <div class="absolute inset-0" onclick="document.getElementById('video-modal').remove()"></div>
        <div class="relative w-full max-w-5xl aspect-video bg-black rounded-xl border border-gray-800 shadow-2xl flex flex-col z-10">
            <div class="flex justify-between items-center px-4 py-3 bg-gray-900 border-b border-gray-800 rounded-t-xl">
                <h3 class="text-white font-medium truncate pr-4">${title}</h3>
                <button onclick="document.getElementById('video-modal').remove()" class="text-white hover:text-red-500 font-bold px-2">✕</button>
            </div>
            <iframe src="${embedUrl}" class="flex-1 w-full border-0 rounded-b-xl" allow="autoplay; fullscreen" allowfullscreen></iframe>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// ======================================================
// 🚀 SYSTÈME AUTOMATIQUE : MEMOIRE + SYNC (Refactored)
// ======================================================

// Variables globales partagées avec teacherDrive.js
// const CLIENT_ID = ... (Déjà déclaré dans teacherDrive.js)
// const SCOPES = ...
// let tokenClient;
// let accessToken = null;

// 1️⃣ Démarrage Automatique + Persistance
document.addEventListener('DOMContentLoaded', () => {
    console.log("⚡ Démarrage systéme...");
    
    // --- Initialisation des Objets Globaux ---
    if (window.dashboard) window.dashboard.init();
    if (window.VideoModal) window.videoModal = new VideoModal();
    // ---------------------------------------

    // A) CHARGEMENT IMMÉDIAT (Stateful Load)
    loadFromMemory();

    // B) INIT GOOGLE AUTH (Silent Prep)
    if (typeof google === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initGoogleAuth;
        document.head.appendChild(script);
    } else {
        initGoogleAuth();
    }
});

// 2️⃣ Fonction de Chargement Mémoire (Optimisée)
function loadFromMemory() {
    const classId = new URLSearchParams(window.location.search).get("id") || 'default';
    const savedData = localStorage.getItem('class_recordings_' + classId);

    if (savedData) {
        try {
            window.recordings = JSON.parse(savedData);
            console.log(`💾 Mémoire locale: ${window.recordings.length} éléments chargés.`);
            
            // Attendre que renderRecordings soit disponible
            const waitForRender = setInterval(() => {
                if (typeof renderRecordings === 'function') {
                    clearInterval(waitForRender);
                    renderRecordings(window.recordings);
                    
                    // UI Polish: Show grid immediately
                    const emptyState = document.getElementById('empty-state');
                    if (emptyState) emptyState.classList.add('hidden');
                    
                    // Update Title if needed
                    const titleEl = document.getElementById('current-folder-title');
                    if(titleEl && window.recordings.length > 0) titleEl.innerText = "Enregistrements (Mémoire)";
                }
            }, 50);
        } catch (e) {
            console.error("Erreur lecture mémoire:", e);
        }
    }
}

// 3️⃣ Initialisation Auth Google
function initGoogleAuth() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, // Use global
        scope: SCOPES,        // Use global
        callback: (response) => {
            if (response.error) {
                console.error('Erreur Auth:', response);
                return;
            }
            accessToken = response.access_token;
            // Auto-Sync after successful login
            fetchDriveFiles();
        },
    });

    // Attach Click Listener to Button properly
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('#google-auth-btn');
        if (btn) {
            if (!accessToken) {
                if (tokenClient) tokenClient.requestAccessToken({prompt: ''});
                else alert("Google Library loading...");
            } else {
                fetchDriveFiles(); 
            }
        }
    });
}

// 4️⃣ LOGIQUE SYNC MIROIR (Stateful Mirror Sync)
async function fetchDriveFiles() {
    const classId = new URLSearchParams(window.location.search).get("id") || 'default';
    const btn = document.getElementById('google-auth-btn');

    // 1. Lire configuration dossier
    const linkedFolderId = localStorage.getItem('linked_folder_id_' + classId);
    let folderQuery = "";
    
    if (linkedFolderId) {
        console.log(`🎯 Sync cible: ${linkedFolderId}`);
        folderQuery = `'${linkedFolderId}' in parents and `;
    } else {
        // Optionnel: Demander de lier si pas fait (UX Choice)
        if(confirm("Aucun dossier lié. Voulez-vous lier un dossier Google Drive maintenant ?")) {
            configureDriveFolder();
            return;
        }
    }

    try {
        if(btn) btn.innerText = "🔄 Syncing...";

        // 2. Requête API
        const q = `${folderQuery} (mimeType contains 'video/' or mimeType = 'application/pdf') and trashed = false`;
        const fields = "files(id, name, webViewLink, thumbnailLink, mimeType)";
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}`, 
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        const apiFiles = data.files || [];

        // 3. Transformation Données
        const newDriveItems = apiFiles.map(f => ({
            id: f.id,
            title: f.name,
            url: `https://drive.google.com/file/d/${f.id}/preview`, // Standardize URL
            type: f.mimeType === 'application/pdf' ? 'pdf' : 'drive',
            addedAt: new Date().toISOString()
        }));

        // 4. MIRROR LOGIC: Clean & Merge
        let currentList = window.recordings || [];

        // A) Garder UNIQUEMENT les manuels (Non-Drive)
        const manualItems = currentList.filter(item => {
            // Un item est manuel s'il n'est PAS de type 'drive' OU s'il a été marqué explicitement manual
            // Safe heuristic: if type != 'drive' AND type != 'pdf' (assumed drive-pdf fallback)
            // Better: Check explicit flag isManual OR if url is NOT google drive
            return item.isManual === true || (item.type !== 'drive' && !item.url.includes('drive.google.com'));
        });

        // B) Remplacer TOUT le reste par la nouvelle liste API (Le Miroir)
        window.recordings = [...manualItems, ...newDriveItems];

        // 5. Persistance Immédiate
        localStorage.setItem('class_recordings_' + classId, JSON.stringify(window.recordings));

        // 6. Mise à jour UI
        renderRecordings(window.recordings);
        
        if(btn) {
            btn.innerText = "✅ Synced";
            setTimeout(() => btn.innerText = "🔄 Synchroniser", 2500);
        }

    } catch (err) {
        console.error("Sync Failed:", err);
        alert("Erreur Sync: " + err.message);
        if(btn) btn.innerText = "❌ Erreur";
    }
}

// 5️⃣ Configuration Dossier (Helper)
function configureDriveFolder() {
    const folderLink = prompt("Lien du dossier Google Drive (ou ID) :");
    if (!folderLink) return;

    // Robust ID Extraction
    let folderId = null;
    const match = folderLink.match(/[-\w]{25,}/); // Matches generic ID patterns
    if (match) folderId = match[0];

    if (!folderId) {
        alert("ID de dossier introuvable. Veuillez coller un lien valide.");
        return;
    }

    const classId = new URLSearchParams(window.location.search).get("id") || 'default';
    localStorage.setItem('linked_folder_id_' + classId, folderId);

    alert("✅ Dossier lié ! La synchronisation ciblera ce dossier.");
    // Auto-trigger sync if ready
    if (accessToken) fetchDriveFiles();
}

// 6️⃣ UNIVERSAL PLAYER FIX (Validation)
// (Déjà présent via window.playPopup mais on s'assure qu'il est robuste)
window.playPopup = (url, title) => {
    // Robust Extraction
    let fileId = null;
    // Matches: /d/ID, id=ID, open?id=ID
    const regex = /(?:\/d\/|id=|open\?id=|uc\?id=)([a-zA-Z0-9_-]{25,})/; 
    const match = url.match(regex);
    
    if (match && match[1]) {
        fileId = match[1];
    } else if (url.match(/^[a-zA-Z0-9_-]{25,}$/)) {
        // Direct ID check
        fileId = url;
    }

    if (!fileId) {
        alert("Impossible de lire la vidéo: ID non reconnu.");
        return;
    }

    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    
    // Clean old modal
    const existing = document.getElementById('video-modal');
    if (existing) existing.remove();

    const modalHTML = `
    <div id="video-modal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in">
         <div class="absolute inset-0" onclick="document.getElementById('video-modal').remove()"></div>
         <div class="relative w-full max-w-6xl aspect-video bg-black rounded-xl border border-gray-800 shadow-2xl flex flex-col z-10">
             <div class="flex justify-between items-center px-4 py-3 bg-gray-900 border-b border-gray-800 rounded-t-xl">
                 <h3 class="text-white font-medium truncate pr-4">${title}</h3>
                 <button onclick="document.getElementById('video-modal').remove()" class="text-white hover:text-red-500 font-bold px-2 text-xl">&times;</button>
             </div>
             <iframe src="${embedUrl}" class="flex-1 w-full border-0 rounded-b-xl" allow="autoplay; fullscreen" allowfullscreen></iframe>
         </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};
// --- FIX: USER PROVIDED CLEAN LOGIC ---
// Added at the end to ensure overrides and global access

window.recordings = []; // Ensure it exists

window.renderRecordings = (videos) => {
    // Adapter to use the existing dashboard render logic
    
    if (window.dashboard && window.dashboard.course) {
        console.log("Rendering via Dashboard Render with new videos");
        
        // 1. Preserve non-video resources (Docs, Links, etc.)
        const currentResources = window.dashboard.course.resources || [];
        // We assume 'videos' (arg) contains the authorized list of recordings/drive files
        // We keep everything that is NOT a video/drive file from the original list
        const otherResources = currentResources.filter(r => 
            !['video', 'drive', 'drive-pdf'].includes(r.type) && 
            !r.link?.includes('drive.google.com') // Safety check
        );

        // 2. Update Source of Truth
        window.dashboard.course.resources = [...otherResources, ...videos];

        // 3. Render
        if (document.getElementById('recordings-container')) {
            // If we are in the specific view, just update that part (Cleaner)
            const html = window.dashboard.renderFilesList(videos);
            document.getElementById('recordings-container').innerHTML = html;
            if(typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            // Full re-render
            window.dashboard.render();
        }
    } else {
        console.log("⏳ Dashboard pas encore prêt... Les données sont stockées dans window.recordings");
        // Les données sont déjà dans window.recordings (passé par référence ou global), 
        // donc loadData() les récupérera quand il finira.
    }
};

window.openFolder = (folderId, folderName) => {
    console.log("ðŸ“‚ Ouvrir dossier:", folderName);
    
    const titleElement = document.getElementById('current-folder-title');
    if (titleElement) titleElement.innerText = folderName;

    const foldersGrid = document.getElementById('folders-grid');
    const recordingsGrid = document.getElementById('recordings-grid');
    
    if (foldersGrid) foldersGrid.classList.add('hidden');
    if (recordingsGrid) recordingsGrid.classList.remove('hidden');

    let videosToShow = window.recordings || [];
    
    // Fallback LocalStorage
    if (videosToShow.length === 0) {
        const classId = new URLSearchParams(window.location.search).get("id");
        const savedData = localStorage.getItem('class_recordings_' + classId);
        if (savedData) {
            try {
                videosToShow = JSON.parse(savedData);
            } catch(e) { console.error("Error parsing recordings", e); }
        } else if (window.dashboard && window.dashboard.course && window.dashboard.course.resources) {
            videosToShow = window.dashboard.course.resources.filter(r => r.type === 'video');
        }
    }

    if (videosToShow.length > 0) {
        if (typeof window.renderRecordings === 'function') {
            window.renderRecordings(videosToShow);
        } else if(window.dashboard) {
             window.dashboard.currentFolder = folderId; 
             window.dashboard.render();
        }
    } else {
        const container = document.getElementById('recordings-container');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <p class="text-gray-500 mb-4">Aucune vidÃ©o chargÃ©e.</p>
                    <button onclick="document.getElementById('google-auth-btn').click()" class="text-blue-600 underline font-bold">
                        Cliquez ici pour connecter Google Drive
                    </button>
                </div>`;
        } else if(window.dashboard) {
             window.dashboard.currentFolder = folderId;
             window.dashboard.render();
        }
    }
};

window.backToFolders = () => {
    console.log("â¬…ï¸ Retour aux dossiers");
    const foldersGrid = document.getElementById('folders-grid');
    const recordingsGrid = document.getElementById('recordings-grid');
    
    if (foldersGrid) foldersGrid.classList.remove('hidden');
    if (recordingsGrid) recordingsGrid.classList.add('hidden');
    
    const titleElement = document.getElementById('current-folder-title');
    if (titleElement) titleElement.innerText = "Ressources & Documents";
    
    if(window.dashboard) {
        window.dashboard.openFolder(null);
    }
};

// Also ensure we save to LocalStorage when importing
const originalSaveCourse = window.dashboard ? window.dashboard.saveCourse : null;
if (window.dashboard) {
    window.dashboard.saveCourse = async function(msg) {
        // Original save
        if(this.constructor.prototype.saveCourse) {
           await this.constructor.prototype.saveCourse.call(this, msg);
        }
        
        // LocalStorage backup for the user's specific logic
        const classId = new URLSearchParams(window.location.search).get("id");
        const videos = this.course.resources.filter(r => r.type === 'video');
        localStorage.setItem('class_recordings_' + classId, JSON.stringify(videos));
        console.log("Saved specific recordings to LocalStorage");
    }
}
// --- DEBUG & GLOBAL HELPER ---
window.globalPlayVideo = (url, title) => {
    console.log("⚡ GLOBAL CLICK:", title, url);
    if (!url) { alert("Lien vidéo manquant"); return; }
    
    // Call the universal player
    if (window.playPopup) {
         window.playPopup(url, title);
    } else {
         console.error("playPopup missing, using fallback");
         window.open(url, '_blank');
    }
};
