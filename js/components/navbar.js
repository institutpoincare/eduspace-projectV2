// Navbar Component
(function () {
    const navbarHTML = `
        <div class="navbar">
            <div class="container navbar-content">
                <a href="/index.html" class="logo">EduSpace</a>
                <nav class="nav-links">
                    <a href="/index.html">Accueil</a>
                    <a href="#catalogue">Catalogue</a>
                    <a href="#tableau-bord">Tableau de Bord</a>
                    <a href="#mes-cours">Mes Cours</a>
                </nav>
                <div class="nav-actions">
                    <a href="/pages/login-etudiant.html" class="btn-link">Connexion</a>
                    <a href="/pages/login-etudiant.html" class="btn btn-primary">Inscription</a>
                </div>
            </div>
        </div>
    `;

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
