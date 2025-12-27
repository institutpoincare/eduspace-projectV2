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
            Menu Étudiant
        </div>

        <a href="catalogue.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="shopping-bag" class="w-5 h-5 group-hover:text-pink-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Catalogue</span>
        </a>

        <a href="dashboard.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="layout" class="w-5 h-5 group-hover:text-blue-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Tableau de bord</span>
        </a>

        <a href="mes-cours.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="book-open" class="w-5 h-5 group-hover:text-purple-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Mes Cours</span>
        </a>

        <a href="live.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="video" class="w-5 h-5 group-hover:text-red-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Direct</span>
        </a>

        <a href="schedule.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="calendar" class="w-5 h-5 group-hover:text-green-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Emploi du temps</span>
        </a>

        <a href="mes-profs.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="graduation-cap" class="w-5 h-5 group-hover:text-indigo-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Mes Profs</span>
        </a>

        <a href="messages.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group relative">
            <i data-lucide="mail" class="w-5 h-5 group-hover:text-teal-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Messages</span>
            <span data-notification-badge="messages" class="hidden absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">0</span>
        </a>

         <a href="paiements.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="credit-card" class="w-5 h-5 group-hover:text-orange-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Paiements</span>
        </a>

        <div class="h-px bg-gray-100 my-4 mx-4"></div>

        <a href="profil.html" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group">
            <i data-lucide="user" class="w-5 h-5 group-hover:text-blue-600 group-hover:scale-110 transition-all"></i>
            <span class="font-medium group-hover:text-gray-900 sidebar-text">Mon Profil</span>
        </a>
    </nav>

    <!-- User Profile -->
    <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                AM
            </div>
            <div class="flex-1 min-w-0 sidebar-text">
                <p class="text-sm font-bold text-gray-900 truncate">Ahmed Mani</p>
                <p class="text-xs text-gray-500 truncate">Étudiant</p>
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

    // Update user info dynamically
    try {
        const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            
            // Update avatar initials
            const avatarDiv = sidebarContainer.querySelector('.w-10.h-10.rounded-full');
            if (avatarDiv && user.name) {
                const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                avatarDiv.textContent = initials;
            }

            // Update name
            const nameP = sidebarContainer.querySelector('.text-sm.font-bold');
            if (nameP && user.name) {
                nameP.textContent = user.name;
            }

            // Hide catalogue for enterprise students
            if (user.role === 'etudiant_entreprise') {
                const navItems = sidebarContainer.querySelectorAll('.nav-item');
                navItems.forEach(item => {
                    if (item.getAttribute('href').includes('catalogue')) {
                        item.style.display = 'none';
                    }
                });
            }
        }
    } catch (e) { 
        console.error('Error loading user info:', e); 
    }

} else {
    console.error('Sidebar container not found!');
}

// Set Active Link
const currentPath = window.location.pathname;
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    if (item.getAttribute('href') === currentPath.split('/').pop()) {
        item.classList.add('bg-blue-50', 'text-blue-600');
        const icon = item.querySelector('i');
        if (icon) {
            // Remove specific hover colors for active state to keep it consistent
            // actually let's just let the CSS handle it or force a color
            // For simplicity, let's just rely on the class addition
        }
    }
});

// Sidebar Toggle Logic (Copied from formateur for consistency)
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

    // Re-render icons because we injected HTML
    if (window.lucide) {
        lucide.createIcons();
    }
});
