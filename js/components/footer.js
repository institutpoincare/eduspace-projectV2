// Footer Component
(function () {
    const footerHTML = `
        <div class="footer">
            <div class="container footer-content">
                <div class="footer-section">
                    <h3>EduSpace</h3>
                    <p>La plateforme de formation en ligne qui connecte formateurs et apprenants tunisiens</p>
                </div>
                <div class="footer-section">
                    <h4>Liens Rapides</h4>
                    <ul>
                        <li><a href="/index.html">Accueil</a></li>
                        <li><a href="#catalogue">Catalogue</a></li>
                        <li><a href="#about">À propos</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Rôles</h4>
                    <ul>
                        <li><a href="/pages/login-formateur.html">Formateur</a></li>
                        <li><a href="/pages/login-etudiant.html">Étudiant</a></li>
                        <li><a href="/pages/login-parent.html">Parent</a></li>
                        <li><a href="/pages/login-entreprise.html">Entreprise</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Contact</h4>
                    <p>Email: contact@eduspace.tn</p>
                    <p>Tél: +216 XX XXX XXX</p>
                </div>
            </div>
            <div class="footer-bottom">
                <div class="container">
                    <p>&copy; 2024 EduSpace. Tous droits réservés.</p>
                </div>
            </div>
        </div>
    `;

    const footerStyles = `
        <style>
            .footer {
                background: var(--gray-900);
                color: white;
                margin-top: 4rem;
            }
            
            .footer-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 2rem;
                padding: 3rem 1.5rem;
            }
            
            .footer-section h3 {
                color: var(--blue-400);
                margin-bottom: 1rem;
            }
            
            .footer-section h4 {
                margin-bottom: 1rem;
                font-size: 1.1rem;
            }
            
            .footer-section p {
                color: var(--gray-400);
                line-height: 1.6;
            }
            
            .footer-section ul {
                list-style: none;
            }
            
            .footer-section ul li {
                margin-bottom: 0.5rem;
            }
            
            .footer-section ul li a {
                color: var(--gray-400);
                text-decoration: none;
                transition: color 0.3s;
            }
            
            .footer-section ul li a:hover {
                color: var(--blue-400);
            }
            
            .footer-bottom {
                border-top: 1px solid var(--gray-800);
                padding: 1.5rem;
                text-align: center;
            }
            
            .footer-bottom p {
                color: var(--gray-500);
                font-size: 0.9rem;
            }
        </style>
    `;

    // Insert footer
    document.addEventListener('DOMContentLoaded', function () {
        const footerContainer = document.getElementById('footer');
        if (footerContainer) {
            // Add styles
            const styleElement = document.createElement('div');
            styleElement.innerHTML = footerStyles;
            document.head.appendChild(styleElement.querySelector('style'));

            // Add HTML
            footerContainer.innerHTML = footerHTML;
        }
    });
})();
