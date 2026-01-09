/**
 * Student Class Dashboard (Espace de la Classe)
 * Handles the logic for a specific single class view
 */

class StudentClassDashboard {
    constructor() {
        this.courseId = null;
        this.course = null;
        this.instructor = null;
        this.currentFolder = null; // null = root, 'supports' = inside supports folder
    }

    async init() {
        console.log('🎓 Initialisation Dashboard Classe');

        if (!window.dataManager) {
            console.error('DataManager non trouvé');
            return;
        }
        await dataManager.init();

        // Get ID from URL
        const params = new URLSearchParams(window.location.search);
        this.courseId = params.get('id');

        if (!this.courseId) {
            alert("Aucun cours spécifié");
            window.location.href = 'student-classes.html';
            return;
        }

        await this.loadData();
        this.render();
    }

    async loadData() {
        // Fetch Course
        this.course = await dataManager.getById('courses', this.courseId);
        
        if (!this.course) {
            console.error('Cours non trouvé');
            // Mock for dev if needed, or redirect
            return;
        }

        // --- FIX: READ FROM LOCAL STORAGE (Mirror Instructor Updates) ---
        const savedVideos = localStorage.getItem('class_recordings_' + this.courseId);
        if (savedVideos) {
            try {
                const parsedVideos = JSON.parse(savedVideos);
                if (parsedVideos && parsedVideos.length > 0) {
                    // Ensure resources array exists
                    if (!this.course.resources) this.course.resources = [];
                    
                    // Filter out existing videos to avoid duplicates if any
                    const nonVideoResources = this.course.resources.filter(r => r.type !== 'video' && r.type !== 'drive');
                    
                    // Merge
                    this.course.resources = [...nonVideoResources, ...parsedVideos];
                    console.log(`📥 ${parsedVideos.length} vidéos chargées depuis le stockage local.`);
                }
            } catch (e) {
                console.error("Erreur lecture localStorage:", e);
            }
        }
        // ---------------------------------------------------------------

        // Fetch Instructor
        if (this.course.instructorId) {
            this.instructor = await dataManager.getById('users', this.course.instructorId);
        }
    }

    render() {
        if (!this.course) return;

        // Update Page Title
        document.title = `${this.course.title} - Espace Classe`;

        // Main Container
        const container = document.getElementById('class-dashboard-container');
        if (!container) return;

        container.innerHTML = `
            ${this.renderHeader()}
            
            <div class="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full flex-1 overflow-hidden">
                <!-- Main Content (Resources & Recordings) -->
                <div class="flex-1 flex flex-col gap-6 overflow-y-auto">
                     ${this.renderResourcesSection()}
                </div>

                <!-- Sidebar (Schedule) -->
                <div class="w-full lg:w-80 shrink-0 space-y-6">
                    ${this.renderScheduleCard()}
                </div>
            </div>

            <!-- Video Modal - Glassmorphism Style -->
            <div id="video-modal" class="fixed inset-0 z-50 hidden backdrop-blur-sm bg-black/40 flex items-center justify-center p-4">
                <div class="relative w-full max-w-6xl h-[85vh] bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
                    <!-- Header with Gradient -->
                    <div class="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-violet-900/20 to-transparent flex items-center justify-between">
                        <h3 class="text-xl font-bold text-white flex items-center gap-3" id="modal-video-title">
                            <span class="text-2xl">📂</span>
                            <span>Cours Enregistrés</span>
                        </h3>
                        <button onclick="dashboard.closeVideo()" class="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                    
                    <!-- Content Area -->
                    <div class="relative flex-1 bg-transparent p-1 overflow-hidden" id="modal-video-container">
                        <!-- Iframe will be injected here -->
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
        
        // Trigger Recordings Render if enabled
        if (this.currentFolder === 'v-recordings') {
            const recordingsUrl = this.course.recordingsFolderUrl || this.course.recordingsFolder;
            renderRecordings(recordingsUrl);
        }
    }

    // --- LEGACY METHODS (Redirect to new player) ---
    playVideo(link, title) {
        if (!link) return;
        window.playInternalVideo(link, title);
    }

    closeVideo() {
        // Close any video popup
        const popup = document.getElementById('video-popup');
        if (popup) {
            popup.remove();
            document.body.style.overflow = 'auto';
        }
    }

    playDriveVideo(url, title = 'Lecture Vidéo') {
        window.playInternalVideo(url, title);
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
                        <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-100">
                            ${this.course.category || 'Classe'}
                        </span>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">${this.course.title}</h1>
                    <p class="text-gray-500 text-sm">avec ${this.instructor ? this.instructor.name : 'Votre Formateur'}</p>
                </div>

                <div class="flex items-center gap-4">
                    <button onclick="window.open('${this.course.meetLink || '#'}' , '_blank')" 
                        class="px-6 py-3 ${this.course.meetLink ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform active:scale-95">
                        <i data-lucide="video" class="w-5 h-5"></i>
                        Rejoindre le Live
                    </button>
                    <!-- Settings/More Actions could go here -->
                </div>
            </div>
        </header>
        `;
    }

