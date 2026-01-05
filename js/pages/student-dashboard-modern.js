/**
 * Modern Student Dashboard - Dynamic Logic
 * Gère toutes les fonctionnalités du tableau de bord étudiant
 */

let currentStudent = null;
let enrolledCourses = [];
let allCourses = [];
let instructors = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation du tableau de bord étudiant moderne...');
    
    try {
        await dataManager.init();
        await loadStudentData();
        await loadDashboardContent();
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Impossible de charger les données');
    }
});

async function loadStudentData() {
    // Get current student from session
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
        console.warn('⚠️ Aucun utilisateur connecté');
        window.location.href = '../login-etudiant.html';
        return;
    }

    currentStudent = JSON.parse(userStr);
    console.log('👤 Étudiant connecté:', currentStudent);

    // Update welcome message
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg) {
        welcomeMsg.textContent = `Bonjour, ${currentStudent.name} 👋`;
    }

    // Update avatar
    const avatar = document.getElementById('userAvatar');
    if (avatar && currentStudent.name) {
        const initials = currentStudent.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        avatar.textContent = initials;
    }
}

async function loadDashboardContent() {
    console.log('📊 Chargement du contenu du dashboard...');

    try {
        // Load all data in parallel
        const [courses, enrollments, instructorsData] = await Promise.all([
            dataManager.getAll('courses'),
            dataManager.getAll('enrollments'),
            dataManager.getAll('instructors')
        ]);

        allCourses = courses || [];
        instructors = instructorsData || [];

        // Filter enrollments for current student
        const studentEnrollments = (enrollments || []).filter(e => e.studentId === currentStudent.id);
        
        // Get enrolled courses
        enrolledCourses = studentEnrollments.map(enrollment => {
            const course = allCourses.find(c => c.id === enrollment.courseId);
            if (course) {
                return {
                    ...course,
                    enrollment: enrollment,
                    progress: enrollment.progress || 0,
                    paid: enrollment.paid || enrollment.status === 'active',
                    amount: enrollment.amount || course.price || 0
                };
            }
            return null;
        }).filter(c => c !== null);

        console.log('📚 Cours inscrits:', enrolledCourses);

        // Render all sections
        renderStats();
        renderMyCourses();
        renderSummaries();
        renderManuals();
        renderMessages();

    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
    }
}

function renderStats() {
    // Enrolled courses count
    const enrolledCount = enrolledCourses.length;
    document.getElementById('enrolledCoursesCount').textContent = enrolledCount;

    // Completed courses count
    const completedCount = enrolledCourses.filter(c => c.progress >= 100).length;
    document.getElementById('completedCoursesCount').textContent = completedCount;

    // Next session
    const upcomingCourses = enrolledCourses.filter(c => c.nextSession);
    if (upcomingCourses.length > 0) {
        const nextCourse = upcomingCourses.sort((a, b) => 
            new Date(a.nextSession) - new Date(b.nextSession)
        )[0];
        
        const sessionDate = new Date(nextCourse.nextSession);
        const timeStr = sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        document.getElementById('nextSessionTime').textContent = timeStr;
        document.getElementById('nextSessionCourse').textContent = nextCourse.title;
    } else {
        document.getElementById('nextSessionTime').textContent = 'Aucune';
        document.getElementById('nextSessionCourse').textContent = 'Pas de séance prévue';
    }

    // Unpaid amount
    const unpaidCourses = enrolledCourses.filter(c => !c.paid);
    const totalUnpaid = unpaidCourses.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    document.getElementById('unpaidAmount').textContent = `${totalUnpaid} DT`;
}

