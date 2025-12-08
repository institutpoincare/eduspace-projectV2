// Main JavaScript file
console.log('EduSpace Vanilla JS - Loaded');

// Simple router for SPA-like navigation (optional)
function navigate(url) {
    window.location.href = url;
}

// Utility functions
const utils = {
    // Get from localStorage
    getStorage: function (key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    },

    // Set to localStorage
    setStorage: function (key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    // Remove from localStorage
    removeStorage: function (key) {
        localStorage.removeItem(key);
    },

    // Check if user is logged in
    isLoggedIn: function () {
        return this.getStorage('user') !== null;
    },

    // Get current user
    getCurrentUser: function () {
        return this.getStorage('user');
    },

    // Logout
    logout: function () {
        this.removeStorage('user');
        navigate('/index.html');
    }
};

// Make utils globally available
window.eduspace = {
    utils: utils,
    navigate: navigate
};