    renderScheduleCard() {
        const schedule = this.course.schedule || [];
        
        let scheduleHtml = '';
        if (schedule.length === 0) {
            scheduleHtml = '<p class="text-gray-500 italic text-sm">Aucun horaire défini</p>';
        } else {
            // Sort logic could go here if needed, assumming string days for now or handle accordingly
            scheduleHtml = `
                <div class="space-y-3">
                    ${schedule.map(s => `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span class="font-bold text-gray-700 capitalize w-20">${s.day}</span>
                            <div class="flex items-center gap-2 text-sm text-gray-600 font-mono">
                                <i data-lucide="clock" class="w-3 h-3 text-gray-400"></i>
                                ${s.startTime} - ${s.endTime}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center gap-2 mb-4">
                <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <i data-lucide="calendar-clock" class="w-5 h-5"></i>
                </div>
                <h3 class="font-bold text-gray-900">Emploi du Temps</h3>
            </div>
            ${scheduleHtml}
            
            <div class="mt-4 pt-4 border-t border-gray-100">
                <p class="text-xs text-center text-gray-400">
                    Les horaires sont affichés en heure locale (Tunisie).
                </p>
            </div>
        </div>
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
            
            // 1. DYNAMIC "ENREGISTREMENTS" FOLDER CARD
            const recordingsFolderCard = `
                 <div class="relative group h-full">
                    <div class="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all duration-300 h-full group-hover:-translate-y-1" onclick="dashboard.openFolder('recordings-root')">
                        <div class="relative mb-3">
                            <div class="absolute inset-0 bg-indigo-400 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div class="relative p-4 bg-white text-indigo-600 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <i data-lucide="play-circle" class="w-8 h-8 fill-indigo-50 text-indigo-600"></i>
                            </div>
                        </div>
                        <h4 class="font-extrabold text-gray-900 group-hover:text-indigo-600 max-w-full truncate px-2 text-center text-lg transition-colors">Enregistrements</h4>
                        <div class="mt-2 px-3 py-1 bg-white/60 rounded-full border border-indigo-100 text-xs font-medium text-indigo-600">
                            ${allVideos.length} vidéos
                        </div>
                    </div>
                </div>
            `;

            // 2. DYNAMIC "DOCUMENTS" FOLDER CARD (New)
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

            // 3. STANDARD FOLDERS
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
                    </div>
                `;
            }).join('');

            content = `
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    ${recordingsFolderCard}
                    ${documentsFolderCard}
                    ${folderCards}
                </div>
            `;

        } else if (this.currentFolder === 'recordings-root') {
             // VIEW: RECORDINGS - UNIFIED SOURCE
             // We use allVideos to ensure consistency
            const listHTML = this.renderFilesList(allVideos);

            content = `
                 <div class="mb-4 flex items-center justify-between gap-4">
                    <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                    </button>
                </div>

                <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <i data-lucide="info" class="w-5 h-5 text-indigo-600 shrink-0 mt-0.5"></i>
                    <div class="text-sm text-indigo-800">
                        <p class="font-bold mb-1">Enregistrements du cours</p>
                        <p class="opacity-90">
                            Vous trouverez ici toutes les séances enregistrées et synchronisées par votre formateur.
                        </p>
                    </div>
                </div>
                
                <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <i data-lucide="play-circle" class="w-5 h-5 text-indigo-500"></i> Tous les enregistrements
                    <span class="text-xs font-normal text-gray-400 ml-2">(${allVideos.length})</span>
                </h3>
                
                ${listHTML}
            `;
        } else if (this.currentFolder === 'documents-root') {
            // VIEW: DOCUMENTS
             const listHTML = this.renderFilesList(allPdfs);

            content = `
                 <div class="mb-4 flex items-center justify-between gap-4">
                    <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 font-medium transition-colors">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                    </button>
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
                    </div>
                    <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <i data-lucide="folder-open" class="w-5 h-5 text-blue-500"></i> ${folder.name}
                    </h3>
                    ${this.renderFilesList(folderResources)}
                 `;
             }
        }

        return `
            <section id="resources-section" class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative animate-enter">
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
        if(resources.length === 0) return '<div class="text-center py-12 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">Dossier vide</div>';
        
        // POINCARÉ STYLE GRID
        return `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            ${resources.map((r, i) => {
                const isVideo = r.type === 'video' || r.type === 'drive';
                const isPdf = r.type === 'pdf' || r.type === 'drive-pdf';

                if (isVideo) {
                    // Fix 1: Robust URL Selection & Reconstruction (Same as Instructor)
                    let videoUrl = r.link || r.url || r.webViewLink;
                    
                    // Fallback: If no URL but we have an ID, assume it's a Drive ID
                    if (!videoUrl && r.id && isNaN(r.id)) {
                         videoUrl = `https://drive.google.com/file/d/${r.id}/preview`;
                    }
                    
                    videoUrl = videoUrl || '';
                    const safeTitle = (r.title || `Séance ${i+1}`).replace(/'/g, "\\'").replace(/"/g, '&quot;');

                    return `
                    <div onclick="openPoincareModal('${videoUrl}', '${safeTitle}', false)" 
                         class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all">
                         
                         <div class="h-44 bg-slate-900 flex items-center justify-center relative group-hover:bg-slate-800 transition-colors">
                            <div class="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                                <span class="text-white text-2xl font-bold">▶</span>
                            </div>
                            <span class="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] rounded font-bold uppercase tracking-wider">Vidéo</span>
                         </div>

                         <div class="p-4">
                            <h5 class="font-bold text-gray-800 line-clamp-1" title="${safeTitle}">${r.title || `Séance ${i+1}`}</h5>
                            <div class="flex items-center justify-between mt-3">
                                <p class="text-xs text-indigo-600 font-bold uppercase tracking-wide">Lecture Interne</p>
                                <p class="text-[10px] text-gray-400">${new Date(r.addedAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                         </div>
                    </div>`;
                }

