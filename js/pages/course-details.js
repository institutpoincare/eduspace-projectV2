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

window.buyCourse = () => {
    const courseTitle = document.getElementById('course-title').textContent;
    // Simulate purchase flow
    alert(`Redirection vers la passerelle de paiement pour : ${courseTitle}`);
};

function showError(msg) {
    document.getElementById('loading-state').innerHTML = `<p class="text-red-500 font-bold">${msg}</p>`;
}
