/**
 * Student Live Courses - Logique dynamique
 */

class StudentLive {
    constructor() {
        this.currentStudent = null;
        this.liveCourses = [];
        this.filteredCourses = [];
        this.currentFilter = 'all'; // 'all', 'in-progress', 'completed'
        this.currentView = 'grid'; // 'grid', 'list', 'calendar'
        this.currentDate = new Date();
    }

    async init() {
        console.log('🔴 Initialisation Cours en Direct');
        if (!window.dataManager) {
            console.error('DataManager non trouvé');
            return;
        }
        await dataManager.init();

        // Auth Check - Use only sessionStorage
        const user = sessionStorage.getItem('user');
        if (user) {
            this.currentStudent = JSON.parse(user);
        } else {
            console.warn('⚠️ Aucun utilisateur connecté. Redirection...');
            window.location.href = '../../pages/login-etudiant.html';
            return;
        }

        await this.loadData();
        this.calculateStats();
        this.renderLiveBanner();
        this.renderContent();
        this.initializeEvents();
        
        console.log('✅ Page Live chargée avec', this.liveCourses.length, 'cours');
    }

    async loadData() {
        try {
            // 1. Get Enrollments
            const allEnrollments = await dataManager.getAll('enrollments');
            const myEnrollments = allEnrollments.filter(e => e.userId === this.currentStudent.id);

            // 2. Get Courses details
            const courses = await Promise.all(
                myEnrollments.map(async (enrollment) => {
                    const course = await dataManager.getById('courses', enrollment.courseId);
                    if (!course) return null;
                    // Check if it's a Live course
                    if (course.type !== 'Live') return null;

                    // Merge enrollment data (progress, status) with course data
                    return {
                        ...course,
                        enrollmentId: enrollment.id,
                        progress: enrollment.progress || 0,
                        status: enrollment.status || 'in-progress',
                        completedLessons: enrollment.completedLessons || 0,
                        totalLessons: enrollment.totalLessons || 0,
                        nextSession: course.nextSession || enrollment.nextSession || new Date().toISOString() // Fallback
                    };
                })
            );

            // Filter out nulls
            this.liveCourses = courses.filter(c => c !== null);
            this.filteredCourses = [...this.liveCourses];

        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
        }
    }

    calculateStats() {
        const total = this.liveCourses.length;
        const inProgress = this.liveCourses.filter(c => c.status === 'in-progress').length;
        const completed = this.liveCourses.filter(c => c.status === 'completed').length;
        
        const totalProgress = this.liveCourses.reduce((sum, c) => sum + (c.progress || 0), 0);
        const avg = total > 0 ? Math.round(totalProgress / total) : 0;

        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-progress').innerText = inProgress;
        document.getElementById('stat-completed').innerText = completed;
        document.getElementById('stat-avg').innerText = avg + '%';
    }

