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
    currentCourse = await dataManager.getById('courses', courseId);
    if (!currentCourse) {
        showError("Cours introuvable.");
        return;
    }

    const instructor = await dataManager.getById('users', currentCourse.instructorId);

    // Update Browser Title
    document.title = `${currentCourse.title} - EduSpace`;

    // Render Header
    document.getElementById('course-title').textContent = currentCourse.title;
    document.getElementById('course-description-short').textContent = currentCourse.description;
    
    document.getElementById('breadcrumb-title').textContent = currentCourse.title;
    document.getElementById('breadcrumb-category').textContent = currentCourse.category;

    // Instructor info
    if (instructor) {
        document.getElementById('instructor-name').textContent = instructor.name;
        document.getElementById('instructor-bio-name').textContent = instructor.name;
        document.getElementById('instructor-bio-role').textContent = instructor.specialite || 'Formateur EduSpace';
        document.getElementById('instructor-bio-text').textContent = instructor.bio || `Formateur passionné spécialisé en ${currentCourse.category}.`;
        
        // Avatars
        const avatarSrc = instructor.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=random`;
        document.getElementById('instructor-avatar').src = avatarSrc;
        document.getElementById('instructor-bio-avatar').src = avatarSrc;
    }

    // Cover Image
    const coverUrl = currentCourse.cover || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800';
    document.getElementById('course-cover-mobile').src = coverUrl;
    document.getElementById('course-cover-sidebar').src = coverUrl;
    document.getElementById('course-category-badge-mobile').textContent = currentCourse.category;

    // Price
    const priceDisplay = currentCourse.price > 0 ? `${currentCourse.price} TND` : 'Gratuit';
    document.getElementById('course-price').textContent = priceDisplay;

    // Enrollment Status Check (UI Update)
    await checkEnrollmentStatus();

    // Full Description
    document.getElementById('course-description-full').innerHTML = `<p>${currentCourse.description}</p><p>Ce cours est conçu pour vous aider à maîtriser ${currentCourse.category} de manière efficace et structurée. Vous avancerez étape par étape à travers des modules pratiques.</p>`;

    // Curriculum
    renderCurriculum(currentCourse);

    // Show Content
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('course-content').classList.remove('hidden');
}

async function checkEnrollmentStatus() {
    const user = dataManager.getCurrentUser();
    if (!user) return;

    const enrollments = await dataManager.getAll('enrollments');
    const enrollment = enrollments.find(e => e.studentId === user.id && e.courseId === currentCourse.id);

    if (enrollment) {
        const btnBuy = document.getElementById('btn-buy-course');
        const btnCart = document.getElementById('btn-add-cart');

        if (enrollment.status === 'active') {
            // Already Purchased
            if (btnBuy) {
                btnBuy.innerHTML = `<span>Accéder au cours</span><i data-lucide="play-circle" class="w-5 h-5"></i>`;
                btnBuy.className = "w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-green-200 hover:bg-green-700 transition-all mb-4 flex items-center justify-center gap-2";
                btnBuy.onclick = () => window.location.href = `course-view.html?id=${currentCourse.id}`;
            }
            if (btnCart) btnCart.style.display = 'none';
        } else if (enrollment.status === 'pending') {
            // Pending Verification
            if (btnBuy) {
                btnBuy.innerHTML = `<span>En attente</span><i data-lucide="clock" class="w-5 h-5"></i>`;
                btnBuy.className = "w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-amber-200 cursor-not-allowed mb-4 flex items-center justify-center gap-2";
                btnBuy.onclick = null;
            }
            if (btnCart) btnCart.style.display = 'none';
        }
    }
    if (window.lucide) window.lucide.createIcons();
}

function renderCurriculum(course) {
    const chapters = course.chapters || [];
    const quizzes = course.quizzes || [];
    const container = document.getElementById('course-curriculum');
    
    if (chapters.length === 0 && quizzes.length === 0) {
        container.innerHTML = `<div class="p-6 bg-gray-50 rounded-xl text-gray-500 text-center">Aucun contenu disponible pour ce cours.</div>`;
        return;
    }
    
    let html = '';

    // 1. Render Chapters with integrated Quizzes
    html += chapters.map((chapter, index) => {
        // Find quizzes for this chapter
        const chapterQuizzes = quizzes.filter(q => q.chapterId === chapter.id);
        const itemCount = (chapter.lessons ? chapter.lessons.length : 0) + chapterQuizzes.length;
        
        return `
        <div class="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button class="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left" onclick="toggleChapter(${index})">
                <div class="flex items-center gap-4">
                    <span class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                        ${index + 1}
                    </span>
                    <span class="font-bold text-gray-900 text-lg">${chapter.title}</span>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span>${itemCount} éléments</span>
                    <i data-lucide="chevron-down" id="icon-chapter-${index}" class="w-5 h-5 transition-transform"></i>
                </div>
            </button>
            <div id="content-chapter-${index}" class="hidden border-t border-gray-100 bg-white">
                <ul class="divide-y divide-gray-50">
                    ${(chapter.lessons || []).map(lesson => `
                        <li class="p-4 pl-16 flex items-center justify-between hover:bg-indigo-50/30 transition-colors group cursor-pointer" onclick="alert('Lecture vidéo bientôt disponible')">
                            <div class="flex items-center gap-3">
                                <i data-lucide="play-circle" class="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform"></i>
                                <span class="text-gray-700 font-medium group-hover:text-indigo-700">${lesson.title}</span>
                            </div>
                            <span class="text-xs text-gray-400">Vidéo</span>
                        </li>
                    `).join('')}
                    
                    ${chapterQuizzes.map(quiz => `
                        <li class="p-4 pl-16 flex items-center justify-between hover:bg-purple-50/30 transition-colors group cursor-pointer" onclick="startQuiz('${quiz.id}')">
                            <div class="flex items-center gap-3">
                                <i data-lucide="${getQuizIcon(quiz.type)}" class="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform"></i>
                                <span class="text-gray-700 font-medium group-hover:text-purple-700">${quiz.title}</span>
                            </div>
                            <span class="text-xs font-bold text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full bg-purple-50">Quiz</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `}).join('');
    
    // 2. Render Global Quizzes (No Chapter Associated)
    const globalQuizzes = quizzes.filter(q => !q.chapterId);
    if(globalQuizzes.length > 0) {
        html += `
        <div class="border border-purple-100 rounded-2xl overflow-hidden bg-white shadow-sm mt-4">
            <button class="w-full flex items-center justify-between p-5 bg-purple-50 hover:bg-purple-100 transition-colors text-left" onclick="toggleChapter('global')">
                <div class="flex items-center gap-4">
                    <span class="w-8 h-8 rounded-full bg-white border border-purple-200 flex items-center justify-center text-sm font-bold text-purple-600">
                        <i data-lucide="award" class="w-4 h-4"></i>
                    </span>
                    <span class="font-bold text-gray-900 text-lg">Évaluations Finales</span>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span>${globalQuizzes.length} quiz</span>
                    <i data-lucide="chevron-down" id="icon-chapter-global" class="w-5 h-5 transition-transform"></i>
                </div>
            </button>
            <div id="content-chapter-global" class="hidden border-t border-purple-100 bg-white">
                <ul class="divide-y divide-gray-50">
                    ${globalQuizzes.map(quiz => `
                        <li class="p-4 pl-16 flex items-center justify-between hover:bg-purple-50/30 transition-colors group cursor-pointer" onclick="startQuiz('${quiz.id}')">
                            <div class="flex items-center gap-3">
                                <i data-lucide="${getQuizIcon(quiz.type)}" class="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform"></i>
                                <span class="text-gray-700 font-medium group-hover:text-purple-700">${quiz.title}</span>
                            </div>
                           <span class="text-xs font-bold text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full bg-purple-50">Quiz</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
        `;
    }

    container.innerHTML = html;
    lucide.createIcons();
}

function getQuizIcon(type) {
    if(type === 'link') return 'link';
    if(type === 'file') return 'file-up';
    return 'help-circle';
}

window.startQuiz = (quizId) => {
    if(!currentCourse) return;
    const quiz = currentCourse.quizzes.find(q => q.id == quizId); // Intentional weak equality
    if(!quiz) return;
    
    if(quiz.type === 'link') {
        window.open(quiz.content, '_blank');
    } else if (quiz.type === 'file') {
        alert(`Instructions : ${quiz.instructions || 'Aucune'}\n\nFichier à télécharger : ${quiz.content} (Simulation)`);
    } else {
        // Native Quiz
        alert(`Lancement du Quiz : ${quiz.title}\n\nCette fonctionnalité ouvrira bientôt le lecteur de quiz interactif !`);
    }
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
    
    // Get File
    const fileInput = document.getElementById('file-upload');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Veuillez sélectionner un fichier (reçu).");
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Le fichier est trop volumineux (max 5MB).");
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Convert to Base64
    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    try {
        const base64Receipt = await toBase64(file);

        // CREATE PENDING ENROLLMENT
        const enrollment = {
            id: dataManager.generateId(),
            studentId: user.id,
            courseId: currentCourse.id,
            status: 'pending',
            paymentMethod: 'transfer',
            receipt: base64Receipt, // STORE THE IMAGE DATA
            amountPaid: 0, // Not verified yet
            requestDate: new Date().toISOString()
        };

        await dataManager.create('enrollments', enrollment);

        closePaymentModal();
        alert("Votre demande a été envoyée ! Le formateur validera votre inscription sous peu.");
        window.location.href = 'mes-cours.html'; 

    } catch (error) {
        console.error("Erreur upload:", error);
        alert("Erreur lors de l'envoi du reçu.");
        btn.innerHTML = originalText;
    }
};

// End of file


function showError(msg) {
    document.getElementById('loading-state').innerHTML = `<p class="text-red-500 font-bold">${msg}</p>`;
}
