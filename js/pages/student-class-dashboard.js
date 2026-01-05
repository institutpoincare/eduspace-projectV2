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
        const resources = this.course.resources || [];
        const recordingsUrl = this.course.recordingsFolderUrl || this.course.recordingsFolder;
        
        // Filter Data
        // Includes: pdf, doc, text
        const pdfResources = resources.filter(r => ['file-text', 'pdf', 'doc'].includes(r.type));
        
        // Everything else (videos, links, zips, generic drive) goes to the Main Resource Folder
        const otherResources = resources.filter(r => !['file-text', 'pdf', 'doc', 'recording'].includes(r.type));

        let content = '';

        if (this.currentFolder === null) {
            // ROOT VIEW: 3 MAIN FOLDERS
            const recordings = this.course.recordings || [];
            
            content = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
                    <!-- Folder 1: Enregistrements (Séances) -->
                    <div onclick="dashboard.openFolder('v-recordings')" class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 cursor-pointer transition-all group flex flex-col items-center text-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <i data-lucide="monitor-play" class="w-8 h-8 text-red-600"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg group-hover:text-red-700">Enregistrements</h3>
                            <p class="text-xs text-gray-500 mt-1">${recordings.length} vidéos</p>
                        </div>
                    </div>

                    <!-- Folder 2: Supports de Cours (PDFs from 'resources' with type pdf) -->
                    <div onclick="dashboard.openFolder('v-pdf')" class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 cursor-pointer transition-all group flex flex-col items-center text-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                            <i data-lucide="file-text" class="w-8 h-8 text-green-600"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg group-hover:text-green-700">Supports PDF</h3>
                            <p class="text-xs text-gray-500 mt-1">${pdfResources.length} documents</p>
                        </div>
                    </div>

                    <!-- Folder 3: Ressources Diverses (Others) -->
                    <div onclick="dashboard.openFolder('v-resources')" class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group flex flex-col items-center text-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <i data-lucide="box" class="w-8 h-8 text-blue-600"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg group-hover:text-blue-700">Ressources & Liens</h3>
                            <p class="text-xs text-gray-500 mt-1">${otherResources.length + (this.course.folders || []).length} éléments</p>
                        </div>
                    </div>
                </div>
            `;
        } 
        else if (this.currentFolder === 'v-recordings') {
             // VIEW: RECORDINGS (Iframe via renderRecordings)
             content = `
                 <div class="mb-6 flex flex-col items-start">
                    <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors mb-4">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour à l'accueil
                    </button>
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-red-100 rounded-lg"><i data-lucide="monitor-play" class="w-6 h-6 text-red-600"></i></div>
                        <h2 class="text-2xl font-bold text-gray-900">Enregistrements des Séances</h2>
                    </div>
                </div>
                <div id="recordings-container" class="w-full min-h-[400px]">Chargement...</div>
            `;
        }
        else if (this.currentFolder === 'v-resources') {
            // VIEW: OTHER RESOURCES + SUBFOLDERS
            const folders = this.course.folders || [];

            content = `
                <div class="mb-6">
                    <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour à l'accueil
                    </button>
                    <h2 class="text-2xl font-bold text-gray-900 mt-4 flex items-center gap-3">
                        <div class="p-2 bg-blue-100 rounded-lg"><i data-lucide="box" class="w-6 h-6 text-blue-600"></i></div>
                        Ressources & Liens
                    </h2>
                </div>

                ${folders.length > 0 ? `
                <div class="mb-6">
                    <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Dossiers</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${folders.map(f => `
                        <div class="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-300 cursor-pointer transition-all group" onclick="dashboard.openRealFolder('${f.id}')">
                            <i data-lucide="folder" class="w-10 h-10 text-blue-200 group-hover:text-blue-500 fill-current mb-2"></i>
                            <span class="font-bold text-gray-700 group-hover:text-blue-700 text-center text-sm line-clamp-1">${f.name}</span>
                        </div>`).join('')}
                    </div>
                </div>` : ''}

                <div>
                     <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Fichiers Divers</h3>
                     ${this.renderFilesList(otherResources)}
                </div>
            `;
        }

        else if (this.currentFolder === 'v-pdf') {
            // VIEW: PDF ONLY
            content = `
                <div class="mb-6">
                    <button onclick="dashboard.openFolder(null)" class="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 font-medium transition-colors">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour à l'accueil
                    </button>
                    <h2 class="text-2xl font-bold text-gray-900 mt-4 flex items-center gap-3">
                        <div class="p-2 bg-green-100 rounded-lg"><i data-lucide="file-text" class="w-6 h-6 text-green-600"></i></div>
                        Supports de Cours (PDF)
                    </h2>
                </div>
                ${this.renderFilesList(pdfResources)}
            `;
        }
        else if (this.currentFolder) {
             // VIEW: REAL SUB-FOLDER (Inside v-resources logic essentially, but technically separate id)
             // We need a back button that goes to 'v-resources' probably? Or Root? 
             // Let's go Root for simplicity, or we can track history.
             const folder = (this.course.folders || []).find(f => f.id === this.currentFolder);
             if(folder) {
                 const folderResources = resources.filter(r => r.folderId === folder.id);
                 content = `
                    <div class="mb-6">
                        <button onclick="dashboard.openFolder('v-resources')" class="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour aux Ressources
                        </button>
                        <h2 class="text-2xl font-bold text-gray-900 mt-4 flex items-center gap-3">
                            <i data-lucide="folder-open" class="w-6 h-6 text-blue-400"></i>
                            ${folder.name}
                        </h2>
                    </div>
                    ${this.renderFilesList(folderResources)}
                 `;
             }
        }

        return `
            <section id="resources-section" class="animate-enter">
                ${content}
            </section>
        `;
    }

    // Helper for Real Folders
    openRealFolder(id) {
        this.openFolder(id);
    }

    renderFilesList(resources) {
        if(resources.length === 0) return '<p class="text-gray-400 italic">Dossier vide</p>';
        
        return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
            ${resources.map(r => {
                const isVideo = r.type === 'video' || r.type === 'drive';
                const icon = isVideo ? 'play-circle' : 'file-text';
                const color = isVideo ? 'purple' : 'red';
                const action = isVideo ? `dashboard.playVideo('${r.link}', '${r.title.replace(/'/g, "\\'")}')` : `window.open('${r.link}', '_blank')`;
                
                // Different layout for video? User liked the big cards.
                if(isVideo) {
                    return `
                        <div class="flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-purple-300 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer" onclick="${action}">
                            <div class="aspect-video bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors relative overflow-hidden">
                                <i data-lucide="${icon}" class="w-12 h-12 relative z-10 group-hover:scale-110 transition-transform"></i>
                                <div class="absolute inset-0 bg-gradient-to-tr from-purple-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div class="min-w-0">
                                <h4 class="font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight">${r.title}</h4>
                                <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <i data-lucide="monitor-play" class="w-3 h-3"></i> Vidéo
                                </p>
                            </div>
                        </div>
                    `;
                } else {
                     return `
                        <div class="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-red-200 hover:shadow-md transition-all group cursor-pointer" onclick="${action}">
                            <div class="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors">
                                <i data-lucide="${icon}" class="w-6 h-6"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">${r.title}</h4>
                                <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <i data-lucide="download-cloud" class="w-3 h-3"></i> Document
                                </p>
                            </div>
                            <button class="text-gray-400 group-hover:text-blue-600">
                                <i data-lucide="download" class="w-5 h-5"></i>
                            </button>
                        </div>
                    `;
                }
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
window.playInternalVideo = (driveUrl, title = 'Lecture Vidéo') => {
    // 1. Intelligent URL Conversion to "Preview" (Embeddable)
    let previewUrl = driveUrl;

    // Google Drive
    if (driveUrl.includes('drive.google.com')) {
        const idMatch = driveUrl.match(/[-\w]{25,}/);
        if (idMatch) {
            // Convert to /preview which allows embedding and avoids layout
            previewUrl = `https://drive.google.com/file/d/${idMatch[0]}/preview`;
        } else {
            // Fallback
             previewUrl = driveUrl.replace(/\/view.*/, '/preview').replace(/\/edit.*/, '/preview');
        }
    }
    // YouTube
    else if (driveUrl.includes('youtube.com') || driveUrl.includes('youtu.be')) {
        let videoId = null;
        if (driveUrl.includes('v=')) videoId = driveUrl.split('v=')[1].split('&')[0];
        else if (driveUrl.includes('youtu.be/')) videoId = driveUrl.split('youtu.be/')[1].split('?')[0];
        
        if (videoId) previewUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    // 2. Remove existing
    const existingPopup = document.getElementById('video-popup');
    if (existingPopup) existingPopup.remove();

    // 3. Create the Glass Modal
    const modalHTML = `
    <div id="video-popup" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div class="relative w-full max-w-6xl bg-slate-900/95 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col" style="max-height: 90vh;">
            
            <!-- Header -->
            <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/40 to-transparent">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">🎥</span>
                    <h3 class="text-lg font-bold text-white">${title}</h3>
                </div>
                <button onclick="document.getElementById('video-popup').remove(); document.body.style.overflow = 'auto';" 
                        class="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <!-- Video Player -->
            <div class="flex-1 bg-black relative" style="aspect-ratio: 16/9;">
                <iframe 
                    src="${previewUrl}" 
                    class="absolute inset-0 w-full h-full border-0" 
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media" 
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    allowfullscreen
                    frameborder="0">
                </iframe>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
};

// --- LEGACY PLAYER FUNCTIONS (Kept for backward compatibility) ---
window.playDriveVideo = (url, title = 'Lecture Vidéo') => {
    // Redirect to new internal player
    window.playInternalVideo(url, title);
};

const dashboard = new StudentClassDashboard();
window.dashboard = dashboard;
document.addEventListener('DOMContentLoaded', () => dashboard.init());

window.playVideoPopup = (url, title) => {
    // 0. Safety Check
    if (!url || url === 'undefined' || url === 'null') {
        alert("Lien vidéo invalide ou manquant.");
        return;
    }

    // 1. Convert /view to /preview (CRITICAL)
    let embedUrl = url;
    if (url.includes('drive.google.com')) {
        embedUrl = url.replace(/\/view.*/, '/preview').replace(/\/edit.*/, '/preview');
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Basic Youtube Handler
        let videoId = null;
        if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    // 2. Remove old modal
    const existing = document.getElementById('video-modal');
    if (existing) existing.remove();

    // 3. Inject Glass Modal
    const modalHTML = `
    <div id="video-modal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div class="relative w-full max-w-6xl aspect-video bg-black rounded-xl border border-gray-700 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div class="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800">
                <h3 class="text-white font-bold truncate flex items-center gap-2"><span class="text-lg">🎬</span> ${title}</h3>
                <button onclick="document.getElementById('video-modal').remove()" class="text-gray-400 hover:text-red-400 font-bold p-2 transition-colors">✕ FERMER</button>
            </div>
            <iframe src="${embedUrl}" class="w-full h-full" allow="autoplay; fullscreen" frameborder="0"></iframe>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
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
