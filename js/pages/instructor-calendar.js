/**
 * Instructor Calendar - Gestion Dynamique du Calendrier
 */

class InstructorCalendar {
    constructor() {
        this.currentInstructor = null;
        this.sessions = [];
    }

    async init() {
        console.log('📅 Initialisation du Calendrier Formateur');
        await dataManager.init();

        this.currentInstructor = dataManager.getCurrentUser();
        if (!this.currentInstructor || this.currentInstructor.role !== 'formateur') {
            window.location.href = '../login.html';
            return;
        }

        this.updateHeader();
        await this.loadSessions();
    }

    updateHeader() {
        const userName = this.currentInstructor.name || 'Formateur';
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

        // On cherche l'élément du header pour les initiales
        const initialsElement = document.querySelector('.h-10.w-10.rounded-full.bg-white.flex.items-center.justify-center');
        if (initialsElement) initialsElement.textContent = initials;
    }

    async loadSessions() {
        try {
            // Dans un vrai projet, on chargerait les sessions liées aux cours du formateur
            const allCourses = await dataManager.getAll('courses');
            const myCourses = allCourses.filter(c => c.instructorId === this.currentInstructor.id);

            // Simulation de sessions basées sur les cours
            this.sessions = [];
            myCourses.forEach(course => {
                if (course.schedule) {
                    // Logique pour transformer le planning en sessions réelles sur le calendrier
                }
            });

            this.renderCalendar();
        } catch (error) {
            console.error('❌ Erreur chargement sessions:', error);
        }
    }

    renderCalendar() {
        // Le calendrier est souvent complexe (FullCalendar ou autre)
        // Ici on va juste s'assurer que les données affichées sont cohérentes
        console.log('🎨 Rendu du calendrier pour:', this.currentInstructor.name);
    }
}

const instructorCalendar = new InstructorCalendar();
document.addEventListener('DOMContentLoaded', () => instructorCalendar.init());
