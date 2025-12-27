/**
 * Instructor Media Library - Gestion Dynamique de la Médiathèque
 */

class InstructorMedia {
    constructor() {
        this.currentInstructor = null;
        this.files = [];
    }

    async init() {
        console.log('📂 Initialisation de la Médiathèque Formateur');
        await dataManager.init();

        this.currentInstructor = dataManager.getCurrentUser();
        if (!this.currentInstructor || this.currentInstructor.role !== 'formateur') {
            window.location.href = '../login.html';
            return;
        }

        this.updateHeader();
        await this.loadFiles();
    }

    updateHeader() {
        const userName = this.currentInstructor.name || 'Formateur';
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

        const initialsElement = document.querySelector('.h-10.w-10.rounded-full.bg-white.flex.items-center.justify-center');
        if (initialsElement) initialsElement.textContent = initials;
    }

    async loadFiles() {
        try {
            // Simulation de fichiers
            this.files = [
                { id: 1, name: 'Support de cours Python.pdf', type: 'pdf', size: '2.4 MB', date: '12 Déc 2023' },
                { id: 2, name: 'Exercices Algorithmique.docx', type: 'doc', size: '1.1 MB', date: '10 Déc 2023' },
                { id: 3, name: 'Video Intro Data Science.mp4', type: 'video', size: '45 MB', date: '08 Déc 2023' }
            ];

            this.renderFiles();
        } catch (error) {
            console.error('❌ Erreur chargement fichiers:', error);
        }
    }

    renderFiles() {
        const container = document.getElementById('files-container') || document.querySelector('.grid.grid-cols-1.md:grid-cols-2.lg:grid-cols-4.gap-6');
        if (!container) return;

        // On garde le design statique pour l'instant mais on pourrait le rendre dynamique ici
    }
}

const instructorMedia = new InstructorMedia();
document.addEventListener('DOMContentLoaded', () => instructorMedia.init());
