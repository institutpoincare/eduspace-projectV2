// --- CONFIGURATION ---
const CLIENT_ID = '646023168754-34h0jj0g5hhnbeq1i7uh7vq1napapkdt.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let accessToken = null;

// API Object expected by the Dashboard
window.teacherDrive = {
    mount: function() {
        console.log("TeacherDrive Mounted");
        this.setupListeners();
    },
    
    setupListeners: function() {
        // Handle Sidebar Button
        const sidebarBtn = document.getElementById('connect-drive-btn');
        if (sidebarBtn) {
            // Remove old listeners by cloning
            const newBtn = sidebarBtn.cloneNode(true);
            sidebarBtn.parentNode.replaceChild(newBtn, sidebarBtn);
            
            newBtn.addEventListener('click', () => {
                this.triggerAuth();
            });
            
            // Allow re-connection if already "connected" in UI but we want to refresh
            newBtn.classList.remove('hidden'); 
        }

        // Handle generic Auth Button if present
        const authBtn = document.getElementById('google-auth-btn');
        if (authBtn) {
             authBtn.addEventListener('click', () => {
                this.triggerAuth();
            });
        }
    },

    triggerAuth: function() {
        if (!tokenClient) {
            alert("Librairie Google encore en chargement... Réessayez dans 2 secondes.");
            return;
        }
        
        if (accessToken === null) {
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            tokenClient.requestAccessToken({prompt: ''});
        }
    },
    
    // Stub methods to prevent errors if called by old code
    syncNow: async function() { alert("Utilisez le bouton 'Drive' dans le dossier pour importer."); },
    configureFolder: async function() { alert("Non nécessaire avec le nouveau système."); }
};

// 1. Initialisation
window.addEventListener('load', function() {
    // const previousOnLoad = window.onload; // REMOVED TO FIX STACK OVERFLOW
    // if (typeof previousOnLoad === 'function') previousOnLoad();

    if (typeof google === 'undefined') {
        console.error("Google Library not loaded!");
        return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error !== undefined) {
                console.error("Erreur Auth:", response);
                return;
            }
            accessToken = response.access_token;
            console.log("✅ Authentification réussie!");
            
            // Update UI to show connected state
            const statusBadge = document.getElementById('drive-status-badge');
            if(statusBadge) {
                statusBadge.textContent = 'Connecté';
                statusBadge.className = 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold';
            }
            
            // Fetch Files
            fetchDriveFiles(); 
        },
    });
});

// 3. Fetch Files Logic
// --- CONFIGURATION: LIER UN DOSSIER DRIVE SPÉCIFIQUE ---
window.configureDriveFolder = () => {
    // 1. نطلبو الرابط من البروف
    const folderLink = prompt("Collez le lien du dossier Drive pour cette classe :\n(Ex: drive.google.com/drive/folders/1AbC...)");
    
    if (!folderLink) return;

    // 2. نستخرجو ID الدوسي (Regex)
    // يقبل الصيغ: /folders/ID أو ?id=ID
    let folderId = null;
    const match = folderLink.match(/\/folders\/([a-zA-Z0-9_-]+)/) || folderLink.match(/id=([a-zA-Z0-9_-]+)/);
    
    if (match) {
        folderId = match[1];
    } else {
        // بالكشي البروف حط ID ديركت
        if (folderLink.length > 20 && !folderLink.includes('/')) {
            folderId = folderLink;
        }
    }

    if (!folderId) {
        alert("Lien invalide. Veuillez coller le lien d'un dossier Google Drive.");
        return;
    }

    // 3. نسجلو الـ ID مربوط بالكلاس هذا برك (Unique per Class)
    const classId = new URLSearchParams(window.location.search).get("id") || 'default';
    localStorage.setItem('linked_folder_id_' + classId, folderId);
    
    alert("✅ Dossier lié avec succès ! Cliquez maintenant sur 'Connecter le Compte' pour synchroniser.");
};

// --- FIX: SYNC CIBLÉE (PAR DOSSIER) ---
async function fetchDriveFiles() {
    // 1. نثبتو الساعة: فماشي دوسي مربوط بالكلاس هذا؟
    const classId = new URLSearchParams(window.location.search).get("id") || 'default';
    const targetFolderId = localStorage.getItem('linked_folder_id_' + classId);

    if (!targetFolderId) {
        // كان ما فماش، نقلو يربط دوسي الساعة
        if(confirm("Aucun dossier Drive n'est lié à cette classe.\nVoulez-vous configurer un dossier maintenant ?")) {
            window.configureDriveFolder();
        }
        return; // نقصو الحديث هنا
    }

    try {
        console.log(`📂 Synchronisation depuis le dossier ID: ${targetFolderId}`);

        // 2. الفيلتر الجديد: نزيدو شرط 'parents' باش نجيبو كان ولاد الدوسي هذا
        // q = "ID in parents" AND "video" AND "not trashed"
        const q = `'${targetFolderId}' in parents and mimeType contains 'video/' and trashed = false`;
        const fields = "files(id, name, webViewLink, thumbnailLink)";
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}`, 
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
        const data = await response.json();
        const folderVideos = data.files;

        // 3. التنظيف والحفظ (نفس اللوجيك متاع Miroir)
        const newVideos = folderVideos.map(v => ({
            id: v.id,
            title: v.name,
            url: `https://drive.google.com/file/d/${v.id}/preview`,
            type: 'drive',
            addedAt: new Date().toISOString()
        }));

        // نفسخو القديم متاع Drive (تنظيف)
        let currentList = window.recordings || [];
        const manualVideos = currentList.filter(v => v.type !== 'drive');

        // نحطو الجديد
        window.recordings = [...manualVideos, ...newVideos];
        localStorage.setItem('class_recordings_' + classId, JSON.stringify(window.recordings));

        if (typeof renderRecordings === 'function') renderRecordings(window.recordings);
        
        // Add integration with Dashboard if present
        if (window.dashboard) {
             window.dashboard.driveRecordings = newVideos; // Update internals
             // Optionally trigger a render or save if dashboard expects it
             if(typeof window.dashboard.render === 'function') window.dashboard.render();
        }
        
        alert(`✅ ${newVideos.length} vidéos synchronisées depuis le dossier spécifique.`);

    } catch (err) {
        console.error('Erreur:', err);
        alert("Erreur de synchronisation. Vérifiez que le dossier est partagé/accessible.");
    }
}
