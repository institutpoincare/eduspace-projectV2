const sidebarHTML = `
<aside class="sidebar fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col transition-all duration-300 w-[280px]">
    <!-- Logo -->
    <div class="p-6 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <i data-lucide="layout-dashboard" class="w-6 h-6"></i>
        </div>
        <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 sidebar-text">
            EduSpace
        </span>
    </div>

    <!-- Toggle Button -->
    <button onclick="toggleSidebar()" class="absolute -right-3 top-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm text-gray-500 hover:text-blue-600 transition-colors z-50 hidden lg:flex">
        <i data-lucide="chevron-left" class="w-4 h-4 transition-transform duration-300" id="sidebar-toggle-icon"></i>
    </button>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-4 sidebar-text">
            Menu Parent
        </div>

        <a href="dashboard.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="layout" class="w-5 h-5 group-hover:text-blue-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Tableau de bord</span>
        </a>

        <a href="eleves.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="users" class="w-5 h-5 group-hover:text-purple-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Mes Enfants</span>
        </a>

        <a href="paiements.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="credit-card" class="w-5 h-5 group-hover:text-orange-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Paiements</span>
        </a>

        <a href="messages.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="message-square" class="w-5 h-5 group-hover:text-green-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Messages</span>
        </a>

        <div class="h-px bg-gray-100 my-4 mx-4"></div>

        <a href="profil.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="settings" class="w-5 h-5 group-hover:text-gray-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Paramètres</span>
        </a>
    </nav>

    <!-- User Profile -->
    <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
                PA
            </div>
            <div class="flex-1 min-w-0 sidebar-text">
                <p class="text-sm font-bold text-gray-900 truncate">Parent Demo</p>
                <p class="text-xs text-gray-500 truncate">Espace Parents</p>
            </div>
            <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.href='../../index.html'" class="p-1 hover:bg-gray-100 rounded-lg transition-colors" title="Se déconnecter">
                <i data-lucide="log-out" class="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors sidebar-text"></i>
            </button>
        </div>
    </div>
</aside>
`;

// Inject Sidebar
const sidebarContainer = document.getElementById('sidebar-container');
if (sidebarContainer) {
    sidebarContainer.innerHTML = sidebarHTML;
} else {
    console.error('Sidebar container not found!');
}

// Set Active Link
const currentPath = window.location.pathname;
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    if (item.getAttribute('href') === currentPath.split('/').pop()) {
        item.classList.add('bg-blue-50', 'text-blue-600');
    }
});

// Sidebar Toggle Logic
function toggleSidebar() {
    const body = document.body;
    const isCollapsed = body.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebar-collapsed', isCollapsed);

    // Update icon
    const icon = document.getElementById('sidebar-toggle-icon');
    if (icon) {
        if (isCollapsed) {
            icon.classList.remove('rotate-0');
            icon.classList.add('rotate-180');
        } else {
            icon.classList.remove('rotate-180');
            icon.classList.add('rotate-0');
        }
    }
}

// Restore state
document.addEventListener('DOMContentLoaded', () => {
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
        const icon = document.getElementById('sidebar-toggle-icon');
        if (icon) {
            icon.classList.add('rotate-180');
        }
    }
    if (window.lucide) {
        lucide.createIcons();
    }
});
