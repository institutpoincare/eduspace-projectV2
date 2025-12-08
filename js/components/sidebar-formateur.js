// Instructor Sidebar Component
(function () {
    const sidebarHTML = `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-logo">
                <div style="background: linear-gradient(to right, var(--blue-600), var(--blue-500)); padding: 0.5rem; border-radius: 0.5rem; color: white;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <path d="M3 9h18"/>
                        <path d="M9 21V9"/>
                    </svg>
                </div>
                <span style="font-size: 1.25rem; font-weight: 700; color: var(--gray-900);">EduSpace</span>
            </div>

            <nav class="sidebar-nav">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--gray-400); text-transform: uppercase; padding: 0 1rem 0.5rem;">Menu Principal</div>
                
                <a href="dashboard.html" class="nav-item active">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Accueil
                </a>
                
                <a href="#" class="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Gestion des Classes
                </a>
                
                <a href="#" class="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Mon Calendrier
                </a>
                
                <a href="#" class="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    Création Contenu Live
                </a>
                
                <a href="#" class="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                    Contenu Enregistré
                </a>

                <a href="#" class="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    Paiements
                </a>
            </nav>

            <div class="sidebar-footer">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <div class="avatar" style="background: linear-gradient(to right, var(--blue-500), var(--purple-500)); color: white;">IN</div>
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-weight: 700; font-size: 0.875rem; color: var(--gray-900);">Instructeur</div>
                        <div style="font-size: 0.75rem; color: var(--gray-500);">Enseignant</div>
                    </div>
                </div>
                
                <button onclick="window.eduspace.utils.logout()" style="width: 100%; padding: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: 1px solid var(--red-200); background: white; color: var(--red-700); border-radius: 0.5rem; cursor: pointer; transition: all 0.2s;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Se déconnecter
                </button>
            </div>
        </aside>
    `;

    document.write(sidebarHTML);
})();
