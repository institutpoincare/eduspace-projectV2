/**
 * DataManager (Client Side - Vanilla JS)
 * Se connecte au serveur Vanilla JS (port 3000)
 * Remplace tout usage de localStorage par des appels API
 */

//const API_URL = 'http://localhost:3001/api';
const API_URL = '/api'; // Use relative path to work with any IP/Hostname

class DataManager {
    constructor() {
        this.currentUser = null;
    }

    async init() {
        console.log('🔄 Connexion au serveur Vanilla JS...');
        try {
            await this.getAll('system_check'); // Simple test
            console.log('✅ Connecté au Backend Fichier JSON');
        } catch (e) {
            console.warn('⚠️ Backend non détecté sur le port 3000. Assurez-vous que node server.js est lancé.');
        }
    }

    // --- API CALLS GENERIC ---

    async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 
                'Content-Type': 'application/json'
            }
        };

        // Add Auth Token
        let token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
            // Fallback for legacy Google Auth sessions
            token = sessionStorage.getItem('authToken');
        }

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data) options.body = JSON.stringify(data);

        const res = await fetch(`${API_URL}/${endpoint}`, options);
        if (!res.ok) {
            if (res.status === 401) {
                console.warn("⚠️ Session expirée ou invalide (401). Redirection...");
                sessionStorage.clear();
                localStorage.clear();
                window.location.href = '../../pages/login-etudiant.html'; // Default redirect
                return null;
            }
            throw new Error(`Erreur API ${res.status}`);
        }
        if (res.status === 204) return null;
        return await res.json();
    }

    // --- CRUD ---

    async getAll(collection) {
        try {
            return await this.request(collection);
        } catch (e) { return []; }
    }

    async getById(collection, id) {
        try {
            return await this.request(`${collection}/${id}`);
        } catch (e) { return null; }
    }

    async create(collection, data) {
        return await this.request(collection, 'POST', data);
    }

    async update(collection, id, updates) {
        return await this.request(`${collection}/${id}`, 'PUT', updates);
    }

    async delete(collection, id) {
        return await this.request(`${collection}/${id}`, 'DELETE');
    }

    // --- AUTHENTIFICATION ---

    async login(email, password, role, rememberMe = false) {
        try {
            // On envoie au backend endpoint spécial 'login' qui vérifie dans la collection users
            // Note: Pour simplifier dans ce backend vanilla, on tape 'login' comme une collection virtuelle
            const res = await this.request('login', 'POST', { email, password, role });
            if (res && res.user) {
                if (res.user.role !== role) throw new Error("Role incorrect");
                this.currentUser = res.user;
                
                // Store Token
                if (res.token) {
                    if (rememberMe) {
                        localStorage.setItem('token', res.token);
                        localStorage.setItem('user', JSON.stringify(res.user));
                    } else {
                        sessionStorage.setItem('token', res.token);
                    }
                }

                // On garde en Session Storage juste pour ne pas perdre la connexion au F5
                sessionStorage.setItem('user', JSON.stringify(res.user));
                return res.user;
            }
        } catch (e) { console.error(e); throw e; }
        throw new Error("Identifiants invalides");
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '../../index.html';
    }

    // --- HELPER METHODS ---

    async getMessages() {
        return await this.getAll('messages');
    }

    async createMessage(messageData) {
        return await this.create('messages', messageData);
    }

    async updateMessage(messageId, updates) {
        return await this.update('messages', messageId, updates);
    }

    async getInstructors() {
        return await this.getAll('instructors');
    }

    async getCourses() {
        return await this.getAll('courses');
    }

    async getEnrollments() {
        return await this.getAll('enrollments');
    }

    generateId() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        // Check Session first
        let stored = sessionStorage.getItem('user');
        
        // If not in session, check Local (Remember Me)
        if (!stored) {
            stored = localStorage.getItem('user');
            // If found in local, sync to session but check if valid is hard from here without req
            if (stored) {
                sessionStorage.setItem('user', stored);
                // Assume token is in localStorage and request() picks it up
            }
        }

        if (stored) {
            this.currentUser = JSON.parse(stored);
            return this.currentUser;
        }
        return null;
    }
}

const dataManager = new DataManager();

// Auto-init si dans le navigateur
if (typeof window !== 'undefined') {
    window.dataManager = dataManager;
    document.addEventListener('DOMContentLoaded', () => dataManager.init());
}
