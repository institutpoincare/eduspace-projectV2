// Navbar Component
(function () {
    const navbarHTML = `
        <div class="navbar">
            <div class="container navbar-content">
                <a href="${getPath('index.html')}" class="logo">EduSpace</a>
                <nav class="nav-links">
                    <a href="${getPath('index.html')}">Accueil</a>
                    <a href="${getPath('pages/catalogue.html')}">Catalogue</a>
                    <a href="${getPath('pages/login-etudiant.html')}">Tableau de Bord</a>
                </nav>
                <div class="nav-actions">
                    <a href="${getPath('pages/login-choix.html')}" class="btn-link">Connexion</a>
                    <a href="${getPath('pages/inscription-choix.html')}" class="btn btn-primary">Inscription</a>
                </div>
            </div>
        </div>
    `;

    function getPath(path) {
        const currentPath = window.location.pathname;
        // Check if we are in a subdirectory (pages/)
        if (currentPath.includes('/pages/')) {
            // Count how many levels deep: /pages/etudiant/ -> 2 levels -> ../../
            // Simple heuristic: if in pages/, add ../
            // But we need to be careful.
            // If path starts with pages/, and we are in pages/, we remove pages/ from target and add ../ ?? 
            // No, easier:

            // Target: pages/catalogue.html
            // Current: pages/catalogue.html (depth 1)
            // relative: catalogue.html? No, we want to go from pages/FOO to pages/BAR.

            // Method: Absolute Path Fallback if served, otherwise simplistic relative.

            // If we are in 'pages/' depth (1 level deep from root)
            const isInPages = currentPath.includes('/pages/') && !currentPath.includes('/pages/etudiant/') && !currentPath.includes('/pages/formateur/') && !currentPath.includes('/pages/entreprise/') && !currentPath.includes('/pages/parent/');

            // If we are in 'pages/etudiant/' etc (2 levels deep)
            const isTwoDeep = currentPath.includes('/pages/etudiant/') || currentPath.includes('/pages/formateur/') || currentPath.includes('/pages/entreprise/') || currentPath.includes('/pages/parent/');

            let prefix = '';
            if (isTwoDeep) prefix = '../../';
            else if (isInPages) prefix = '../';

            return prefix + path;
        }
        return path;
    }

    const navbarStyles = `
        <style>
            .navbar {
                background: white;
                border-bottom: 1px solid var(--gray-200);
                padding: 1rem 0;
                position: sticky;
                top: 0;
                z-index: 100;
            }
            
            .navbar-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .logo {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--blue-600);
                text-decoration: none;
            }
            
            .nav-links {
                display: flex;
                gap: 2rem;
            }
            
            .nav-links a {
                color: var(--gray-600);
                text-decoration: none;
                font-weight: 500;
                transition: color 0.3s;
            }
            
            .nav-links a:hover {
                color: var(--blue-600);
            }
            
            .nav-actions {
                display: flex;
                gap: 1rem;
                align-items: center;
            }
            
            .btn-link {
                color: var(--gray-600);
                text-decoration: none;
                font-weight: 500;
            }
            
            @media (max-width: 768px) {
                .nav-links {
                    display: none;
                }
            }
        </style>
    `;

    // Insert navbar
    document.addEventListener('DOMContentLoaded', function () {
        const navbarContainer = document.getElementById('navbar');
        if (navbarContainer) {
            // Add styles
            const styleElement = document.createElement('div');
            styleElement.innerHTML = navbarStyles;
            document.head.appendChild(styleElement.querySelector('style'));

            // Add HTML
            navbarContainer.innerHTML = navbarHTML;
        }
    });
})();
