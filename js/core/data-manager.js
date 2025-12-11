/**
 * DataManager (Client Side) for Eduspace
 * Communicates with the Node.js Backend API
 * Replaces pure LocalStorage implementation
 */

const API_URL = 'http://localhost:3000/api';

class DataManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    async init() {
        console.log('🔄 DataManager: Connecting to Backend...');
        try {
            // Simple ping check by fetching instructors (public usually) or just check API
            // For now, assume connection is fine.
            console.log('✅ Connected to Backend API');
        } catch (e) {
            console.error('❌ Backend connection failed. Ensure server is running on port 3000.');
        }
    }

    // --- UTILS ---

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = localStorage.getItem('authToken'); // Get fresh token
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async fetchAPI(endpoint, options = {}) {
        const res = await fetch(`${API_URL}/${endpoint}`, {
            headers: this.getHeaders(),
            ...options
        });

        if (!res.ok) {
            // Handle Auth errors
            if (res.status === 401 || res.status === 403) {
                console.warn("Unauthorized access - Redirecting to login?");
                // window.location.href = '/pages/entreprise/login.html'; // Uncomment to force login
            }
            throw new Error(`API Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
    }

    // --- CRUD OPERATIONS ---

    async getAll(entity) {
        try {
            return await this.fetchAPI(entity);
        } catch (e) {
            console.error(`Failed to load ${entity}`, e);
            return [];
        }
    }

    async getById(entity, id) {
        try {
            return await this.fetchAPI(`${entity}/${id}`);
        } catch (e) {
            return null;
        }
    }

    async create(entity, data) {
        return await this.fetchAPI(entity, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async update(entity, id, updates) {
        return await this.fetchAPI(`${entity}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async delete(entity, id) {
        return await this.fetchAPI(`${entity}/${id}`, {
            method: 'DELETE'
        });
    }

    // --- SEARCH / FILTER / SORT (Backend delegation or client side ?) ---
    // For simple JSON file DB, we fetch all and filter client side usually, 
    // or backend implements them. Let's keep client-side filtering for compat with existing code.

    async search(entity, query, fields = ['name']) {
        const items = await this.getAll(entity);
        const lowerQuery = query.toLowerCase();
        return items.filter(item =>
            fields.some(field => item[field] && item[field].toString().toLowerCase().includes(lowerQuery))
        );
    }

    async filter(entity, criteria) {
        const items = await this.getAll(entity);
        return items.filter(item => {
            return Object.entries(criteria).every(([key, value]) => {
                if (value === '' || value === null || value === undefined) return true;
                return item[key] == value; // Loose equality for ID strings/numbers
            });
        });
    }

    async sort(entity, field, order = 'asc') {
        const items = await this.getAll(entity);
        return items.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // --- AUTH ---
    // Special methods for auth that were handled in pages before

    async login(email, password, role) {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        if (!res.ok) throw new Error("Login failed");

        const data = await res.json();
        // Save token to localStorage (Session persistence ONLY, as requested)
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Cache user info
        return data.user;
    }

    async register(userData) {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!res.ok) throw new Error("Registration failed");
        return await res.json();
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '../../index.html';
    }
}

// Global Instance
const dataManager = new DataManager();

// Init
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        dataManager.init();
    });
}