                if (isPdf) {
                    let pdfUrl = r.link || r.url || r.webViewLink;
                    if (!pdfUrl && r.id && isNaN(r.id)) pdfUrl = `https://drive.google.com/file/d/${r.id}/preview`;
                    const safeTitle = (r.title || `Document PDF`).replace(/'/g, "\\'").replace(/"/g, '&quot;');

                    return `
                    <div onclick="openPoincareModal('${pdfUrl}', '${safeTitle}', true)" 
                         class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all">
                         
                         <div class="h-44 bg-amber-50 flex items-center justify-center relative group-hover:bg-amber-100 transition-colors">
                            <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-amber-200 group-hover:scale-110 transition-transform shadow-sm">
                                <span class="text-amber-500 font-bold"><i data-lucide="file-text" class="w-6 h-6"></i></span>
                            </div>
                            <span class="absolute bottom-3 right-3 px-2 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] rounded font-bold uppercase tracking-wider">PDF</span>
                         </div>

                         <div class="p-4">
                            <h5 class="font-bold text-gray-800 line-clamp-1" title="${safeTitle}">${r.title || `Document`}</h5>
                            <div class="flex items-center justify-between mt-3">
                                <p class="text-xs text-amber-600 font-bold uppercase tracking-wide">Lecture Interne</p>
                                <p class="text-[10px] text-gray-400">${new Date(r.addedAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                         </div>
                    </div>`;
                }

