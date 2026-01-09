/**
 * Google OAuth Authentication Helper
 * Gère la connexion avec Google pour tous les types d'utilisateurs
 */

class GoogleAuthManager {
    constructor() {
        this.apiUrl = window.location.origin;
    }

    /**
     * Initier la connexion Google
     * @param {string} role - Le rôle de l'utilisateur (etudiant, formateur, parent, entreprise)
     */
    async loginWithGoogle(role) {
        try {
            // Demander l'URL d'autorisation au backend
            const response = await fetch(`${this.apiUrl}/api/auth/google/login?role=${role}`);
            const data = await response.json();

            if (data.authUrl) {
                // Rediriger vers Google pour l'authentification
                window.location.href = data.authUrl;
            } else {
                throw new Error('Impossible de générer l\'URL d\'authentification');
            }
        } catch (error) {
            console.error('Erreur lors de la connexion Google:', error);
            throw error;
        }
    }

    /**
     * Gérer le retour de Google (callback)
     * Appelé automatiquement sur la page de dashboard après redirection
     */
    handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const authMethod = urlParams.get('auth');
        const error = urlParams.get('error');

        if (error) {
            console.error('Erreur d\'authentification:', error);
            alert('Erreur lors de la connexion avec Google. Veuillez réessayer.');
            return false;
        }

        if (token && authMethod === 'google') {
            // Stocker le token en sessionStorage
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('authToken', token); // Legacy support

            // If user object is passed directly in URL (Optional optimization)
            const userData = urlParams.get('user');
            if (userData) {
                try {
                    const userObj = JSON.parse(decodeURIComponent(userData));
                    sessionStorage.setItem('user', JSON.stringify(userObj));
                    console.log("✅ تمت عملية الدخول بنجاح:", userObj.name);
                } catch (e) { console.error('Error parsing user data from URL', e); }
            } else {
                // Décoder le token pour obtenir les infos utilisateur
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    sessionStorage.setItem('user', JSON.stringify({
                        id: payload.id,
                        name: payload.name,
                        email: payload.email,
                        role: payload.role,
                        avatar: payload.avatar // Ajouter l'avatar s'il existe
                    }));
                } catch (e) {
                    console.error('Erreur lors du décodage du token:', e);
                    return false;
                }
            }

            // Nettoyer l'URL (enlever les paramètres)
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // Payload is not available here if userData was used, so check logic
            // But for safety let's just log success general
            console.log('✅ Connexion Google réussie');
            return true;
        }

        return false;
    }

    /**
     * Déconnexion
     */
    async logout() {
        try {
            await fetch(`${this.apiUrl}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            // Nettoyer le sessionStorage
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            
            // Rediriger vers la page d'accueil
            window.location.href = '/index.html';
        }
    }

    /**
     * Vérifier si l'utilisateur est connecté
     */
    isAuthenticated() {
        return !!sessionStorage.getItem('token');
    }
    /**
     * Obtenir l'utilisateur actuel
     */
    getCurrentUser() {
        const userStr = sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
}

// Instance globale
window.googleAuth = new GoogleAuthManager();

// Auto-handle callback on load if params exist
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are returning from Google
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('token') && urlParams.get('auth') === 'google') {
        window.googleAuth.handleCallback();
        // Force DataManager user update just in case
        if (window.dataManager) {
            window.dataManager.currentUser = window.googleAuth.getCurrentUser();
        }
    }
});