function renderMyCourses() {
    const container = document.getElementById('myCoursesContainer');
    if (!container) return;

    if (enrolledCourses.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <i data-lucide="book-open" class="w-10 h-10 text-gray-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Aucun cours inscrit</h3>
                <p class="text-gray-500 mb-4">Commencez votre parcours d'apprentissage</p>
                <a href="catalogue.html" class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    <i data-lucide="search" class="w-5 h-5"></i>
                    Explorer les cours
                </a>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = enrolledCourses.slice(0, 3).map(course => {
        const instructor = instructors.find(i => i.id === course.instructorId);
        const instructorName = instructor ? instructor.name : course.instructor || 'Formateur';
        
        return `
            <div class="course-card">
                <div class="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div class="text-white text-center">
                        <i data-lucide="book-open" class="w-12 h-12 mx-auto mb-2"></i>
                        <p class="text-sm font-semibold">${course.type || 'Cours'}</p>
                    </div>
                    ${course.progress >= 100 ? `
                        <div class="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            ✓ Terminé
                        </div>
                    ` : ''}
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-2">${course.title}</h3>
                    <p class="text-sm text-gray-500 mb-3 flex items-center gap-1">
                        <i data-lucide="user" class="w-4 h-4"></i>
                        ${instructorName}
                    </p>
                    
                    <!-- Progress -->
                    <div class="mb-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600">Progression</span>
                            <span class="font-semibold text-blue-600">${course.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${course.progress}%"></div>
                        </div>
                    </div>

                    <!-- Payment Status -->
                    ${!course.paid ? `
                        <div class="mb-3 p-2 bg-red-50 rounded-lg flex items-center gap-2 text-sm">
                            <i data-lucide="alert-circle" class="w-4 h-4 text-red-600"></i>
                            <span class="text-red-600 font-semibold">${course.amount} DT impayé</span>
                        </div>
                    ` : ''}

                    <!-- Actions -->
                    <div class="flex gap-2">
                        <a href="mes-cours.html?id=${course.id}" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm text-center hover:bg-blue-700 transition-colors">
                            Continuer
                        </a>
                        ${!course.paid ? `
                            <a href="paiements.html?course=${course.id}" class="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors">
                                Payer
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function renderSummaries() {
    const container = document.getElementById('summariesContainer');
    if (!container) return;

    // Generate summaries from enrolled courses
    const summaries = enrolledCourses.slice(0, 5).map(course => ({
        title: `Résumé - ${course.title}`,
        course: course.title,
        date: new Date().toLocaleDateString('fr-FR'),
        pages: Math.floor(Math.random() * 10) + 5
    }));

    if (summaries.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i data-lucide="file-text" class="w-12 h-12 mx-auto mb-2 text-gray-300"></i>
                <p class="text-sm">Aucun résumé disponible</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = summaries.map(summary => `
        <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i data-lucide="file-text" class="w-5 h-5 text-blue-600"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 text-sm truncate">${summary.title}</h4>
                <p class="text-xs text-gray-500">${summary.pages} pages • ${summary.date}</p>
            </div>
            <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i data-lucide="download" class="w-4 h-4 text-gray-400"></i>
            </button>
        </div>
    `).join('');

    lucide.createIcons();
}

function renderManuals() {
    const container = document.getElementById('manualsContainer');
    if (!container) return;

    // Generate manuals from enrolled courses
    const manuals = enrolledCourses.slice(0, 5).map(course => ({
        title: `Manuel - ${course.title}`,
        type: 'PDF',
        size: `${Math.floor(Math.random() * 50) + 10} MB`
    }));

    if (manuals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i data-lucide="book" class="w-12 h-12 mx-auto mb-2 text-gray-300"></i>
                <p class="text-sm">Aucun manuel disponible</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = manuals.map(manual => `
        <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <i data-lucide="book" class="w-5 h-5 text-purple-600"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 text-sm truncate">${manual.title}</h4>
                <p class="text-xs text-gray-500">${manual.type} • ${manual.size}</p>
            </div>
            <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i data-lucide="download" class="w-4 h-4 text-gray-400"></i>
            </button>
        </div>
    `).join('');

    lucide.createIcons();
}

async function renderMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    try {
        // Load real messages from database
        const allMessages = await dataManager.getMessages();
        
        // Filter messages for current student
        const studentMessages = allMessages.filter(msg => 
            msg.from.id === currentStudent.id || msg.to.id === currentStudent.id
        );

        // Sort by date (newest first)
        studentMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Get recent messages (max 4)
        const recentMessages = studentMessages.slice(0, 4);

        // Count unread messages
        const unreadCount = studentMessages.filter(msg => 
            !msg.isRead && msg.to.id === currentStudent.id
        ).length;

        if (recentMessages.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="message-circle" class="w-12 h-12 mx-auto mb-2 text-gray-300"></i>
                    <p class="text-sm mb-3">Aucune discussion</p>
                    <a href="messages.html" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        Nouveau message
                    </a>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = recentMessages.map(msg => {
            const isSent = msg.from.id === currentStudent.id;
            const otherPerson = isSent ? msg.to : msg.from;
            const isUnread = !msg.isRead && msg.to.id === currentStudent.id;
            const hasReplies = msg.replies && msg.replies.length > 0;
            
            // Calculate time ago
            const timeAgo = getTimeAgo(msg.createdAt);

            return `
                <a href="messages.html" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${isUnread ? 'bg-blue-50' : ''}">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        ${otherPerson.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h4 class="font-semibold text-gray-900 text-sm">${otherPerson.name}</h4>
                            <span class="text-xs text-gray-500">${timeAgo}</span>
                        </div>
                        <p class="text-xs text-gray-600 truncate font-medium">${msg.subject}</p>
                        <p class="text-sm text-gray-500 truncate mt-1">${msg.message}</p>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        ${isUnread ? `
                            <div class="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        ` : ''}
                        ${hasReplies ? `
                            <span class="text-xs text-gray-400">${msg.replies.length}</span>
                        ` : ''}
                    </div>
                </a>
            `;
        }).join('');

        // Add "View All" link if there are messages
        if (recentMessages.length > 0) {
            container.innerHTML += `
                <a href="messages.html" class="block p-3 text-center text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-sm transition-colors">
                    Voir tous les messages ${unreadCount > 0 ? `(${unreadCount} non lus)` : ''}
                    <i data-lucide="arrow-right" class="w-4 h-4 inline ml-1"></i>
                </a>
            `;
        }

        lucide.createIcons();
    } catch (error) {
        console.error('❌ Error loading messages:', error);
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-2 text-red-300"></i>
                <p class="text-sm">Erreur de chargement des messages</p>
            </div>
        `;
        lucide.createIcons();
    }
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function showError(message) {
    console.error('❌', message);
    alert(message);
}
