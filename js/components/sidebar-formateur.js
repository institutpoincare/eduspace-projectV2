// Instructor Sidebar Component - Tailwind Version
(function () {
    // Determine current page
    const currentPath = window.location.pathname;
    const items = [
        { href: 'dashboard.html', icon: 'layout-dashboard', label: 'Tableau de bord' },
        { href: 'classes.html', icon: 'users', label: 'Gestion des Classes' },
        { href: 'calendar.html', icon: 'calendar', label: 'Mon Calendrier' },
        { href: 'outils.html', icon: 'wrench', label: 'Outils Pédagogiques' },
        { href: 'live.html', icon: 'folder-plus', label: 'Dépôt de Cours' },
        { href: 'enregistre.html', icon: 'file-video', label: 'Contenu Enregistré' },
        { href: 'mediatheque.html', icon: 'folder-open', label: 'Ma Médiathèque' },
        { href: 'paiements.html', icon: 'dollar-sign', label: 'Paiements' },
        { href: 'profile.html', icon: 'user-circle', label: 'Profil' },
        { href: 'messages.html', icon: 'mail', label: 'Messages', badge: true }
    ];

    const generateNavItems = () => {
        // Get unread messages count from localStorage
        const unreadCount = parseInt(localStorage.getItem('unreadMessagesCount') || '0');
        
        return items.map(item => {
            let isActive = currentPath.includes(item.href);
            if (item.href === 'classes.html' && currentPath.includes('class-details.html')) {
                isActive = true;
            }

            const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium mb-1 relative";
            const activeClass = "bg-blue-600 text-white shadow-lg shadow-blue-200";
            const inactiveClass = "text-gray-500 hover:bg-blue-50 hover:text-blue-600";

            const badgeHtml = item.badge && unreadCount > 0 
                ? `<span class="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">${unreadCount > 9 ? '9+' : unreadCount}</span>` 
                : '';

            return `
                <a href="${item.href}" class="${baseClass} ${isActive ? activeClass : inactiveClass}" title="${item.label}">
                    <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                    <span>${item.label}</span>
                    ${badgeHtml}
                </a>
            `;
        }).join('');
    };

    const sidebarHTML = `
        <div class="flex flex-col h-full bg-white border-r border-gray-100 p-6">
            <div class="flex items-center gap-3 mb-10 px-2">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <i data-lucide="graduation-cap" class="w-6 h-6"></i>
                </div>
                <div>
                    <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">EduSpace</span>
                    <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest">Formateur</span>
                </div>
            </div>

            <nav class="flex-1 space-y-1">
                <div class="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-4 mt-2">Menu Principal</div>
                ${generateNavItems()}
            </nav>

            <div class="mt-auto pt-6 border-t border-gray-100">
                <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.href='../../index.html'" 
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium border border-transparent hover:border-red-100">
                    <i data-lucide="log-out" class="w-5 h-5"></i>
                    <span>Se déconnecter</span>
                </button>
            </div>
        </div>
    `;

    const container = document.getElementById('sidebar-container');
    if (container) {
        container.innerHTML = sidebarHTML;
        if (window.lucide) window.lucide.createIcons();
    }
})();
