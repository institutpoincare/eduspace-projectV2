/**
 * Student Profile - Dynamic Logic
 */

class StudentProfile {
    constructor() {
        this.currentUser = null;
        this.parentCode = null;
    }

    async init() {
        console.log('👤 Initialisation Profil Étudiant');
        await dataManager.init();

        // Get current user
        const user = sessionStorage.getItem('user');
        if (user) {
            this.currentUser = JSON.parse(user);
        } else {
            window.location.href = '../../pages/login-etudiant.html';
            return;
        }

        await this.loadProfile();
        this.setupEventListeners();
        
        console.log('✅ Profil chargé');
    }

    async loadProfile() {
        try {
            // Get full user data from database
            const userData = await dataManager.getById('users', this.currentUser.id);
            
            if (userData) {
                this.currentUser = { ...this.currentUser, ...userData };
                this.renderProfile();
            }
        } catch (error) {
            console.error('❌ Erreur chargement profil:', error);
            // Still render with session data
            this.renderProfile();
        }
    }

    renderProfile() {
        // Extract name parts
        const nameParts = this.currentUser.name ? this.currentUser.name.split(' ') : ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const initials = this.getInitials(this.currentUser.name);

        // Update profile header
        const initialsElement = document.querySelector('.w-24.h-24 > div, .w-24.h-24');
        if (initialsElement && initialsElement.textContent.trim().length <= 3) {
            initialsElement.childNodes[0].textContent = initials;
        }
        
        const nameHeader = document.querySelector('.text-2xl.font-bold.text-gray-900');
        if (nameHeader) nameHeader.textContent = this.currentUser.name || 'Utilisateur';
        
        // Update form fields
        const firstNameInput = document.getElementById('profile-firstname');
        const lastNameInput = document.getElementById('profile-lastname');
        const emailInput = document.querySelector('input[type="email"]');
        const phoneInput = document.getElementById('profile-phone');
        const levelSelect = document.getElementById('profile-level');

        if (firstNameInput) firstNameInput.value = firstName;
        if (lastNameInput) lastNameInput.value = lastName;
        if (emailInput) emailInput.value = this.currentUser.email || '';
        if (phoneInput) phoneInput.value = this.currentUser.phone || '';
        if (levelSelect && this.currentUser.level) {
            levelSelect.value = this.currentUser.level;
        }

        // Generate parent code
        this.parentCode = this.generateParentCode();
        const codeElement = document.querySelector('code.text-2xl');
        if (codeElement) {
            codeElement.textContent = this.parentCode;
        }
    }

    getInitials(name) {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    generateParentCode() {
        // Generate a unique parent code based on user ID
        const userId = this.currentUser.id || 'unknown';
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const code = `STU-${hash.toString().substring(0, 4)}-${String.fromCharCode(65 + (hash % 26))}${String.fromCharCode(65 + ((hash * 2) % 26))}`;
        return code;
    }

    setupEventListeners() {
        // Save profile button
        const saveBtn = document.getElementById('btn-save-profile');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfile());
        } else {
             console.error("Save Button not found! Check HTML ID 'btn-save-profile'");
        }

        // Change password button
        const passwordBtn = document.querySelector('#section-security button.bg-gray-900');
        if (passwordBtn) {
            passwordBtn.addEventListener('click', () => this.changePassword());
        }

        // Copy code button
        const copyBtn = document.querySelector('button[title="Copier"]');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyParentCode());
        }
    }

    async saveProfile() {
        try {
            const firstNameInput = document.getElementById('profile-firstname');
            const lastNameInput = document.getElementById('profile-lastname');
            const phoneInput = document.getElementById('profile-phone');
            const levelSelect = document.getElementById('profile-level');

            const firstName = firstNameInput?.value || '';
            const lastName = lastNameInput?.value || '';
            const fullName = `${firstName} ${lastName}`.trim();

            const updates = {
                name: fullName,
                phone: phoneInput?.value || '',
                level: levelSelect?.value || ''
            };

            await dataManager.update('users', this.currentUser.id, updates);
            
            // Update session
            this.currentUser = { ...this.currentUser, ...updates };
            sessionStorage.setItem('user', JSON.stringify(this.currentUser));

            // Refresh UI (Header name, etc.)
            this.renderProfile();

            this.showNotification('Profil mis à jour avec succès !', 'success');
            console.log('Profile saved!');
        } catch (error) {
            console.error('❌ Erreur sauvegarde profil:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    async changePassword() {
        const inputs = document.querySelectorAll('#section-security input[type="password"]');
        const oldPassword = inputs[0]?.value;
        const newPassword = inputs[1]?.value;
        const confirmPassword = inputs[2]?.value;

        if (!oldPassword || !newPassword || !confirmPassword) {
            this.showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }

        try {
            // In a real app, verify old password first
            await dataManager.update('users', this.currentUser.id, {
                password: newPassword
            });

            // Clear inputs
            inputs.forEach(input => input.value = '');
            
            this.showNotification('Mot de passe mis à jour avec succès !', 'success');
        } catch (error) {
            console.error('❌ Erreur changement mot de passe:', error);
            this.showNotification('Erreur lors du changement de mot de passe', 'error');
        }
    }

    copyParentCode() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.parentCode).then(() => {
                this.showNotification('Code copié dans le presse-papiers !', 'success');
            }).catch(() => {
                this.fallbackCopy();
            });
        } else {
            this.fallbackCopy();
        }
    }

    fallbackCopy() {
        const textarea = document.createElement('textarea');
        textarea.value = this.parentCode;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            this.showNotification('Code copié !', 'success');
        } catch (err) {
            this.showNotification('Impossible de copier le code', 'error');
        }
        document.body.removeChild(textarea);
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        
        notification.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i>
            <span class="font-medium">${message}</span>
        `;

        document.body.appendChild(notification);
        lucide.createIcons();

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

const studentProfile = new StudentProfile();
document.addEventListener('DOMContentLoaded', () => {
    studentProfile.init();
});
