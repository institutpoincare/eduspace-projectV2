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

// ===== GLOBAL BACK BUTTON FUNCTIONALITY =====
window.goBack = function() {
    // Check if there's history to go back to
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Fallback: go to dashboard based on user role
        const user = utils.getCurrentUser();
        if (user) {
            if (user.role === 'formateur' || user.role === 'instructor') {
                window.location.href = '/pages/formateur/dashboard.html';
            } else if (user.role === 'etudiant' || user.role === 'student') {
                window.location.href = '/pages/etudiant/dashboard.html';
            } else if (user.role === 'parent') {
                window.location.href = '/pages/parent/dashboard.html';
            } else {
                window.location.href = '/index.html';
            }
        } else {
            window.location.href = '/index.html';
        }
    }
};

// Auto-initialize back buttons on page load
document.addEventListener('DOMContentLoaded', function() {
    // Find all elements with data-back-btn attribute
    const backButtons = document.querySelectorAll('[data-back-btn]');
    backButtons.forEach(btn => {
        btn.addEventListener('click', window.goBack);
    });
});
