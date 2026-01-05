/**
 * Student Classes - Dynamic Logic
 */

class StudentClasses {
    constructor() {
        this.currentStudent = null;
        this.myClasses = [];
        this.allClasses = [];
    }

    async init() {
        console.log('👥 Initialisation Mes Classes');
        await dataManager.init();

        // Get current user
        const user = sessionStorage.getItem('user');
        if (user) {
            this.currentStudent = JSON.parse(user);
        } else {
            window.location.href = '../../pages/login-etudiant.html';
            return;
        }

        console.log('👤 Étudiant connecté:', this.currentStudent.name, 'ID:', this.currentStudent.id);

        await this.loadMyClasses();
        this.renderClasses();
        this.updateStats();
        this.initializeSearch();
    }

    async loadMyClasses() {
        try {
            // Load enrollments and courses from the unified collections
            const allEnrollments = await dataManager.getAll('enrollments');
            const allCourses = await dataManager.getAll('courses');
            
            console.log('📋 Total enrollments:', allEnrollments.length);

            // Filter my active enrollments
            const myEnrollments = allEnrollments.filter(e => 
                e.studentId === this.currentStudent.id && e.status === 'active'
            );
            console.log('✅ Mes enrollments:', myEnrollments.length);

            // Map to class objects
            this.myClasses = await Promise.all(
                myEnrollments.map(async (enrollment) => {
                    const course = allCourses.find(c => c.id === enrollment.courseId);
                    
                    // Only include if found and is of type 'class'
                    if (!course || course.type !== 'class') return null;

                    // Get instructor info
                    const instructor = await dataManager.getById('users', course.instructorId);
                    
                    // Format scheduler string if array
                    let scheduleStr = 'Horaire non défini';
                    if (Array.isArray(course.schedule) && course.schedule.length > 0) {
                        scheduleStr = course.schedule.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ');
                    } else if (typeof course.schedule === 'string') {
                        scheduleStr = course.schedule;
                    }

                    return {
                        id: course.id,
                        name: course.title, // Map title to name
                        subject: course.subject || course.category,
                        description: course.description,
                        schedule: scheduleStr,
                        room: 'En ligne', // Default for now
                        meetLink: course.meetLink,
                        studentCount: course.students ? (course.students.enrolled ? course.students.enrolled.length : 0) : 0,
                        instructorName: instructor ? instructor.name : 'Instructeur',
                        instructorImage: instructor ? instructor.image : null,
                        enrollment: enrollment
                    };
                })
            );

            // Filter out nulls (courses not found or not of type 'class')
            this.myClasses = this.myClasses.filter(c => c !== null);
            console.log('🏫 Classes chargées:', this.myClasses.length);

        } catch (error) {
            console.error('❌ Erreur chargement classes:', error);
            this.myClasses = [];
        }
    }

    renderClasses() {
        const container = document.getElementById('classes-container');
        const emptyState = document.getElementById('empty-state');

        if (this.myClasses.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        emptyState.classList.add('hidden');

        container.innerHTML = this.myClasses.map(classData => {
            const initials = classData.instructorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const schedule = classData.schedule || 'Horaire non défini';
            const room = classData.room || 'Salle non définie';
            const studentCount = classData.studentCount || 0;

            return `
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1">
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                ${classData.name}
                            </h3>
                            <p class="text-sm text-gray-500">${classData.subject || 'Matière'}</p>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            ${initials}
                        </div>
                    </div>

                    <!-- Info -->
                    <div class="space-y-3 mb-4">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i data-lucide="user" class="w-4 h-4 text-gray-400"></i>
                            <span>${classData.instructorName}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i data-lucide="clock" class="w-4 h-4 text-gray-400"></i>
                            <span>${schedule}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i data-lucide="map-pin" class="w-4 h-4 text-gray-400"></i>
                            <span>${room}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i data-lucide="users" class="w-4 h-4 text-gray-400"></i>
                            <span>${studentCount} étudiants</span>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-2">
                        <button onclick="window.location.href='salle-de-classe.html?id=${classData.id}'" 
                            class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                            Accéder
                        </button>
                        <button class="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-xl transition-colors">
                            <i data-lucide="more-vertical" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    updateStats() {
        const totalStat = document.getElementById('stat-total');
        const activeStat = document.getElementById('stat-active');
        const nextStat = document.getElementById('stat-next');

        if (totalStat) totalStat.textContent = this.myClasses.length;
        if (activeStat) activeStat.textContent = this.myClasses.filter(c => c.status === 'active').length;
        if (nextStat) nextStat.textContent = this.myClasses.length > 0 ? 'Aujourd\'hui' : 'Aucune';
    }

    initializeSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.myClasses.filter(c => 
                    c.name.toLowerCase().includes(term) ||
                    c.instructorName.toLowerCase().includes(term) ||
                    (c.subject && c.subject.toLowerCase().includes(term))
                );
                
                // Re-render with filtered results
                const container = document.getElementById('classes-container');
                if (filtered.length === 0) {
                    container.innerHTML = `
                        <div class="col-span-full text-center py-12">
                            <p class="text-gray-500">Aucune classe trouvée pour "${term}"</p>
                        </div>
                    `;
                } else {
                    // Store original and render filtered
                    const original = this.myClasses;
                    this.myClasses = filtered;
                    this.renderClasses();
                    this.myClasses = original;
                }
            });
        }
    }
}

const studentClasses = new StudentClasses();
document.addEventListener('DOMContentLoaded', () => {
    studentClasses.init();
});