    renderLiveBanner() {
        const container = document.getElementById('live-alert-container');
        if (!container) return;

        // Check if any course is "Now" (within last 30 mins or next 15 mins)
        const now = new Date();
        const liveNow = this.liveCourses.find(c => {
            if (!c.nextSession) return false;
            const sessionTime = new Date(c.nextSession);
            const diffMinutes = (sessionTime - now) / 1000 / 60;
            // Consider "Live" if starts within 15 mins or started less than 2 hours ago
            return diffMinutes > -120 && diffMinutes < 15;
        });

        if (liveNow) {
            container.innerHTML = `
                <div class="relative animate-fade-in-up">
                    <div class="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-2xl blur-sm opacity-75 animate-pulse"></div>
                    <div class="relative bg-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <span class="relative flex h-3 w-3">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <h2 class="text-sm font-bold text-red-600 uppercase tracking-wider">COURS EN DIRECT MAINTENANT</h2>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900">${liveNow.title}</h3>
                            <p class="text-gray-600">avec ${liveNow.instructor}</p>
                        </div>
                        <button onclick="window.location.href='salle-de-classe.html?id=${liveNow.id}'" class="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-all shadow-lg flex items-center gap-3 transform hover:scale-105 active:scale-95">
                            <i data-lucide="video" class="w-5 h-5"></i> Rejoindre
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Find next upcoming
            const sorted = [...this.liveCourses]
                .filter(c => c.nextSession && new Date(c.nextSession) > now)
                .sort((a, b) => new Date(a.nextSession) - new Date(b.nextSession));
            
            const next = sorted[0];

            if (next) {
                const date = new Date(next.nextSession);
                const timeStr = date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                const dateStr = date.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});

                container.innerHTML = `
                   <div class="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center gap-2 mb-2 text-indigo-200">
                                <i data-lucide="calendar-clock" class="w-5 h-5"></i>
                                <h2 class="font-bold uppercase tracking-wider text-xs">Prochain cours en direct</h2>
                            </div>
                            <h3 class="text-2xl font-bold mb-1">${next.title}</h3>
                            <p class="text-indigo-100 flex items-center gap-2">
                                <img src="${next.instructorAvatar || 'https://ui-avatars.com/api/?name='+next.instructor}" class="w-6 h-6 rounded-full border border-white/30">
                                avec ${next.instructor}
                            </p>
                        </div>

                        <div class="flex items-center gap-4 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm relative z-10">
                            <div class="text-right">
                                <div class="text-sm text-indigo-200 capitalize">${dateStr}</div>
                                <div class="text-2xl font-bold">${timeStr}</div>
                            </div>
                            <div class="h-10 w-px bg-white/20"></div>
                            <button onclick="window.location.href='salle-de-classe.html?id=${next.id}'" class="p-3 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                                <i data-lucide="bell" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                 container.innerHTML = ''; // Nothing upcoming
            }
        }
        lucide.createIcons();
    }

    renderContent() {
        if (this.currentView === 'calendar') {
            this.renderCalendar();
            return;
        }

        const grid = document.getElementById('courses-grid');
        grid.innerHTML = '';

        if (this.filteredCourses.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i data-lucide="video-off" class="w-10 h-10 text-gray-400"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Aucun cours trouvé</h3>
                    <p class="text-gray-500 max-w-md mx-auto">Vous n'avez pas de cours en direct correspondant à vos critères.</p>
                </div>`;
            lucide.createIcons();
            return;
        }

        this.filteredCourses.forEach(course => {
            const isList = this.currentView === 'list';
            const el = document.createElement('div');
            
            // Card Styles
            el.className = `bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group ${isList ? 'flex flex-row col-span-full' : 'flex flex-col'}`;

            const imageStyle = isList ? 'w-64 h-full min-h-[12rem]' : 'h-48 w-full';
            
            el.innerHTML = `
                <div class="relative ${imageStyle} bg-gray-200 flex-shrink-0 relative overflow-hidden">
                    <img src="${course.image}" alt="${course.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                    
                    ${course.status === 'completed' 
                        ? '<div class="absolute top-3 left-3 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> Terminé</div>' 
                        : '<div class="absolute top-3 left-3 px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1"><i data-lucide="activity" class="w-3 h-3"></i> En cours</div>'}
                </div>
                
                <div class="p-6 flex-1 flex flex-col">
                    <div class="mb-4">
                        <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">${course.title}</h3>
                        <div class="flex items-center gap-2">
                             <div class="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                <img src="${course.instructorAvatar || 'https://ui-avatars.com/api/?name='+course.instructor}" class="w-full h-full object-cover">
                             </div>
                             <p class="text-sm font-medium text-gray-600">${course.instructor}</p>
                        </div>
                    </div>

                    <div class="mt-auto space-y-4">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wide">
                                <span>Progression</span>
                                <span class="text-blue-600">${course.progress}%</span>
                            </div>
                            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" style="width: ${course.progress}%"></div>
                            </div>
                        </div>
                        
                        <div class="flex gap-3">
                            <button onclick="window.location.href='salle-de-classe.html?id=${course.id}'" class="flex-1 py-3 bg-gray-900 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2">
                                ${course.status === 'completed' ? 'Revoir' : 'Continuer'} <i data-lucide="arrow-right" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(el);
        });
        lucide.createIcons();
    }

    renderCalendar() {
        const container = document.getElementById('calendar-days');
        const monthLabel = document.getElementById('calendar-month-year');
        if(!container) return;
        
        container.innerHTML = '';
        monthLabel.innerText = this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) container.innerHTML += '<div></div>';

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toDateString();
            const sessions = this.liveCourses.filter(c => c.nextSession && new Date(c.nextSession).toDateString() === dateStr);
            const isToday = new Date().toDateString() === dateStr;

            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all
                ${isToday ? 'bg-blue-50 border-blue-500 shadow-md' : 'border-gray-100 hover:border-gray-300'}
                ${sessions.length > 0 ? 'bg-indigo-50/50' : ''}
            `;
            
            const dots = sessions.map(() => `<div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>`).join('');
            
            dayEl.innerHTML = `
                <span class="text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}">${i}</span>
                <div class="flex gap-1 mt-1">${dots}</div>
            `;
            container.appendChild(dayEl);
        }
    }

    initializeEvents() {
        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.currentFilter = filter;
                
                // Update specific filtered list
                if (filter === 'all') this.filteredCourses = this.liveCourses;
                else this.filteredCourses = this.liveCourses.filter(c => c.status === filter);
                
                // Update UI buttons
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('bg-blue-600', 'text-white');
                    b.classList.add('bg-gray-100', 'text-gray-600');
                });
                e.target.classList.add('bg-blue-600', 'text-white');
                e.target.classList.remove('bg-gray-100', 'text-gray-600');

                this.renderContent();
            });
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find button even if clicked on icon
                const target = e.target.closest('button');
                this.currentView = target.dataset.view;
                
                // Toggle calendar visibility
                if (this.currentView === 'calendar') {
                     document.getElementById('courses-grid').classList.add('hidden');
                     document.getElementById('calendar-view').classList.remove('hidden');
                } else {
                     document.getElementById('courses-grid').classList.remove('hidden');
                     document.getElementById('calendar-view').classList.add('hidden');
                     
                     const grid = document.getElementById('courses-grid');
                     if (this.currentView === 'list') {
                        grid.classList.remove('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
                        grid.classList.add('flex', 'flex-col');
                     } else {
                        grid.classList.add('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
                        grid.classList.remove('flex', 'flex-col');
                     }
                }

                // Update UI buttons
                document.querySelectorAll('.view-btn').forEach(b => {
                    b.classList.remove('bg-blue-600', 'text-white');
                    b.classList.add('text-gray-400');
                });
                target.classList.add('bg-blue-600', 'text-white');
                target.classList.remove('text-gray-400');

                this.renderContent();
            });
        });

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                this.filteredCourses = this.liveCourses.filter(c => 
                    c.title.toLowerCase().includes(term) || 
                    c.instructor.toLowerCase().includes(term)
                );
                this.renderContent();
            });
        }
    }
}

const studentLive = new StudentLive();
window.studentLive = studentLive;
document.addEventListener('DOMContentLoaded', () => {
    studentLive.init();
});
