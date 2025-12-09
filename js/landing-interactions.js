// Landing Page Interactions - Search, Filter, and Chat Functionality

// ===== SEARCH AND FILTER FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInstructors');
    const filterSpecialty = document.getElementById('filterSpecialty');
    const instructorCards = document.querySelectorAll('.instructor-card');
    const categoryTabs = document.querySelectorAll('.category-tab');

    let currentCategory = 'bestseller';

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', filterInstructors);
    }

    // Specialty filter
    if (filterSpecialty) {
        filterSpecialty.addEventListener('change', filterInstructors);
    }

    // Category tabs
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Update active tab
            categoryTabs.forEach(t => {
                t.classList.remove('active', 'bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-200');
                t.classList.add('bg-white', 'text-gray-600', 'border', 'border-gray-200');
            });
            this.classList.add('active', 'bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-200');
            this.classList.remove('bg-white', 'text-gray-600', 'border', 'border-gray-200');

            currentCategory = this.dataset.category;
            filterInstructors();
        });
    });

    function filterInstructors() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedSpecialty = filterSpecialty ? filterSpecialty.value : '';

        instructorCards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            const cardSpecialty = card.dataset.specialty || '';
            const cardCategory = card.dataset.category || '';

            const matchesSearch = cardText.includes(searchTerm);
            const matchesSpecialty = !selectedSpecialty || cardSpecialty === selectedSpecialty;
            const matchesCategory = cardCategory === currentCategory;

            if (matchesSearch && matchesSpecialty && matchesCategory) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s ease-out';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ===== INSTRUCTOR PROFILE FUNCTIONALITY =====

function viewInstructorProfile(instructorId) {
    // Store instructor ID in localStorage for the profile page
    localStorage.setItem('selectedInstructor', instructorId);

    // Redirect to instructor profile page
    window.location.href = `pages/instructor-profile.html?id=${instructorId}`;
}

// ===== CHAT FUNCTIONALITY =====

