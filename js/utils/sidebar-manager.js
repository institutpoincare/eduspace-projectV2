let isSidebarOpen = true;

// Toggle Sidebar Logic
window.toggleSidebar = () => {
    isSidebarOpen = !isSidebarOpen;
    const sidebar = document.getElementById('course-sidebar');
    const mainContent = document.getElementById('main-content-area');
    const toggleBtnIcon = document.querySelector('#sidebar-toggle-btn i');

    if (sidebar && mainContent) {
        if (isSidebarOpen) {
            // Open State
            sidebar.classList.remove('w-0', 'border-0');
            sidebar.classList.add('w-full', 'lg:w-96', 'border-l');
            if (toggleBtnIcon) {
                toggleBtnIcon.setAttribute('data-lucide', 'panel-right-close');
                // Force Lucide to re-render the icon
                lucide.createIcons();
            }
        } else {
            // Closed State
            sidebar.classList.remove('w-full', 'lg:w-96', 'border-l');
            sidebar.classList.add('w-0', 'border-0');
            if (toggleBtnIcon) {
                 toggleBtnIcon.setAttribute('data-lucide', 'panel-right-open');
                 lucide.createIcons();
            }
        }
    }
};
