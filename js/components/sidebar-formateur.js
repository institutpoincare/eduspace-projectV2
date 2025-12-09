// Instructor Sidebar Component
(function () {
    // Determine current page
    const currentPath = window.location.pathname;
    const items = [
        { href: 'dashboard.html', icon: 'layout-dashboard', label: 'Tableau de bord' },
        { href: 'classes.html', icon: 'users', label: 'Gestion des Classes' },
        { href: 'calendar.html', icon: 'calendar', label: 'Mon Calendrier' },
        { href: 'live.html', icon: 'video', label: 'Création Contenu Live' },
        { href: 'enregistre.html', icon: 'file-video', label: 'Contenu Enregistré' },
        { href: 'mediatheque.html', icon: 'folder-open', label: 'Ma Médiathèque' },
        { href: 'paiements.html', icon: 'dollar-sign', label: 'Paiements' }
    ];

    const generateNavItems = () => {
        return items.map(item => {
            let isActive = currentPath.includes(item.href);
            // Special case for class details -> keeps Classes active
            if (item.href === 'classes.html' && currentPath.includes('class-details.html')) {
                isActive = true;
            }
            return `
                <a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}" title="${item.label}">
                    <i data-lucide="${item.icon}"></i>
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');
    };

    const sidebarHTML = `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-logo">
                <div style="background: linear-gradient(to right, var(--blue-600), var(--blue-500)); padding: 0.5rem; border-radius: 0.5rem; color: white; display: flex; align-items: center; justify-content: center; min-width: 32px;">
                    <i data-lucide="graduation-cap" style="width: 20px; height: 20px;"></i>
                </div>
                <span style="font-size: 1.25rem; font-weight: 700; color: var(--gray-900);">EduSpace</span>
                <button onclick="toggleSidebar()" class="sidebar-toggle-btn" style="margin-left: auto; background: none; border: none; cursor: pointer; color: var(--gray-400); padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                    <i data-lucide="panel-left-close" style="width: 20px; height: 20px;"></i>
                </button>
            </div>

            <nav class="sidebar-nav">
                <div class="menu-title" style="font-size: 0.75rem; font-weight: 600; color: var(--gray-400); text-transform: uppercase; padding: 0 1rem 0.5rem;">Menu Principal</div>
                ${generateNavItems()}
            </nav>

            <div class="sidebar-footer">
                <div class="user-info" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <div class="avatar" style="background: linear-gradient(to right, var(--blue-500), var(--purple-500)); color: white; min-width: 40px;">IN</div>
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-weight: 700; font-size: 0.875rem; color: var(--gray-900);">Instructeur</div>
                        <div style="font-size: 0.75rem; color: var(--gray-500);">Enseignant</div>
                    </div>
                </div>
                
                <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.href='../../index.html'" style="width: 100%; padding: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: 1px solid var(--red-200); background: white; color: var(--red-700); border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; font-weight: 500;">
                    <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
                    <span>Se déconnecter</span>
                </button>
            </div>
        </aside>
    `;

    // Initialize State
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState === 'true') {
        document.body.classList.add('sidebar-collapsed');
    }

    // Define Toggle Function Globally
    window.toggleSidebar = function () {
        document.body.classList.toggle('sidebar-collapsed');
        const isCollapsed = document.body.classList.contains('sidebar-collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed);

        // Optional: Update icon logic if needed visually, but simpler is fine
    };

    // document.write(sidebarHTML);
    const container = document.getElementById('sidebar-container');
    if (container) {
        container.innerHTML = sidebarHTML;
        // Re-run Lucide to render new icons
        if (window.lucide) window.lucide.createIcons();
    } else {
        console.error('Sidebar Container not found!');
    }
})();