function startChat(entityId, entityType) {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (!currentUser) {
        // Show login prompt
        showNotification('Veuillez vous connecter pour démarrer une conversation', 'warning');
        setTimeout(() => {
            window.location.href = 'pages/login-etudiant.html';
        }, 1500);
        return;
    }

    // Store chat information
    const chatInfo = {
        entityId: entityId,
        entityType: entityType, // 'formateur' or 'centre'
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('pendingChat', JSON.stringify(chatInfo));

    // Redirect to messages page
    if (currentUser.role === 'etudiant') {
        window.location.href = 'pages/etudiant/messages.html';
    } else {
        showNotification('Cette fonctionnalité est réservée aux étudiants', 'info');
    }
}

// ===== CENTER INFO REQUEST =====

function requestCenterInfo(centerId) {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (!currentUser) {
        showNotification('Veuillez vous connecter pour demander des informations', 'warning');
        setTimeout(() => {
            window.location.href = 'pages/login-etudiant.html';
        }, 1500);
        return;
    }

    // Show modal or redirect to center info page
    showNotification('Demande d\'information envoyée avec succès! Le centre vous contactera bientôt.', 'success');

    // In a real application, this would send a request to the backend
    console.log(`Info request sent for center: ${centerId}`);
}

// ===== NOTIFICATION SYSTEM =====

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;

    // Set color based on type
    const colors = {
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-indigo-600 text-white'
    };

    notification.className += ` ${colors[type] || colors.info}`;

    // Add icon based on type
    const icons = {
        success: 'check-circle',
        warning: 'alert-triangle',
        error: 'x-circle',
        info: 'info'
    };

    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i data-lucide="${icons[type] || icons.info}" class="w-5 h-5"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Initialize icon
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====

document.addEventListener('DOMContentLoaded', function () {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});

// ===== CARD HOVER EFFECTS ENHANCEMENT =====

document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.instructor-card, .center-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// ===== CV MODAL FUNCTIONALITY =====

function viewInstructorCV(instructorId) {
    // Get instructor data (in real app, this would come from API)
    const instructor = getInstructorData(instructorId);

    if (!instructor) {
        showNotification('Informations du formateur non disponibles', 'error');
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'cvModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm';
    modal.onclick = (e) => {
        if (e.target === modal) closeCVModal();
    };

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-t-2xl">
                <button onclick="closeCVModal()" class="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
                <div class="flex items-center gap-6">
                    <img src="${instructor.image}" alt="${instructor.name}" class="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover">
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold mb-2">${instructor.name}</h2>
                        <p class="text-indigo-100 text-lg mb-2">${instructor.specialty}</p>
                        <div class="flex items-center gap-4 text-sm">
                            <span class="flex items-center gap-1">
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i> ${instructor.rating}
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="users" class="w-4 h-4"></i> ${instructor.students} élèves
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="briefcase" class="w-4 h-4"></i> ${instructor.experience}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CV Content -->
            <div class="p-8 space-y-6">
                <!-- Education -->
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i data-lucide="graduation-cap" class="w-5 h-5 text-indigo-600"></i> Formation
                    </h3>
                    <div class="space-y-3">
                        ${instructor.cv.education.map(edu => `
                            <div class="border-l-4 border-indigo-600 pl-4 py-2">
                                <p class="font-bold text-gray-900">${edu.degree}</p>
                                <p class="text-gray-600 text-sm">${edu.school} • ${edu.year}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Experience -->
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i data-lucide="briefcase" class="w-5 h-5 text-indigo-600"></i> Expérience
                    </h3>
                    <div class="space-y-3">
                        ${instructor.cv.experience.map(exp => `
                            <div class="border-l-4 border-indigo-600 pl-4 py-2">
                                <p class="font-bold text-gray-900">${exp.title}</p>
                                <p class="text-gray-600 text-sm">${exp.company} • ${exp.period}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Skills -->
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i data-lucide="code" class="w-5 h-5 text-indigo-600"></i> Compétences
                    </h3>
                    <div class="flex flex-wrap gap-2">
                        ${instructor.cv.skills.map(skill => `
                            <span class="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">${skill}</span>
                        `).join('')}
                    </div>
                </div>

                <!-- Certifications -->
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i data-lucide="award" class="w-5 h-5 text-indigo-600"></i> Certifications
                    </h3>
                    <ul class="space-y-2">
                        ${instructor.cv.certifications.map(cert => `
                            <li class="flex items-center gap-2 text-gray-700">
                                <i data-lucide="check-circle" class="w-4 h-4 text-green-600"></i> ${cert}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Languages -->
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i data-lucide="globe" class="w-5 h-5 text-indigo-600"></i> Langues
                    </h3>
                    <div class="flex flex-wrap gap-2">
                        ${instructor.cv.languages.map(lang => `
                            <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">${lang}</span>
                        `).join('')}
                    </div>
                </div>

                <!-- Price -->
                <div class="bg-indigo-50 rounded-xl p-4">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-700 font-medium">Tarif horaire</span>
                        <span class="text-2xl font-bold text-indigo-600">${instructor.price}</span>
                    </div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl flex gap-3">
                <button onclick="viewFullProfile('${instructor.id}')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="user" class="w-5 h-5"></i> Voir Profil Complet
                </button>
                <button onclick="startChat('${instructor.id}', 'formateur')" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="message-circle" class="w-5 h-5"></i> Contacter
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Initialize Lucide icons in modal
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeCVModal() {
    const modal = document.getElementById('cvModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

function viewFullProfile(instructorId) {
    closeCVModal();
    localStorage.setItem('selectedInstructor', instructorId);
    window.location.href = `pages/instructor-profile.html?id=${instructorId}`;
}

function getInstructorData(instructorId) {
    // Mock data - in real app this would come from API or imported data file
    const data = {
        ahmed: {
            id: 'ahmed',
            name: 'Ahmed Ben Ali',
            specialty: 'Expert DevOps & Cloud Computing',
            rating: 4.9,
            students: '15k+',
            experience: '8 ans',
            price: '80 TND/h',
            image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            cv: {
                education: [
                    { degree: 'Master en Informatique', school: 'INSAT', year: '2015' },
                    { degree: 'Ingénieur DevOps', school: 'Polytechnique', year: '2013' }
                ],
                experience: [
                    { title: 'Senior DevOps Engineer', company: 'Orange Tunisie', period: '2018-Present' },
                    { title: 'Cloud Architect', company: 'Tunisie Telecom', period: '2015-2018' }
                ],
                skills: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Terraform'],
                certifications: ['AWS Certified Solutions Architect', 'Kubernetes Administrator'],
                languages: ['Français (Natif)', 'Anglais (Courant)', 'Arabe (Natif)']
            }
        },
        sarah: {
            id: 'sarah',
            name: 'Sarah M.',
            specialty: 'Design UX/UI & Créativité',
            rating: 5.0,
            students: '8k+',
            experience: '6 ans',
            price: '70 TND/h',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            cv: {
                education: [
                    { degree: 'Master Design Graphique', school: 'ESAC Tunis', year: '2017' }
                ],
                experience: [
                    { title: 'Lead UX Designer', company: 'Expensya', period: '2019-Present' },
                    { title: 'UI/UX Designer', company: 'Sofrecom', period: '2017-2019' }
                ],
                skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research'],
                certifications: ['Google UX Design Certificate', 'Nielsen Norman Group UX'],
                languages: ['Français (Natif)', 'Anglais (Courant)']
            }
        },
        leila: {
            id: 'leila',
            name: 'Leila K.',
            specialty: 'Marketing Digital & SEO',
            rating: 4.8,
            students: '12k+',
            experience: '7 ans',
            price: '65 TND/h',
            image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            cv: {
                education: [
                    { degree: 'Master Marketing Digital', school: 'IHEC Carthage', year: '2016' }
                ],
                experience: [
                    { title: 'Digital Marketing Manager', company: 'Jumia Tunisia', period: '2020-Present' },
                    { title: 'SEO Specialist', company: 'Webhelp', period: '2016-2020' }
                ],
                skills: ['SEO', 'Google Ads', 'Facebook Ads', 'Analytics', 'Content Marketing'],
                certifications: ['Google Analytics Certified', 'HubSpot Inbound Marketing'],
                languages: ['Français (Natif)', 'Anglais (Courant)', 'Arabe (Natif)']
            }
        },
        karim: {
            id: 'karim',
            name: 'Karim S.',
            specialty: 'Développement Mobile iOS',
            rating: 4.7,
            students: '5k+',
            experience: '5 ans',
            price: '75 TND/h',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            cv: {
                education: [
                    { degree: 'Ingénieur Informatique', school: 'ESPRIT', year: '2018' }
                ],
                experience: [
                    { title: 'iOS Developer', company: 'Vermeg', period: '2019-Present' },
                    { title: 'Mobile Developer', company: 'Cynapsys', period: '2018-2019' }
                ],
                skills: ['Swift', 'SwiftUI', 'UIKit', 'Core Data', 'Firebase'],
                certifications: ['Apple Certified iOS Developer'],
                languages: ['Français (Courant)', 'Anglais (Courant)', 'Arabe (Natif)']
            }
        }
    };

    return data[instructorId] || null;
}

// Close modal on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeCVModal();
    }
});
