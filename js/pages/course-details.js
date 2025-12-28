document.addEventListener('DOMContentLoaded', async () => {
    if (window.dataManager) await dataManager.init();
    lucide.createIcons();
    loadCourseDetails();
});

async function loadCourseDetails() {
    // Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');

    if (!courseId) {
        showError("Aucun cours spécifié.");
        return;
    }

    // Fetch Data
    const course = await dataManager.getById('courses', courseId);
    if (!course) {
        showError("Cours introuvable.");
        return;
    }

    const instructor = await dataManager.getById('users', course.instructorId);

    // Update Browser Title
    document.title = `${course.title} - EduSpace`;

    // Render Header
    document.getElementById('course-title').textContent = course.title;
    document.getElementById('course-description-short').textContent = course.description;
    
    document.getElementById('breadcrumb-title').textContent = course.title;
    document.getElementById('breadcrumb-category').textContent = course.category;

    // Instructor info
    if (instructor) {
        document.getElementById('instructor-name').textContent = instructor.name;
        document.getElementById('instructor-bio-name').textContent = instructor.name;
        document.getElementById('instructor-bio-role').textContent = instructor.specialite || 'Formateur EduSpace';
        document.getElementById('instructor-bio-text').textContent = instructor.bio || `Formateur passionné spécialisé en ${course.category}.`;
        
        // Avatars
        // Use a placeholder if no image, or logic to find initials
        const avatarSrc = instructor.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=random`;
        document.getElementById('instructor-avatar').src = avatarSrc;
        document.getElementById('instructor-bio-avatar').src = avatarSrc;
    }

    // Cover Image
    const coverUrl = course.cover || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800';
    document.getElementById('course-cover-mobile').src = coverUrl;
    document.getElementById('course-cover-sidebar').src = coverUrl;
    document.getElementById('course-category-badge-mobile').textContent = course.category;

    // Price
    const priceDisplay = course.price > 0 ? `${course.price} TND` : 'Gratuit';
    document.getElementById('course-price').textContent = priceDisplay;

    // Full Description (simulate simpler paragraph split if needed, or raw text)
    document.getElementById('course-description-full').innerHTML = `<p>${course.description}</p><p>Ce cours est conçu pour vous aider à maîtriser ${course.category} de manière efficace et structurée. Vous avancerez étape par étape à travers des modules pratiques.</p>`;

    // Curriculum
    renderCurriculum(course.chapters || []);

    // Show Content
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('course-content').classList.remove('hidden');
}

function renderCurriculum(chapters) {
    const container = document.getElementById('course-curriculum');
    
    if (chapters.length === 0) {
        container.innerHTML = `<div class="p-6 bg-gray-50 rounded-xl text-gray-500 text-center">Aucun contenu disponible pour ce cours.</div>`;
        return;
    }

    container.innerHTML = chapters.map((chapter, index) => `
        <div class="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button class="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left" onclick="toggleChapter(${index})">
                <div class="flex items-center gap-4">
                    <span class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                        ${index + 1}
                    </span>
                    <span class="font-bold text-gray-900 text-lg">${chapter.title}</span>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span>${chapter.lessons ? chapter.lessons.length : 0} leçons</span>
                    <i data-lucide="chevron-down" id="icon-chapter-${index}" class="w-5 h-5 transition-transform"></i>
                </div>
            </button>
            <div id="content-chapter-${index}" class="hidden border-t border-gray-100 bg-white">
                <ul class="divide-y divide-gray-50">
                    ${(chapter.lessons || []).map(lesson => `
                        <li class="p-4 pl-16 flex items-center justify-between hover:bg-indigo-50/30 transition-colors group cursor-pointer">
                            <div class="flex items-center gap-3">
                                <i data-lucide="play-circle" class="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform"></i>
                                <span class="text-gray-700 font-medium group-hover:text-indigo-700">${lesson.title}</span>
                            </div>
                            <span class="text-xs text-gray-400">10:00</span> <! -- Placeholder duration -->
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

window.toggleChapter = (index) => {
    const content = document.getElementById(`content-chapter-${index}`);
    const icon = document.getElementById(`icon-chapter-${index}`);
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
    } else {
        content.classList.add('hidden');
        icon.classList.remove('rotate-180');
    }
};

// --- Modal & Payment Logic ---

let currentCourse = null;

window.buyCourse = async () => {
    if (!currentCourse) return;

    // Check if user is logged in
    const user = dataManager.getCurrentUser();
    if (!user) {
        alert("Veuillez vous connecter pour acheter ce cours.");
        // window.location.href = '/login.html'; // In real app
        return;
    }

    // Check if already enrolled
    const enrollments = await dataManager.getAll('enrollments');
    const existing = enrollments.find(e => e.studentId === user.id && e.courseId === currentCourse.id);
    
    if (existing) {
        if (existing.status === 'active') {
             alert("Vous possédez déjà ce cours !");
        } else if (existing.status === 'pending') {
             alert("Votre demande d'inscription est en cours de validation.");
        }
        return;
    }

    // Open Modal
    document.getElementById('modal-course-title').textContent = currentCourse.title;
    document.getElementById('btn-amount-card').textContent = `${currentCourse.price} TND`;
    document.getElementById('transfer-ref').textContent = `REF-${currentCourse.id.substring(0,6).toUpperCase()}`;
    
    document.getElementById('payment-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

window.closePaymentModal = () => {
    document.getElementById('payment-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
};

window.switchPaymentTab = async (method) => {
    const cardTab = document.getElementById('tab-payment-card');
    const transferTab = document.getElementById('tab-payment-transfer');
    const cardContent = document.getElementById('content-payment-card');
    const transferContent = document.getElementById('content-payment-transfer');

    if (method === 'card') {
        cardTab.classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600', 'bg-indigo-50/50');
        cardTab.classList.remove('text-gray-500');
        transferTab.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600', 'bg-indigo-50/50');
        transferTab.classList.add('text-gray-500');
        
        cardContent.classList.remove('hidden');
        transferContent.classList.add('hidden');
    } else {
        transferTab.classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600', 'bg-indigo-50/50');
        transferTab.classList.remove('text-gray-500');
        cardTab.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600', 'bg-indigo-50/50');
        cardTab.classList.add('text-gray-500');

        transferContent.classList.remove('hidden');
        cardContent.classList.add('hidden');

        // Load Dynamic Bank Details
        if (currentCourse) {
            const instructor = await dataManager.getById('users', currentCourse.instructorId);
            const container = document.querySelector('#content-payment-transfer .bg-gray-50');
            
            if (instructor && instructor.bankDetails) {
                 container.innerHTML = `
                    <p><span class="font-bold">RIB:</span> ${instructor.bankDetails.rib}</p>
                    <p><span class="font-bold">Banque:</span> ${instructor.bankDetails.bankName}</p>
                    <p><span class="font-bold">Bénéficiaire:</span> ${instructor.bankDetails.beneficiaryName}</p>
                    <p><span class="font-bold">Motif:</span> <span id="transfer-ref">REF-${currentCourse.id.substring(0,6).toUpperCase()}</span></p>
                `;
            } else {
                 container.innerHTML = `
                    <p class="text-red-500 font-bold mb-2">Non configuré</p>
                    <p class="text-xs text-gray-500">Ce formateur n'a pas encore configuré ses coordonnées bancaires.</p>
                `;
            }
        }
    }
};

window.updateFileName = (input) => {
    const fileName = document.getElementById('file-name');
    if (input.files.length > 0) {
        fileName.textContent = input.files[0].name;
        fileName.classList.remove('hidden');
    } else {
        fileName.classList.add('hidden');
    }
};

window.handleCardPayment = async (e) => {
    e.preventDefault();
    const user = dataManager.getCurrentUser();
    
    // Simulate Processing
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>`;
    lucide.createIcons();

    await new Promise(r => setTimeout(r, 1500)); // Fake delay

    // CREATE ACTIVE ENROLLMENT
    const enrollment = {
        id: dataManager.generateId(),
        studentId: user.id,
        courseId: currentCourse.id,
        status: 'active',
        paymentMethod: 'card',
        amountPaid: currentCourse.price,
        enrolledAt: new Date().toISOString()
    };
    
    await dataManager.create('enrollments', enrollment);
    
    // Also log payment transaction logic here if needed (skipping for brevity)
    
    closePaymentModal();
    alert("Paiement réussi ! Vous avez maintenant accès au cours.");
    window.location.href = 'mes-cours.html';
};

window.handleTransferPayment = async (e) => {
    e.preventDefault();
    const user = dataManager.getCurrentUser();
    
    // Simulate Upload
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>`;
    lucide.createIcons();

    await new Promise(r => setTimeout(r, 1500));

    // CREATE PENDING ENROLLMENT
    const enrollment = {
        id: dataManager.generateId(),
        studentId: user.id,
        courseId: currentCourse.id,
        status: 'pending',
        paymentMethod: 'transfer',
        receipt: 'recu_virement_simule.jpg', // In real app, this would be the uploaded path
        amountPaid: 0, // Not verified yet
        requestDate: new Date().toISOString()
    };

    await dataManager.create('enrollments', enrollment);

    closePaymentModal();
    alert("Votre demande a été envoyée ! Le formateur validera votre inscription sous peu.");
    // Maybe redirect to 'mes-cours.html' or stay here?
    window.location.href = 'mes-cours.html'; 
};

// Update load logic to store current course
const originalLoad = loadCourseDetails;
loadCourseDetails = async () => {
    // Override to capture data
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');
    if(courseId) {
        currentCourse = await dataManager.getById('courses', courseId);
    }
    await originalLoad(); // Call original rendering
};


function showError(msg) {
    document.getElementById('loading-state').innerHTML = `<p class="text-red-500 font-bold">${msg}</p>`;
}
