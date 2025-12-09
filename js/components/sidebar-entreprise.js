// Define Menu Structure
const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'layout-dashboard', href: 'dashboard.html' }, // Href will be dynamic
    { id: 'employes', label: 'Employés', icon: 'users', href: 'employes.html' },
    { id: 'instructors', label: 'Instructeurs', icon: 'user-check', href: 'instructors.html' },
    { id: 'formations', label: 'Formations', icon: 'graduation-cap', href: 'formations.html' },
    { id: 'classes', label: 'Classes', icon: 'layout-grid', href: 'classes.html' },
    { id: 'statistiques', label: 'Rapports', icon: 'bar-chart-2', href: 'rapports.html' },
    { id: 'facturation', label: 'Facturation', icon: 'receipt', href: 'facturation.html' },
    { id: 'inscription', label: 'Inscription', icon: 'user-plus', href: 'inscription.html' },
    { id: 'parametres', label: 'Paramètres', icon: 'settings', href: 'parametres.html' }
];

// Define Permissions
const rolePermissions = {
    'gerant': ['dashboard', 'employes', 'instructors', 'formations', 'classes', 'statistiques', 'facturation', 'inscription', 'parametres'],
    'admin': ['dashboard', 'employes', 'instructors', 'classes', 'facturation', 'inscription', 'parametres'],
    'commercial': ['dashboard', 'statistiques', 'inscription', 'facturation', 'parametres'],
    'formateur': ['dashboard', 'classes', 'formations', 'parametres'],
    // Fallback
    'default': ['dashboard']
};

// Define Dashboard Links per Role
const dashboardLinks = {
    'gerant': 'dashboard.html',
    'admin': 'dashboard-admin.html',
    'commercial': 'dashboard-commercial.html',
    'formateur': 'dashboard-formateur.html'
};

function getSidebarHTML() {
    // Get User Role
    let role = 'gerant'; // Default
    let userName = 'Utilisateur';
    let userRoleLabel = 'Entreprise';

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // Role format expected: 'entreprise_role' or just 'role'
            // We strip 'entreprise_' prefix if present
            const fullRole = user.role || '';
            const strippedRole = fullRole.replace('entreprise_', '');

            // Validate against our keys
            if (rolePermissions[strippedRole]) {
                role = strippedRole;
            }

            if (user.name) userName = user.name;
            userRoleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        }
    } catch (e) {
        console.error('Error reading user from localStorage', e);
    }

    // Filter Items
    const allowedIds = rolePermissions[role] || rolePermissions['default'];
    // Special handling for Dashboard Link
    const dashboardHref = dashboardLinks[role] || 'dashboard.html';

    // Generate Nav HTML
    const navHTML = menuItems
        .filter(item => allowedIds.includes(item.id))
        .map(item => {
            // Override href for dashboard
            const href = item.id === 'dashboard' ? dashboardHref : item.href;

            return `
            <a href="${href}" class="nav-item flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-all group" data-id="${item.id}">
                <i data-lucide="${item.icon}" class="w-5 h-5 group-hover:text-indigo-600 group-hover:scale-110 transition-all"></i>
                <span class="font-medium group-hover:text-gray-900 sidebar-text">${item.label}</span>
            </a>
            `;
        })
        .join('');

    return `
<aside class="sidebar fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col transition-all duration-300 w-[280px]">
    <!-- Logo -->
    <div class="p-6 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <i data-lucide="building-2" class="w-6 h-6"></i>
        </div>
        <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 sidebar-text">
            EduCorp
        </span>
    </div>

    <!-- Toggle Button -->
    <button onclick="toggleSidebar()" class="absolute -right-3 top-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm text-gray-500 hover:text-indigo-600 transition-colors z-50 hidden lg:flex">
        <i data-lucide="chevron-left" class="w-4 h-4 transition-transform duration-300" id="sidebar-toggle-icon"></i>
    </button>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-4 sidebar-text">
            Gestion ${userRoleLabel}
        </div>
        
        ${navHTML}
        
    </nav>

    <!-- User Profile -->
    <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold shadow-md">
                ${userName.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0 sidebar-text">
                <p class="text-sm font-bold text-gray-900 truncate">${userName}</p>
                <p class="text-xs text-gray-500 truncate">${userRoleLabel}</p>
            </div>
            <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.href='../../index.html'" class="p-1 hover:bg-gray-100 rounded-lg transition-colors" title="Se déconnecter">
                <i data-lucide="log-out" class="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors sidebar-text"></i>
            </button>
        </div>
    </div>
</aside>
`;
}

// Inject Sidebar
const sidebarContainer = document.getElementById('sidebar-container');
if (sidebarContainer) {
    sidebarContainer.innerHTML = getSidebarHTML();
} else {
    console.error('Sidebar container not found!');
}

// Set Active Link
const currentPath = window.location.pathname.split('/').pop();
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    // Exact match or loosely match if strictly needed
    if (item.getAttribute('href') === currentPath) {
        item.classList.add('bg-indigo-50', 'text-indigo-600');
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
