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
        const recordings = this.course.recordings || []; // Dedicated Recordings Array

        let content = '';

        if (this.currentFolder === null) {
            // ROOT VIEW
            
            // 1. HARDCODED "ENREGISTREMENTS" FOLDER
            const recordingsFolderCard = `
                 <div class="relative group">
                    <div class="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-xl hover:bg-red-50 hover:border-red-200 cursor-pointer transition-all" onclick="dashboard.openFolder('recordings-root')">
                        <div class="p-3 bg-red-100 text-red-600 rounded-full mb-2 group-hover:scale-110 transition-transform">
                            <i data-lucide="play-circle" class="w-8 h-8 fill-current"></i>
                        </div>
                        <h4 class="font-bold text-gray-900 group-hover:text-red-700 max-w-full truncate px-2 text-center">Enregistrements</h4>
                        <p class="text-xs text-gray-500">${recordings.length} vidéos</p>
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
                    ${folderCards}
                    ${addFolderBtn}
                </div>
            `;
            
        } else if (this.currentFolder === 'recordings-root') {
             // VIEW: RECORDINGS
            const normalizedRecordings = recordings.map(r => ({ ...r, type: 'video' })); 
            const listHTML = this.renderFilesList(normalizedRecordings);

            content = `
                 <div class="mb-4 flex items-center justify-between">
                    <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                    </button>
                    <button onclick="dashboard.addRecording()" class="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 flex items-center gap-2 transition-colors shadow-lg shadow-red-200">
                        <i data-lucide="video" class="w-4 h-4"></i> Ajouter un Enregistrement
                    </button>
                </div>
                
                <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <i data-lucide="play-circle" class="w-5 h-5 text-red-500"></i> Enregistrements des Séances
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
                    
                    <h3 class="font-bold text-lg text-green-700 mb-4 flex items-center gap-2">
                        <i data-lucide="folder-search" class="w-5 h-5"></i> ${folder.name} <span class="text-xs text-gray-400 font-normal px-2 py-0.5 bg-gray-100 rounded">Drive</span>
                    </h3>

                    <div class="w-full h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        ${id ? `<iframe src="${embedUrl}" class="w-full h-full border-0"></iframe>` : '<p class="p-10 text-center text-red-500">Lien Drive invalide</p>'}
                    </div>
                  `;
             } else {
                 // Standard Folder
                 const folderResources = resources.filter(r => r.folderId === folder.id);
                 content = `
                    <div class="mb-4 flex items-center justify-between">
                        <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                        </button>
                        <div class="flex gap-2">
                             <button onclick="dashboard.handleBulkImport()" class="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                <span>📥</span> Importer Liste
                            </button>
                            <button onclick="dashboard.addResource()" class="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black flex items-center gap-2 transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i> Ajouter un contenu
                            </button>
                        </div>
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

        // Add Thumbnail Styles explicitly if not present (User requested style)
        if (!document.getElementById('video-card-styles')) {
             const styleSheet = document.createElement("style");
             styleSheet.id = 'video-card-styles';
             styleSheet.innerText = `
                .video-thumbnail-card {
                    position: relative;
                    cursor: pointer;
                    overflow: hidden;
                    border-radius: 12px;
                    background: #1f2937; /* Gray-800 */
                    aspect-ratio: 16/9;
                    transition: transform 0.3s, box-shadow 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #374151;
                }
                .video-thumbnail-card:hover {
                    transform: scale(1.02);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .play-icon-overlay {
                    width: 60px;
                    height: 60px;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(4px);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }
                .video-thumbnail-card:hover .play-icon-overlay {
                    background: #ef4444; /* Red-500 */
                    transform: scale(1.1);
                }
             `;
             document.head.appendChild(styleSheet);
        }

        return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${resources.map(r => {
                const isVideo = r.type === 'video' || r.type === 'drive';
                
                // RENDER AS VIDEO THUMBNAIL CARD
                if (isVideo) {
                    return `
                    <div class="flex flex-col gap-2 group">
                        <div class="video-thumbnail-card group" onclick="dashboard.playVideo('${r.link}', '${r.title.replace(/'/g, "\\'")}')">
                            <div class="play-icon-overlay">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
                            <div class="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-medium">VIDÉO</div>
                        </div>
                        <div class="flex justify-between items-start px-1">
                             <div class="min-w-0">
                                <h4 class="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">${r.title}</h4>
                                <p class="text-xs text-gray-400">Lecture interne</p>
                             </div>
                             <button onclick="event.stopPropagation(); dashboard.deleteResource(${r.id})" class="text-gray-300 hover:text-red-500 transition-colors" title="Supprimer">
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
        if (url.includes('/folders/') || url.includes('drive.google.com/drive/u/')) {
            alert("Veuillez utiliser un lien vidéo spécifique.");
            return;
        }
        
        // Use the global video modal instance
        if (window.videoModal) {
            window.videoModal.open(url);
        } else {
            console.error("VideoModal not initialized");
        }
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

// Global helper function for adding videos
const dashboard = new InstructorClassDashboard();
window.dashboard = dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard.init();
    // Initialize Video Modal
    window.videoModal = new VideoModal();
});