                // Standard File Card (unchanged)
                return `
                <div class="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer" onclick="window.open('${r.link}', '_blank')">
                    <div class="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors">
                        <i data-lucide="file-text" class="w-6 h-6"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">${r.title}</h4>
                        <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <i data-lucide="download-cloud" class="w-3 h-3"></i> Document externe
                        </p>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }

    openFolder(folderName) {
        this.currentFolder = folderName;
        // Re-render only the resources section? Ideally just re-render whole thing or specific part.
        // For simplicity, re-render whole dashboard or just update innerHTML of resources section if possible.
        // Let's re-render the section specifically to avoid flickering everything
        const sectionContainer = document.getElementById('resources-section').parentElement; 
        // Actually, easier to just call render() or splice innerHTML. 
        // Given the structure, render() is safe.
        this.render(); 
    }

    openRealFolder(id) {
        this.currentFolder = id;
        this.render();
    }

    renderRecordingsSection() {
        // This method is no longer used - recordings are handled in renderResourcesSection
        return '';
    }
}

// --- GLOBAL INTERNAL VIDEO PLAYER (Custom Popup) ---
// --- POINCARE STYLE MODAL (The Magic Fix) ---
// --- POINCARE STYLE MODAL (The Magic Fix) ---
// --- POINCARE STYLE MODAL (The Magic Fix) ---
// --- Added allowDownload parameter ---
window.openPoincareModal = (url, title, allowDownload = false) => {
    // 0. CHECK IF IT IS ACTUALLY A FOLDER
    if (url.includes('/folders/') || url.includes('drive.google.com/drive/u/')) {
        window.openDriveFolderModal(url);
        return;
    }

    console.log("🎬 Lecture Étudiant:", title, url, "Download:", allowDownload);

    // 1. EXTRACT ID (UNIVERSAL LOGIC)
    let fileId = null;
    const regex = /(?:\/d\/|id=|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    
    if (match && match[1]) {
        fileId = match[1];
    } else if (url.length > 20 && !url.includes('/')) {
        fileId = url; // Direct ID assumption
    }

    // 2. PREPARE EMBED URL
    let embedUrl = url;
    if (fileId) {
        embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (url.includes('youtube') || url.includes('youtu.be')) {
         // Keep youtube support
        let videoId = null;
        if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    // 3. CLEANUP & RENDER
    if (document.getElementById('video-modal')) document.getElementById('video-modal').remove();

    // Determine if it's a PDF to show download button
    let downloadBtn = '';
    
    // Only show download button if allowDownload is explicitly TRUE
    if (allowDownload && fileId) {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        downloadBtn = `
            <a href="${downloadUrl}" target="_blank" class="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-colors mr-2 border border-gray-700">
                <i data-lucide="download" class="w-4 h-4"></i> Télécharger
            </a>
        `;
    }

    const modalHTML = `
    <div id="video-modal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div class="relative w-full max-w-5xl aspect-video bg-black rounded-xl border border-gray-800 shadow-2xl flex flex-col">
            <div class="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800 relative z-30">
                <span class="text-white font-medium truncate pr-4">${title}</span>
                <div class="flex items-center">
                    ${downloadBtn}
                    <button onclick="document.getElementById('video-modal').remove()" class="text-white hover:text-red-500 font-bold p-2 transition-colors">✕</button>
                </div>
            </div>
            
