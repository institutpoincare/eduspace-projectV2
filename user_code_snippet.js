
// --- FIX: USER PROVIDED CLEAN LOGIC ---
// Added at the end to ensure overrides and global access

window.recordings = []; // Ensure it exists

window.renderRecordings = (videos) => {
    // Adapter to use the existing dashboard render logic if possible, 
    // or manually render into the container assuming the user's HTML structure.
    
    if (window.dashboard && document.getElementById('recordings-container')) {
        const html = window.dashboard.renderFilesList(videos);
        document.getElementById('recordings-container').innerHTML = html;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } else if (window.dashboard) {
        // Fallback
        console.log("Rendering via Dashboard Render");
        window.dashboard.render();
    }
};

window.openFolder = (folderId, folderName) => {
    console.log("📂 Ouvrir dossier:", folderName);
    
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
                    <p class="text-gray-500 mb-4">Aucune vidéo chargée.</p>
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
    console.log("⬅️ Retour aux dossiers");
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