            <div class="relative flex-1 w-full h-full group">
                <iframe src="${embedUrl}" class="w-full h-full border-0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
                
                <!-- POP-OUT BLOCKER: Transparent overlay to prevent clicking the Drive 'New Window' button -->
                <div class="absolute top-2 right-2 w-20 h-20 z-20 bg-transparent" onclick="event.preventDefault(); event.stopPropagation();" title="Lecture Interne Uniquement"></div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    // Re-init lucide icons for the new button
    if (window.lucide) window.lucide.createIcons();
};

// Keep alias for compatibility if needed
window.playInternalVideo = window.openPoincareModal;

// --- LEGACY PLAYER FUNCTIONS (Kept for backward compatibility) ---
window.playDriveVideo = (url, title = 'Lecture Vidéo') => {
    // Redirect to new internal player, DEFAULT NO DOWNLOAD
    window.openPoincareModal(url, title, false);
};

const dashboard = new StudentClassDashboard();
window.dashboard = dashboard;
document.addEventListener('DOMContentLoaded', () => dashboard.init());

window.playVideoPopup = (url, title) => {
    // Just delegate to the main unified function
    window.openPoincareModal(url, title);
};

// --- Function Popup Dossier Drive ---
// --- 2. MODAL FUNCTION (Forces Embed Mode) ---
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
                            <!-- VIDEO CARD -->
                            <div onclick="playVideoPopup('${video.url || ''}', '${(video.title || 'Vidéo').replace(/'/g, "\\'")}')" 
                                 class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-indigo-200 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                                
                                <!-- Thumbnail Area -->
                                <div class="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <!-- Simple Gradient Thumbnail -->
                                    <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900"></div>
                                    <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                    
                                    <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/30 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="text-white ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                    </div>
                                    
                                    <span class="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] rounded font-bold uppercase tracking-wider">Vidéo</span>
                                </div>

                                <!-- Info Area -->
                                <div class="p-4">
                                    <h4 class="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors h-10 leading-snug">${video.title}</h4>
                                    <div class="flex items-center justify-between text-xs text-gray-400">
                                        <span class="flex items-center gap-1"><i data-lucide="play-circle" class="w-3 h-3"></i> Lecture directe</span>
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
                <span class="flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Lecteur Interne</span>
             </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    // Re-init icons inside modal
    if(window.lucide) window.lucide.createIcons();
};

const renderRecordings = (driveFolderUrl) => {
    const container = document.getElementById('recordings-container');
    
    // Force clean container
    container.innerHTML = '';

    // Render the "Open Folder" Button
    container.innerHTML = `
    <div class="w-full p-4">
        <button onclick="openDriveFolderModal('${driveFolderUrl}')" 
                class="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 p-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-sm">
            <span>📂</span>
            Accéder au Dossier des Séances (Drive)
        </button>
    </div>`;
};

window.openDriveFolderModal = (url) => {
    // Extract ID (matches standard Drive Folders)
    const id = (url || "").match(/[-\w]{25,}/)?.[0];
    if (!id) return alert("Lien dossier invalide");

    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${id}#grid`;
    
    // Remove old modal if exists
    if(document.getElementById('drive-modal')) document.getElementById('drive-modal').remove();

    // Show new modal
    document.body.insertAdjacentHTML('beforeend', `
    <div id="drive-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <div class="bg-white w-full max-w-6xl h-[90vh] rounded-lg relative flex flex-col">
            <button onclick="document.getElementById('drive-modal').remove()" class="absolute -top-10 right-0 text-white font-bold p-2">FERMER ✕</button>
            <iframe src="${embedUrl}" class="flex-1 w-full border-0"></iframe>
        </div>
    </div>`);
};
