
document.addEventListener('DOMContentLoaded', async () => {
    if (window.dataManager) await dataManager.init();
    lucide.createIcons();
    loadCoursePlayer();
});

let currentCourse = null;
let currentEnrollment = null;
let activeLesson = null;
let activeChapter = null;

// Quiz State
// Quiz State - Instance Based (Refactor)
let activeQuizRunner = null;
// Deprecated Globals (kept null to avoid runtime RefErrors if missed interactions exist, but should rely on Runner)
// let activeQuiz = null; 
// let currentQuestionIndex = 0; 
// let quizAnswers = {};

async function loadCoursePlayer() {
    // 1. Get Course ID
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');

    if (!courseId) {
        alert("Cours non spécifié");
        window.location.href = 'mes-cours.html';
        return;
    }

    // 2. Fetch Data
    currentCourse = await dataManager.getById('courses', courseId);
    if (!currentCourse) {
        alert("Cours introuvable");
        window.location.href = 'mes-cours.html';
        return;
    }

    // 3. Authentication & Access Logic
    // Try DataManager first, then LocalStorage (fallback for Instructors/Formateurs)
    let user = dataManager.getCurrentUser();
    if (!user) {
        try {
            const local = localStorage.getItem('user');
            if (local) user = JSON.parse(local);
        } catch (e) { console.error("Error reading localStorage:", e); }
    }

    const isPreview = params.get('preview') === 'true';
    
    // Auto-login for Preview Mode
    if (isPreview && !user) {
        console.log("Preview Mode: Using Mock User");
        user = { id: 'preview-user', name: 'Preview Formateur', role: 'formateur' };
    }

    if (!user) {
        // Fix: Redirect to correct login choice page
        window.location.href = '../login-choix.html'; 
        return;
    }

    // Determine if user is an Instructor (Formateur)
    // WE ALLOW ACCESS if role is 'formateur' OR user is the course owner OR preview mode is active
    const isOwner = (currentCourse.instructorId == user.id);
    const isInstructor = (user.role === 'formateur' || user.role === 'instructor') || isOwner || isPreview;

    if (isInstructor) {
        // --- INSTRUCTOR SIMULATION MODE ---
        // Always allow access, no enrollment check needed.
        
        // Banner removed as per UI polish request
        // const nav = document.querySelector('nav'); ...
        
        console.log("Instructor Simulation Mode Active for:", user.name);

    } else {
        // --- NORMAL STUDENT FLOW ---
        const enrollments = await dataManager.getAll('enrollments');
        currentEnrollment = enrollments.find(e => e.studentId === user.id && e.courseId === courseId && e.status === 'active');

        if (!currentEnrollment) {
            // Block un-enrolled students
            alert("Vous n'avez pas accès à ce cours. Veuillez vous inscrire.");
            window.location.href = `details-cours.html?id=${courseId}`;
            return;
        }
    }

    // 4. Update UI Info
    document.title = `${currentCourse.title} - Lecteur EduSpace`;
    document.getElementById('course-title').textContent = currentCourse.title;

    // Update Progress
    if (currentEnrollment) {
        const progress = currentEnrollment.progress || 0;
        document.getElementById('course-progress-bar').style.width = `${progress}%`;
    }

    // 5. Render Sidebar (Curriculum)
    renderPlayerCurriculum();

    // 6. Auto-select first lesson if available
    if (currentCourse.chapters && currentCourse.chapters.length > 0) {
        const firstChapter = currentCourse.chapters[0];
        if (firstChapter.lessons && firstChapter.lessons.length > 0) {
            loadLesson(firstChapter, firstChapter.lessons[0]);
        }
    }
}

function getQuizzesForChapter(courseData, chapterId) {
    if (!courseData || !courseData.quizzes || !Array.isArray(courseData.quizzes)) {
        console.warn("getQuizzesForChapter: No quizzes found in courseData.");
        return [];
    }

    // Convert chapterId to string for consistent comparison
    const targetChapterId = String(chapterId);

    return courseData.quizzes.filter(quiz => {
        // Safe check if quiz has a chapterId, then compare as strings
        return quiz.chapterId && String(quiz.chapterId) === targetChapterId;
    });
}

function renderPlayerCurriculum() {
    const container = document.getElementById('curriculum-container');
    const chapters = currentCourse.chapters || [];
    
    // Update total count if element exists
    const countEl = document.getElementById('total-lessons-count');
    if (countEl) {
        let total = 0;
        chapters.forEach(c => total += (c.lessons ? c.lessons.length : 0));
        countEl.textContent = `${total} Leçons`;
    }

    if (chapters.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
            <i data-lucide="inbox" class="w-8 h-8 opacity-50 mb-2"></i>
            <p>Contenu indisponible</p>
        </div>`;
        lucide.createIcons();
        return;
    }

    container.innerHTML = chapters.map((chapter, cIndex) => {
        const chapterQuizzes = getQuizzesForChapter(currentCourse, chapter.id);
        const isActiveChapter = activeChapter && activeChapter.id === chapter.id;
        
        // Modern Accordion Design
        return `
        <details class="group/chapter mb-3 open:mb-4 transition-all duration-300 ease-in-out" ${isActiveChapter ? 'open' : ''}>
            <summary class="list-none cursor-pointer bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.05] border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 select-none outline-none transition-all duration-300 relative overflow-hidden group-open/chapter:bg-gray-50 dark:group-open/chapter:bg-white/[0.05] group-open/chapter:shadow-lg group-open/chapter:border-gray-200 dark:group-open/chapter:border-white/10 text-left">
                 <!-- Ripple/Glow Effect (Subtle) -->
                 <div class="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover/chapter:opacity-100 transition-opacity duration-500"></div>

                 <div class="flex items-center gap-4 relative z-10 flex-1 min-w-0">
                     <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-slate-400 group-open/chapter:text-violet-600 dark:group-open/chapter:text-violet-400 group-open/chapter:bg-violet-500/10 transition-colors shrink-0">
                        <span class="text-xs font-bold">${cIndex + 1}</span>
                     </div>
                     <div class="flex-1 min-w-0">
                         <h4 class="text-sm font-bold text-gray-700 dark:text-slate-200 group-open/chapter:text-gray-900 dark:group-open/chapter:text-white transition-colors leading-tight truncate pr-2">${chapter.title}</h4>
                         <p class="text-[10px] text-slate-500 mt-0.5 font-medium truncate">
                            ${(chapter.lessons || []).length} leçons
                         </p>
                     </div>
                 </div>

                 <div class="relative z-10 text-slate-500 group-open/chapter:text-violet-500 dark:group-open/chapter:text-violet-400 transition-transform duration-300 group-open/chapter:rotate-180 shrink-0">
                    <i data-lucide="chevron-down" class="w-5 h-5"></i>
                 </div>
            </summary>
            
            <div class="mt-2 pl-2 space-y-1 animate-slide-down origin-top">
                <!-- Wrapper to ensure smooth expansion if needed -->
                <div class="bg-gray-100/50 dark:bg-[#0b1120]/30 rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden p-1">
                ${(chapter.lessons || []).map((lesson, lIndex) => {
                    const isActiveLesson = activeLesson?.id === lesson.id;
                    
                    // Check if lesson has mixed contents
                    const hasContents = lesson.contents && Array.isArray(lesson.contents) && lesson.contents.length > 0;
                    
                    // If lesson has contents array, render each item separately
                    if (hasContents) {
                        return lesson.contents.map((item, itemIndex) => {
                            // FILTER: Hide PDF/File items from sidebar (they are in Resources tab)
                            if (item.type === 'pdf' || item.type === 'file' || item.type === 'document') {
                                return ''; 
                            }

                            let iconName = 'play-circle';
                            let itemTitle = item.title || lesson.title;
                            let badgeText = '';
                            let badgeColor = '';
                            
                            if (item.type === 'video') {
                                iconName = 'play-circle';
                                badgeColor = 'bg-indigo-500/20 text-indigo-300';
                                badgeText = 'Vidéo';
                            } else if (item.type === 'quiz' || item.type === 'native') {
                                iconName = 'brain-circuit';
                                badgeColor = 'bg-purple-500/20 text-purple-300';
                                badgeText = 'Quiz';
                                const qCount = item.data?.questions?.length || item.questions?.length || 0;
                                if (qCount > 0) badgeText = `Quiz · ${qCount}Q`;
                            }
                            
                            const activeClass = isActiveLesson 
                                ? 'bg-violet-600/10 text-violet-700 dark:text-violet-200 border-violet-500/30' 
                                : 'text-gray-500 dark:text-slate-400 border-transparent hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-200';
                            
                            // For quiz items (including 'native'), use startLessonQuiz instead of loadLesson
                            const clickHandler = (item.type === 'quiz' || item.type === 'native')
                                ? `loadLessonById('${chapter.id}', '${lesson.id}'); setTimeout(() => startLessonQuiz(${itemIndex}), 100);`
                                : `loadLessonById('${chapter.id}', '${lesson.id}')`;
                            
                            return `
                            <button onclick="${clickHandler}" 
                                    id="lesson-content-${lesson.id}-${itemIndex}"
                                    class="w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-all duration-200 group/lesson ${activeClass}">
                                
                                <div class="shrink-0 ${isActiveLesson ? 'text-violet-600 dark:text-violet-400' : 'text-slate-600 group-hover/lesson:text-slate-400'}">
                                    <i data-lucide="${iconName}" class="w-4 h-4"></i>
                                </div>

                                <div class="min-w-0 flex-1">
                                    <p class="text-xs font-semibold leading-snug truncate ${isActiveLesson ? 'text-violet-900 dark:text-violet-100' : ''}">
                                        ${itemTitle}
                                    </p>
                                    ${badgeText ? `<span class="text-[9px] font-bold ${badgeColor} px-1.5 py-0.5 rounded mt-1 inline-block">${badgeText}</span>` : ''}
                                </div>
                            </button>
                            `;
                        }).join('');
                    }
                    
                    // Otherwise, render as single lesson (legacy support)
                    // FILTER: Hide standalone PDF lessons
                    if (lesson.type === 'pdf' || lesson.type === 'file' || lesson.type === 'document') {
                        return '';
                    }

                    let iconName = 'play-circle';
                    if (lesson.type === 'quiz') iconName = 'brain-circuit';
                    if (lesson.type === 'pdf' || lesson.type === 'file') iconName = 'file-text';
                    
                    let activeClass = isActiveLesson 
                        ? 'bg-violet-600/10 text-violet-700 dark:text-violet-200 border-violet-500/30' 
                        : 'text-gray-500 dark:text-slate-400 border-transparent hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-200';

                    return `
                    <button onclick="loadLessonById('${chapter.id}', '${lesson.id}')" 
                            id="lesson-btn-${lesson.id}"
                            class="w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-all duration-200 group/lesson ${activeClass}">
                        
                        <div class="shrink-0 ${isActiveLesson ? 'text-violet-600 dark:text-violet-400' : 'text-slate-600 group-hover/lesson:text-slate-400'}">
                            <i data-lucide="${iconName}" class="w-4 h-4"></i>
                        </div>

                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-semibold leading-snug truncate ${isActiveLesson ? 'text-violet-900 dark:text-violet-100' : ''}">
                                ${lesson.title}
                            </p>
                            ${isActiveLesson ? `
                            <div class="flex items-center gap-1.5 mt-1">
                                <span class="relative flex h-2 w-2">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                                </span>
                                <span class="text-[9px] font-bold text-violet-400 uppercase tracking-wide">En lecture</span>
                            </div>` : ''}
                        </div>
                        
                        ${lesson.duration ? `<span class="text-[10px] text-slate-600 font-mono opacity-0 group-hover/lesson:opacity-100 transition-opacity">${lesson.duration}</span>` : ''}
                    </button>
                    `;
                }).join('')}
                
                ${chapterQuizzes.length > 0 ? chapterQuizzes.map((quiz) => {
                    const globalIndex = currentCourse.quizzes.indexOf(quiz);
                    return `
                    <button onclick="startQuiz(${globalIndex})" 
                            class="w-full text-left p-3 rounded-lg border border-transparent hover:bg-purple-500/10 text-slate-400 hover:text-purple-300 flex items-center gap-3 transition-colors group/quiz mt-1">
                        <div class="shrink-0 text-slate-600 group-hover/quiz:text-purple-400">
                             <i data-lucide="trophy" class="w-4 h-4"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-semibold leading-snug text-purple-400/80 group-hover/quiz:text-purple-300">Quiz: ${quiz.title}</p>
                        </div>
                    </button>
                `}).join('') : ''}
                </div>
            </div>
        </details>
        `;
    }).join('');
    
    lucide.createIcons();
}

window.loadLessonById = (chapterId, lessonId) => {
    // Use loose equality (==) to handle String vs Number ID mismatch
    const chapter = currentCourse.chapters.find(c => c.id == chapterId);
    if (!chapter) return;
    const lesson = chapter.lessons.find(l => l.id == lessonId);
    if (!lesson) return;
    loadLesson(chapter, lesson);
};

window.startActiveQuiz = () => {
    console.log("startActiveQuiz (User Fix) called. ActiveLesson:", activeLesson);
    
    if (!activeLesson) {
        showToast("Erreur: Leçon non chargée", "error");
        return;
    }

    // Direct Logic (User Pattern)
    // If the lesson IS a quiz, use its data directly. Don't rely on 'contents'.
    // Support both 'quiz' and 'native' types
    let quizData = null;
    
    if (activeLesson.type === 'quiz' || activeLesson.type === 'native') {
        // For root-level quiz/native lessons, support both formats
        quizData = activeLesson.data || activeLesson;
    } else {
        // For lessons with contents array, find quiz/native item
        const quizItem = activeLesson.contents?.find(c => c.type === 'quiz' || c.type === 'native');
        if (quizItem) {
            quizData = quizItem.data || quizItem;
        }
    }

    if (quizData && quizData.questions) {
        startQuiz(quizData);
    } else {
        console.error("StartActiveQuiz: No data found in lesson", activeLesson);
        showToast("Impossible de lancer le quiz (Données manquantes).", "error");
    }
};

window.startLessonQuiz = (contentIndex) => {
    // Keep for backward compatibility / list items
    console.log("startLessonQuiz index:", contentIndex);
    if (!activeLesson || !activeLesson.contents || !activeLesson.contents[contentIndex]) return;
    const item = activeLesson.contents[contentIndex];
    
    // Support both old format (item.data) and new format (item directly contains quiz data)
    const quizData = item.data || item;
    if (quizData && quizData.questions) {
        startQuiz(quizData);
    } else {
        console.error("Quiz data missing in content item", item);
        showToast("Impossible de lancer le quiz (Données manquantes).", "error");
    }
};

/**
 * Universal Content Renderer - Clean Vanilla JS Version
 * Renders Video and Quiz content only (PDF hidden)
 * @param {Array} contentList - Array of content items from lesson.contents
 * @param {number} heroIndex - Index of the hero item to skip (already rendered in main player)
 * @returns {string} HTML string for inline content display
 */
function renderLessonContent(contentList, heroIndex = -1) {
    // 1. Safety Check: If no content or empty array
    if (!contentList || contentList.length === 0) {
        return '<div class="text-gray-400 p-10 text-center">Aucun contenu disponible.</div>';
    }

    // 2. Filter out hero content (already displayed in main player area)
    const nonHeroContents = contentList.filter((item, idx) => idx !== heroIndex);
    
    if (nonHeroContents.length === 0) {
        return '<div class="text-gray-400 p-10 text-center">Tout le contenu est affiché dans le lecteur principal.</div>';
    }

    // 3. Build HTML String for each content item
    const contentHTML = nonHeroContents.map((item, originalIndex) => {
        const actualIndex = contentList.indexOf(item); // Get original index for onclick handlers
        const itemType = item.type || 'unknown';
        const itemTitle = item.title || `Élément ${actualIndex + 1}`;
        const itemUrl = item.content || item.url || ''; // Handle both 'content' and 'url' fields

        // --- CASE A: VIDEO ---
        if (itemType === 'video') {
            // Process video URL for Google Drive
            let videoSrc = itemUrl;
            if (videoSrc.includes('drive.google.com')) {
                videoSrc = videoSrc.replace(/\/view.*/, '/preview');
            } else if (videoSrc.includes('watch?v=')) {
                const videoId = videoSrc.split('v=')[1].split('&')[0];
                videoSrc = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
            }

            return `
            <div class="w-full mb-12">
                <div class="bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-700 relative" style="padding-top: 56.25%;">
                    <iframe 
                        src="${videoSrc}" 
                        class="absolute inset-0 w-full h-full"
                        allow="autoplay; fullscreen"
                        title="${itemTitle}"
                        allowfullscreen>
                    </iframe>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-4 ml-2">🎥 ${itemTitle}</h3>
            </div>`;
        }

        // --- CASE B: QUIZ (Native & Quiz) ---
        if (itemType === 'quiz' || itemType === 'native') {
            const questions = item.questions || (item.data ? item.data.questions : []) || [];
            const qCount = questions.length;
            
            return `
            <div class="w-full mb-12">
                <div class="bg-gradient-to-br from-indigo-900/50 to-violet-900/50 p-10 rounded-3xl border border-violet-500/30 text-center shadow-lg hover:shadow-violet-900/20 transition-all">
                    <div class="text-5xl mb-6">🧩</div>
                    <h2 class="text-3xl font-bold text-white mb-3">${itemTitle}</h2>
                    <p class="text-indigo-200 mb-8 text-lg">${qCount} Questions • Testez vos connaissances</p>
                    
                    <button 
                        onclick="startLessonQuiz(${actualIndex})" 
                        class="bg-white text-violet-900 hover:bg-violet-50 px-10 py-4 rounded-xl font-bold text-lg shadow-xl transition-transform hover:scale-105 cursor-pointer">
                        Lancer le Quiz
                    </button>
                </div>
            </div>`;
        }

        // PDF & OTHER TYPES: Hidden from main view (Only shows in Resources tab)
        return ''; 
    }).join('');

    // 4. Wrap content in container
    if (!contentHTML) {
        return '<div class="text-gray-400 p-10 text-center">Aucun contenu vidéo ou quiz disponible.</div>';
    }

    return `
    <div class="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-6 md:p-8 mt-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i data-lucide="layers" class="w-5 h-5 text-violet-400"></i> Contenu du Module
        </h3>
        <div class="space-y-8 p-6 pb-20 max-w-5xl mx-auto w-full">
            ${contentHTML}
        </div>
    </div>`;
}

function loadLesson(chapter, lesson) {
    // 0. RESET STATE IMMEDIATELY (Fix Bug 1/5)
    if(activeQuizRunner) {
        activeQuizRunner.cleanup(); // Clean DOM if needed
        activeQuizRunner = null;
    }
    // activeQuiz = null; // Deprecated
    // currentQuestionIndex = 0;
    // quizAnswers = {};
    document.body.style.overflow = ''; // Ensure scroll re-enabled
    const modal = document.getElementById('quiz-modal'); // Hide quiz modal if open
    if(modal) modal.remove(); // Force Key Prop equivalent DESTROY

    activeChapter = chapter;
    activeLesson = lesson;

    // 1. Normalize Data FIRST (Handle Structural Mismatches)
    console.log("Loading Lesson:", lesson);

    let contents = [];

    // 1. AGGRESSIVE OVERRIDE: Root-Level Quiz
    if (lesson.type === 'quiz' && lesson.data) {
        console.log("Detected Root-Level Quiz (Force):", lesson.data);
        contents = [{ 
            type: 'quiz', 
            data: lesson.data, 
            content: lesson.content || 'Évaluation'
        }];
    } 
    // 2. Standard Contents Array
    else if (lesson.contents && lesson.contents.length > 0) {
        contents = lesson.contents;
    }
    // 3. Fallback: Legacy Root-Level Video/Content
    else if (lesson.content || lesson.video || lesson.link) {
        contents = [{ 
            type: lesson.type || 'video', 
            content: lesson.content || lesson.video || lesson.link,
            meta: lesson.meta
        }];
    }

    // Separation: Main Video (Player) vs Body Content vs Main Quiz
    // Ensure activeLesson has the normalized contents for helper functions like startLessonQuiz
    activeLesson.contents = contents;

    // Priority: Video > Quiz > Other
    let heroIndex = -1;
    const videoIndex = contents.findIndex(c => c.type === 'video');
    const quizIndex = contents.findIndex(c => c.type === 'quiz' || c.type === 'native');
    
    if (videoIndex > -1) heroIndex = videoIndex;
    else if (quizIndex > -1) heroIndex = quizIndex;

    const heroItem = heroIndex > -1 ? contents[heroIndex] : null;

    // 2. Update UI Selection
    renderPlayerCurriculum(); // Re-render to highlight active

    // --- 3. Render Inline Mixed Content (NEW: Universal Handler) ---
    const inlineContentHTML = renderLessonContent(contents, heroIndex);
    
    // --- 5. Select Main Content Container (FIX: Declare before use) ---
    const overviewContainer = document.getElementById('content-overview') || document.querySelector('.flex-1.relative');
    
    if (!overviewContainer) {
        console.error("ERROR: Cannot find main content container (overviewContainer)!");
        return;
    }
    
    // --- 6. Get Instructor Name (FIX: Declare before use) ---
    const instructorName = currentCourse.instructor || 'Instructeur';
    
    // --- 7. Calculate Progress Stats (FIX: Declare before use) ---
    const progressVal = currentEnrollment ? (currentEnrollment.progress || 0) : 0;
    
    // Calculate total lessons in course
    const totalLessonsHere = currentCourse.chapters 
        ? currentCourse.chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0) 
        : 0;
    
    // Calculate completed lessons (simplified - you can enhance this)
    const rankInCourse = Math.floor((progressVal / 100) * totalLessonsHere);
    
    // Inject Rich HTML Grid (UPDATED with inline content)
    overviewContainer.className = "grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in";
    overviewContainer.innerHTML = `
        <!-- Left: Description (2 Cols) -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Lesson Title (Restored) -->
            <div class="mb-2">
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">${lesson.title}</h2>
            </div>


            
            ${inlineContentHTML}


        </div>

        <!-- Right: Progress & Stats (1 Col) -->
        <div class="space-y-6">
            <!-- Progress Card -->
            <div class="bg-white dark:bg-gradient-to-br dark:from-indigo-900/40 dark:to-violet-900/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden group shadow-sm dark:shadow-none">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i data-lucide="trending-up" class="w-24 h-24 text-gray-400 dark:text-white"></i>
                </div>
                
                <h4 class="text-gray-900 dark:text-white font-bold text-lg mb-1">Votre Progression</h4>
                <p class="text-xs text-indigo-600 dark:text-indigo-200 mb-6">Continuez comme ça !</p>

                <div class="flex items-center gap-4 mb-6">
                    <div class="relative w-16 h-16">
                        <svg class="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="6" fill="transparent" class="text-gray-200 dark:text-black/30" />
                            <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="6" fill="transparent" stroke-dasharray="175.9" stroke-dashoffset="${175.9 - (175.9 * progressVal) / 100}" class="text-violet-500 transition-all duration-1000 ease-out" />
                        </svg>
                        <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">${progressVal}%</span>
                    </div>
                    <div>
                        <span class="block text-2xl font-bold text-gray-900 dark:text-white">${rankInCourse}<span class="text-xs text-gray-400 dark:text-white/50">/${totalLessonsHere}</span></span>
                        <span class="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-300 tracking-wider">Leçons complétées</span>
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="flex justify-between text-xs text-slate-400">
                        <span>Certificat</span>
                        <span class="text-white font-bold"><i data-lucide="lock" class="w-3 h-3 inline mb-0.5"></i> Verrouillé</span>
                    </div>
                    <div class="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                        <div class="h-full bg-slate-600 w-[0%]"></div>
                    </div>
                </div>
            </div>

            <!-- Next Lesson Teaser (Static for now, dynamic logic possible) -->
             <div class="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/5 rounded-2xl p-5 hover:border-violet-500/30 transition-colors cursor-pointer group/next shadow-sm dark:shadow-none" onclick="nextLesson()"> <!-- Reusing next logic or custom -->
                <p class="text-[10px] text-fuchsia-600 dark:text-fuchsia-400 font-bold uppercase tracking-widest mb-2">À suivre</p>
                <h5 class="text-gray-900 dark:text-white font-bold text-sm mb-1 group-hover/next:text-fuchsia-600 dark:group-hover/next:text-fuchsia-300 transition-colors">Chapitre Suivant</h5>
                <p class="text-xs text-gray-500">Préparez-vous pour la suite du module.</p>
            </div>
        </div>
    `;


    // 3. Content Rendering Logic
    const videoSection = document.getElementById('video-container'); // Top: Video
    
    // Target the 'Resources' Tab for non-main content (hidden by default)
    const resourcesTabContent = document.getElementById('content-resources');
    let dynamicResContainer = document.getElementById('dynamic-lesson-content');
    
    if (resourcesTabContent && !dynamicResContainer) {
        dynamicResContainer = document.createElement('div');
        dynamicResContainer.id = 'dynamic-lesson-content';
        dynamicResContainer.className = "mb-8 space-y-6";
        resourcesTabContent.prepend(dynamicResContainer);
    }
    
    if (dynamicResContainer) dynamicResContainer.innerHTML = ''; // Reset

    // Render Hero Area
    if (heroItem && heroItem.type === 'video') {
         // --- VIDEO PLAYER ---
         const cover = currentCourse.cover || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800';
         
         videoSection.innerHTML = `
             <img src="${cover}" class="absolute inset-0 w-full h-full object-cover opacity-50">
             <button id="btn-play-overlay" class="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 transition-transform cursor-pointer z-10 relative">
                 <i data-lucide="play" class="w-8 h-8 fill-current ml-1"></i>
             </button>
             <div id="video-wrapper" class="absolute inset-0 w-full h-full hidden"></div>
         `;
         
         const playBtn = document.getElementById('btn-play-overlay');
         if(playBtn) {
             playBtn.onclick = () => {
                 const videoUrl = heroItem.content || heroItem.url;
                 let finalSrc = videoUrl;
                 if (finalSrc) {
                    if (finalSrc.includes('drive.google.com')) {
                        finalSrc = finalSrc.replace(/\/view.*/, '/preview');
                    } else if (finalSrc.includes('youtube.com/watch?v=')) {
                        const videoId = finalSrc.split('v=')[1].split('&')[0];
                        finalSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                    } else if (finalSrc.includes('youtu.be/')) {
                        const videoId = finalSrc.split('youtu.be/')[1].split('?')[0];
                        finalSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                    } else if (finalSrc.includes('youtube.com/embed/')) {
                        if (!finalSrc.includes('?')) finalSrc += '?autoplay=1';
                    }
                 }
                 console.log("Play Hero Video:", finalSrc);
                 videoSection.innerHTML = `
                    <div class="w-full h-full relative" oncontextmenu="return false;">
                        <iframe id="video-player" src="${finalSrc}" sandbox="allow-scripts allow-same-origin allow-presentation" class="w-full h-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
                    </div>
                 `;
             };
         }
    } else if (heroItem && (heroItem.type === 'quiz' || heroItem.type === 'native')) {
         // --- QUIZ HERO ---
         // If the lesson is primarily a Quiz, show it here!
         const qData = heroItem.data || heroItem.questions || {};
         const qTitle = heroItem.title || qData.title || heroItem.content || 'Évaluation';
         const qCount = heroItem.questions?.length || qData.questions?.length || 0;
         
         // --- MODERN QUIZ HERO DESIGN (Responsive Fix) ---
         videoSection.innerHTML = `
             <div class="absolute inset-0 w-full h-full bg-[#0f0c29] overflow-hidden flex flex-col items-center justify-center">
                 <!-- Animated Background Mesh -->
                 <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[100px] animate-blob"></div>
                 <div class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
                 <div class="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-pink-600/20 rounded-full blur-[80px] animate-blob animation-delay-4000"></div>
                 
                 <div class="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>

                 <!-- Content -->
                 <div class="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center px-6 py-8">
                     
                     <div class="mb-6 md:mb-8 relative group">
                         <div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                         <div class="relative w-20 h-20 md:w-24 md:h-24 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl">
                             <i data-lucide="brain-circuit" class="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"></i>
                         </div>
                     </div>

                     <h2 class="text-3xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-purple-200 mb-4 tracking-tight drop-shadow-sm leading-tight">
                         ${qTitle}
                     </h2>
                     
                     <div class="flex items-center gap-3 text-indigo-200/80 mb-8 md:mb-10 text-base md:text-lg font-medium">
                         <span class="flex items-center gap-1.5"><i data-lucide="help-circle" class="w-4 h-4"></i> ${qCount} Questions</span>
                         <span class="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></span>
                         <span class="flex items-center gap-1.5"><i data-lucide="trophy" class="w-4 h-4"></i> Évaluation</span>
                     </div>
                     
                     <button onclick="startActiveQuiz()" class="group relative px-8 py-4 md:px-10 md:py-5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white rounded-2xl font-bold text-lg md:text-xl hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] active:scale-95 overflow-hidden">
                         <div class="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-0 transition-transform duration-500"></div>
                         <div class="flex items-center gap-3 relative z-10">
                             <span>Commencer l'épreuve</span>
                             <i data-lucide="arrow-right" class="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform"></i>
                         </div>
                     </button>
                 </div>
             </div>
         `;
         lucide.createIcons();
    } else {
        // Placeholder
        videoSection.innerHTML = `
             <img src="${currentCourse.cover || ''}" class="absolute inset-0 w-full h-full object-cover opacity-20">
             <div class="absolute inset-0 flex items-center justify-center text-gray-500 font-bold">Lecture</div>
        `;
    }

    // Render Body Content into RESOURCES TAB
    contents.forEach((item, index) => {
        if (index === heroIndex) return; // Skip Hero Item (Video or Quiz)
        
        if (dynamicResContainer) {
            const wrapper = document.createElement('div');
            // No wrapping style needed for the button itself if we style the button
            
            if (item.type === 'pdf' || item.type === 'file' || item.meta === 'file' || item.meta === 'drive') {
                 let url = item.content;
                 
                 // SPECIAL CASE: DRIVE FOLDER LINK -> Use new Modal
                 if (url && url.includes('/folders/')) {
                     wrapper.innerHTML = `
                        <button onclick="openDriveFolderModal('${url}')" 
                                class="w-full text-left bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl p-4 shadow-sm transition-all group flex items-center justify-between mb-4">
                            
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <i data-lucide="folder-open" class="w-6 h-6"></i>
                                </div>
                                
                                <div>
                                    <h4 class="font-bold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                        Ouvrir le Dossier des Ressources
                                    </h4>
                                    <p class="text-xs text-gray-500 dark:text-slate-400">Accéder à tous les fichiers (Drive) de ce cours</p>
                                </div>
                            </div>

                            <div class="p-2 bg-white dark:bg-white/10 rounded-full text-gray-400 group-hover:text-blue-600 shadow-sm">
                                <i data-lucide="external-link" class="w-5 h-5"></i>
                            </div>
                        </button>
                     `;
                     dynamicResContainer.appendChild(wrapper);
                     return; 
                 }

                 if (item.content && item.content.includes('drive.google.com')) {
                     url = url.split('/view')[0] + '/preview';
                 }
                 
                 // Render as Clickable Card opening Modal
                 wrapper.innerHTML = `
                    <button onclick="openPDFModal('${url}', '${item.type.toUpperCase()} - Ressource')" class="w-full text-left bg-white border border-gray-100 hover:border-orange-200 hover:bg-orange-50 rounded-xl p-4 shadow-sm transition-all group flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <i data-lucide="file-text" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-900 group-hover:text-orange-700">Consulter le document PDF</h4>
                                <p class="text-xs text-gray-500">Cliquez pour ouvrir en plein écran</p>
                            </div>
                        </div>
                        <div class="p-2 bg-white rounded-full text-gray-400 group-hover:text-orange-600 shadow-sm">
                            <i data-lucide="maximize-2" class="w-5 h-5"></i>
                        </div>
                    </button>
                 `;
                 dynamicResContainer.appendChild(wrapper);
                 
            } else if (item.type === 'video') {
                 let url = item.content || item.url;
                 if (url.includes('drive.google.com')) url = url.replace(/\/view.*/, '/preview');
                 else if (url.includes('watch?v=')) url = `https://www.youtube.com/embed/${url.split('v=')[1]}?autoplay=0`;
                 
                 wrapper.innerHTML = `
                    <div class="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                        <i data-lucide="video" class="w-5 h-5 text-indigo-500"></i> Vidéo Complémentaire
                    </div>
                    <div class="aspect-video" oncontextmenu="return false;">
                        <iframe src="${url}" sandbox="allow-scripts allow-same-origin allow-presentation" width="100%" height="100%" style="border: none;" class="rounded-lg" allowfullscreen></iframe>
                    </div>
                 `;
                 dynamicResContainer.appendChild(wrapper);
            } else if (item.type === 'quiz' || item.type === 'native') {
             // Quiz Card triggering the Modal (handles both 'quiz' and 'native' types)
             wrapper.innerHTML = `
                <button onclick="startLessonQuiz(${index})" class="w-full text-left bg-white border border-gray-100 hover:border-purple-200 hover:bg-purple-50 rounded-xl p-4 shadow-sm transition-all group flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                            <i data-lucide="brain" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900 group-hover:text-purple-700">${item.title || (item.data && item.data.title) || item.content || 'Évaluation'}</h4>
                            <p class="text-xs text-gray-500">${(item.questions?.length || item.data?.questions?.length || 0) > 0 ? (item.questions?.length || item.data.questions.length) + ' questions' : 'Cliquez pour commencer'}</p>
                        </div>
                    </div>
                    <div class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold shadow-md shadow-purple-200 group-hover:bg-purple-700 transition-colors">
                        Commencer
                    </div>
                </button>
             `;
             dynamicResContainer.appendChild(wrapper);
        }
        }
    });

    lucide.createIcons();

    // 4. Load Related Content (Quizzes & PDFs)
    loadRelatedContent(chapter);

    // Switch to Overview tab by default (Hides Resources/PDF)
    switchTab('overview');
}

function loadRelatedContent(chapter) {
    // 1. Get Quizzes using the helper function
    const quizzes = getQuizzesForChapter(currentCourse, chapter.id);
    
    // Update Quiz Badge (Safety Check)
    const quizBadge = document.getElementById('badge-quizzes');
    if (quizBadge) {
        quizBadge.textContent = quizzes.length;
        quizBadge.classList.toggle('hidden', quizzes.length === 0);
    }

    // Render Quizzes (Safety Check)
    const quizList = document.getElementById('quiz-list');
    if (quizList) {
        if (quizzes.length === 0) {
            quizList.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i data-lucide="check-circle" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                    <p>Aucun quiz pour ce chapitre.</p>
                </div>
            `;
        } else {
            quizList.innerHTML = quizzes.map(quiz => {
                const globalIndex = currentCourse.quizzes.indexOf(quiz);
                return `
                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-white border border-gray-200 dark:border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <i data-lucide="help-circle" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900">${quiz.title}</h4>
                            <p class="text-xs text-gray-500">Quiz • ${quiz.questions ? quiz.questions.length : '?'} questions</p>
                        </div>
                    </div>
                    <button onclick="startQuiz(${globalIndex})" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors">
                        Commencer
                    </button>
                </div>
            `}).join('');
        }
    }
    
    // Render Resources (Filter from chapter.lessons)
    const resourceList = document.getElementById('resources-list');
    
    // Filter items where type is 'pdf', 'document', or 'file'
    const resources = (chapter.lessons || []).filter(item => 
        ['pdf', 'document', 'file'].includes(item.type)
    );
    
    // Update Resource Badge (Safety Check)
    const resourceBadge = document.getElementById('badge-resources');
    if (resourceBadge) {
        resourceBadge.textContent = resources.length;
        resourceBadge.classList.toggle('hidden', resources.length === 0);
    }

    // Render Resources (Safety Check)
    if (resourceList) {
        if (resources.length === 0) {
            resourceList.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i data-lucide="folder-open" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                    <p>Aucune ressource disponible pour ce chapitre.</p>
                </div>
            `;
        } else {
            resourceList.innerHTML = resources.map(res => {
                // Determine icon based on type (simple logic)
                let icon = 'file-text';
                if (res.type === 'pdf') icon = 'file';
                
                // Prepare proper URL for embed
                let fileUrl = res.url || res.content;
                if (fileUrl && fileUrl.includes('drive.google.com') && fileUrl.includes('/view')) {
                     fileUrl = fileUrl.replace('/view', '/preview');
                }

                return `
                <div class="flex items-center justify-between p-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group cursor-pointer" onclick="openPdfModal('${fileUrl}', '${res.title}')">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30 transition-colors">
                            <i data-lucide="${icon}" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900 dark:text-white text-sm">${res.title}</h4>
                            <p class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider">${res.type}</p>
                        </div>
                    </div>
                    <button class="p-2 bg-white/50 dark:bg-white/10 rounded-lg hover:bg-white/80 dark:hover:bg-white/20 text-gray-600 dark:text-white transition-colors">
                        <i data-lucide="maximize-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `}).join('');
        }
    }
}

// --- NEW FUNCTION: Open PDF Modal ---
window.openPdfModal = (url, title) => {
    // Remove existing modal if any
    const existing = document.getElementById('pdf-modal-viewer');
    if (existing) existing.remove();

    const modalHTML = `
    <div id="pdf-modal-viewer" class="fixed inset-0 z-[70] bg-white/95 dark:bg-black/90 flex flex-col animate-fade-in backdrop-blur-sm">
        <div class="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0">
            <h3 class="text-gray-900 dark:text-white font-bold truncate pr-4">${title}</h3>
            <button onclick="document.getElementById('pdf-modal-viewer').remove()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-white hover:text-red-500 dark:hover:text-white transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>
        <div class="flex-1 w-full bg-gray-50 dark:bg-gray-800 relative">
             <iframe src="${url}" class="absolute inset-0 w-full h-full" border="0"></iframe>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    lucide.createIcons();
};

window.switchTab = (tabName) => {
    console.log("Switching to tab:", tabName);
    
    const tabs = ['overview', 'resources', 'quiz'];
    
    // Hide all contents and reset buttons
    tabs.forEach(t => {
        const content = document.getElementById(`content-${t}`);
        const btn = document.getElementById(`tab-${t}`);
        
        if(content) content.classList.add('hidden');
        if(btn) {
            btn.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600');
            btn.classList.add('text-gray-500');
        }
    });

    // Show active content and highlight button
    const activeContent = document.getElementById(`content-${tabName}`);
    const activeBtn = document.getElementById(`tab-${tabName}`);
    
    if (activeContent) {
        activeContent.classList.remove('hidden');
    } else {
        console.error(`Content area not found for tab: ${tabName}`);
    }

    if (activeBtn) {
        activeBtn.classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600');
        activeBtn.classList.remove('text-gray-500');
    } else {
        console.error(`Button not found for tab: ${tabName}`);
    }
};

// --- Quiz Logic ---

// --- Quiz Logic ---

// --- Quiz Logic (Class-Based Refactor) ---

// --- Quiz Logic (Class-Based Refactor) ---
// activeQuizRunner is defined globally at file start

class QuizRunner {
    constructor(data) {
        this.quiz = data;
        this.questions = data.questions || [];
        this.idx = 0; // Current Question Index
        this.answers = {}; // { index: value }
        
        // Safety Fallback
        if (this.questions.length === 0) {
            this.questions = [{ text: "Question Test ?", options: ["Oui", "Non"], correct: 0 }];
        }
    }

    init() {
        // 1. Force DOM Cleanup (Key Prop equivalent)
        this.cleanup();

        // 2. Inject Fresh HTML
        this.injectModal();

        // 3. Show
        const modal = document.getElementById('quiz-modal');
        if(modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
        document.body.style.overflow = 'hidden';

        // 4. Render First Question
        this.render();
    }
    
    cleanup() {
        const oldModal = document.getElementById('quiz-modal');
        if (oldModal) oldModal.remove();
        document.body.style.overflow = '';
    }

    injectModal() {
        const modal = document.getElementById('quiz-modal');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // 4. Render First Question
        this.render();
    }

    injectModal() {
        const title = this.quiz.title || 'Quiz';
        const total = this.questions.length;
        
        const html = `
        <div id="quiz-modal" class="fixed inset-0 z-[70] bg-white/95 dark:bg-gray-900 hidden flex flex-col animate-fade-in">
            <!-- Top Bar -->
            <div class="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shrink-0">
                <div class="flex items-center gap-6">
                    <div class="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm">
                        <span id="quiz-header-progress">1/${total}</span>
                    </div>
                    <div class="border-l border-gray-300 dark:border-gray-700 pl-6 h-8 flex items-center">
                        <div>
                            <h3 class="font-bold text-lg leading-none mb-1 text-gray-900 dark:text-white">${title}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">Question <span id="quiz-header-qnum">1</span></p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <button onclick="closeQuizModal()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-white transition-colors">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 overflow-y-auto flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
                <div id="quiz-card" class="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl shadow-xl dark:shadow-2xl p-8 md:p-12 relative overflow-hidden min-h-[400px] flex flex-col justify-center border border-gray-100 dark:border-transparent">
                     
                     <div id="quiz-question-container" class="max-w-2xl mx-auto w-full">
                        <h2 id="question-text" class="text-3xl font-bold text-gray-900 dark:text-white mb-10 text-center leading-snug">Chargement...</h2>
                        <div id="options-container" class="space-y-4 mb-12"></div>
                        
                        <!-- Controls -->
                        <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-8" id="quiz-controls">
                            <button id="btn-prev-question" onclick="prevQuestion()" class="flex items-center gap-2 px-6 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                <i data-lucide="arrow-left" class="w-5 h-5"></i> Précédent
                            </button>
                            <button id="btn-next-question" onclick="nextQuestion()" class="flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-black dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                                Suivant <i data-lucide="arrow-right" class="w-5 h-5"></i>
                            </button>
                            <button id="btn-finish-quiz" onclick="finishQuiz()" class="hidden flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                                Terminer <i data-lucide="check" class="w-5 h-5"></i>
                            </button>
                        </div>
                     </div>

                     <!-- Results -->
                     <div id="quiz-result-container" class="hidden text-center w-full animate-fade-in-up">
                        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-600 mb-8 shadow-sm"><i data-lucide="trophy" class="w-10 h-10"></i></div>
                        <h2 class="text-4xl font-bold text-gray-900 mb-4">Félicitations !</h2>
                        <p class="text-gray-500 text-lg mb-10">Vous avez terminé le quiz avec succès.</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
                            <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div class="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Score Final</div>
                                <div id="result-score" class="text-4xl font-black text-indigo-600">0%</div>
                            </div>
                            <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div class="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Correct</div>
                                <div id="result-correct" class="text-4xl font-black text-green-600">0</div>
                            </div>
                            <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div class="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Incorrect</div>
                                <div id="result-wrong" class="text-4xl font-black text-red-500">0</div>
                            </div>
                        </div>

                        <button onclick="closeQuizModal()" class="px-10 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:scale-105 flex items-center gap-3 mx-auto">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i> Retour au cours
                        </button>
                     </div>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', html);
        lucide.createIcons();
    }

    render() {
        const q = this.questions[this.idx];
        const container = document.getElementById('options-container');
        
        // Header
        const progress = document.getElementById('quiz-header-progress');
        if(progress) progress.textContent = `${this.idx + 1}/${this.questions.length}`;
        const qNum = document.getElementById('quiz-header-qnum');
        if(qNum) qNum.textContent = this.idx + 1;
        
        // Text
        const textEl = document.getElementById('question-text');
        if(textEl) textEl.innerHTML = q.text || q.title || "Question";

        // Render Math in Title
        if(typeof renderMathInElement === 'function' && textEl) {
             renderMathInElement(textEl, { delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false });
        }

        // Body
        container.innerHTML = '';
        
        // Safe Init
        if (this.answers[this.idx] === undefined) {
             if (q.type === 'image_choice' || q.type === 'ordering') this.answers[this.idx] = [];
             if (q.type === 'cloze') this.answers[this.idx] = {};
        }

        // Delegate Type
        switch(q.type) {
            case 'image_choice': this.renderImageChoice(container, q); break;
            case 'ordering': this.renderOrdering(container, q); break;
            case 'cloze': this.renderCloze(container, q); break;
            case 'code': this.renderCode(container, q); break;
            case 'matching': this.renderMatching(container, q); break;
            default: this.renderBasic(container, q); break;
        }

        // Render Math in Body
        if(typeof renderMathInElement === 'function') {
             renderMathInElement(container, { delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false });
        }

        // Buttons
        const next = document.getElementById('btn-next-question');
        const prev = document.getElementById('btn-prev-question');
        const finish = document.getElementById('btn-finish-quiz');
        
        if (this.idx === this.questions.length - 1) {
            if(next) next.classList.add('hidden');
            if(finish) finish.classList.remove('hidden');
        } else {
            if(next) next.classList.remove('hidden');
            if(finish) finish.classList.add('hidden');
        }
        
        // Prev button visibility
        if (this.idx === 0) {
            if(prev) prev.classList.add('opacity-30', 'cursor-not-allowed');
        } else {
            if(prev) prev.classList.remove('opacity-30', 'cursor-not-allowed');
        }

        lucide.createIcons();
    }
    
    // --- Renderers ---

    renderBasic(container, q) {
        let opts = q.options;
        if (!opts && q.type === 'boolean') opts = ["Vrai", "Faux"];
        if (!opts) opts = ["Option 1", "Option 2"];

        container.className = "space-y-4 mb-4";
        container.innerHTML = opts.map((opt, i) => {
            const isSel = this.answers[this.idx] === i;
            const char = String.fromCharCode(65 + i);
            return `
            <button onclick="selectOption(${i})" class="w-full text-left p-5 rounded-2xl border-2 transition-all group flex items-center gap-5 ${isSel ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border-2 transition-colors shrink-0 ${isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-500 group-hover:border-gray-400'}">
                    ${char}
                </div>
                <span class="text-lg font-medium text-gray-800 ${isSel ? 'text-indigo-900 font-bold' : ''}">${opt}</span>
                ${isSel ? '<i data-lucide="check-circle" class="w-6 h-6 text-indigo-600 ml-auto fill-current text-opacity-10"></i>' : ''}
            </button>`;
        }).join('');
    }

    renderImageChoice(container, q) {
        const sel = this.answers[this.idx] || [];
        container.className = "grid grid-cols-2 md:grid-cols-3 gap-6";
        container.innerHTML = q.options.map(opt => {
            const isSel = sel.includes(opt.id);
            return `
            <div onclick="toggleImageSelect('${opt.id}')" class="relative group cursor-pointer transition-all duration-300 transform hover:scale-[1.02]">
                <div class="rounded-2xl overflow-hidden border-4 ${isSel ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-transparent shadow-lg'}">
                    <img src="${opt.image}" class="w-full h-48 object-cover ${isSel ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'} transition-opacity">
                </div>
                ${isSel ? '<div class="absolute top-4 right-4 bg-indigo-600 text-white rounded-full p-1 shadow-lg"><i data-lucide="check" class="w-5 h-5"></i></div>' : ''}
            </div>`;
        }).join('');
    }

    renderOrdering(container, q) {
        let items = this.answers[this.idx];
        if(!items || items.length === 0) {
             items = [...q.items]; // Use original order if no answer yet
             this.answers[this.idx] = items;
        }
        container.className = "space-y-3";
        container.innerHTML = `
            <div class="text-sm text-gray-500 mb-4 font-bold flex items-center gap-2"><i data-lucide="info" class="w-4 h-4"></i> Glissez les éléments pour les ordonner</div>
            <ul id="ordering-list" class="space-y-3">
                ${items.map((item, i) => `
                    <li draggable="true" data-original-index="${q.items.indexOf(item)}" class="ordering-item bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-indigo-300 transition-all select-none">
                        <div class="flex items-center gap-4">
                            <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm">${i + 1}</div>
                            <span class="font-bold text-gray-800">${item.text}</span>
                        </div>
                        <i data-lucide="grip-vertical" class="text-gray-400"></i>
                    </li>
                `).join('')}
            </ul>`;
        setTimeout(() => initOrderingEvents(), 50);
    }
    
    renderCloze(container, q) {
        const answers = this.answers[this.idx] || {};
        let i = 0;
        const html = q.content.replace(/{{([^}]+)}}/g, (m, p1) => {
             const val = answers[i] || '';
             const input = `<input type="text" onchange="updateCloze(${i}, this.value)" value="${val}" class="text-indigo-600 font-bold bg-indigo-50 border-b-2 border-indigo-300 focus:border-indigo-600 outline-none px-2 py-1 mx-1 rounded text-center w-32 inline-block transition-colors" placeholder="?">`;
             i++;
             return input;
        });
        container.className = "bg-white p-8 rounded-3xl border border-gray-100 shadow-sm leading-loose text-lg text-gray-700 font-mono";
        container.innerHTML = html;
    }

    renderCode(container, q) {
         const val = this.answers[this.idx] || '';
         container.innerHTML = `
            <div class="bg-gray-900 rounded-2xl p-6 shadow-2xl overflow-hidden font-mono text-sm text-gray-300 relative border border-gray-700">
                 <pre class="mb-4 text-green-400"><code>${q.codeSnippet || '//...'}</code></pre>
                 <div class="mt-4 border-t border-gray-700 pt-4">
                    <label class="block text-xs font-bold uppercase text-indigo-400 mb-2">Votre Réponse :</label>
                    <textarea oninput="updateCode(this.value)" class="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-indigo-500 outline-none font-mono" rows="3">${val}</textarea>
                 </div>
            </div>`;
    }

    renderMatching(container, q) {
         if (!q.pairs) {
             container.innerHTML = '<div class="text-red-500 font-bold p-4">Erreur: configuration du matching incomplète.</div>';
             return;
         }

         // Ensure Map exists
         this.answers[this.idx] = this.answers[this.idx] || {}; 
         const matches = this.answers[this.idx];

         // Initialize Shuffle (Once per question index) to prevent reshuffling on every click
         if (!this.matchingShuffles) this.matchingShuffles = {};
         if (!this.matchingShuffles[this.idx]) {
             const indices = q.pairs.map((_, i) => i);
             // Fisher-Yates Shuffle
             for (let i = indices.length - 1; i > 0; i--) {
                 const j = Math.floor(Math.random() * (i + 1));
                 [indices[i], indices[j]] = [indices[j], indices[i]];
             }
             this.matchingShuffles[this.idx] = indices;
         }
         const rightIndices = this.matchingShuffles[this.idx];

         // Get Selection State (reset if mismatch)
         if (this.currentMatchSelection && this.currentMatchSelection.qIdx !== this.idx) {
             this.currentMatchSelection = null;
         }
         const sel = this.currentMatchSelection; 

         // UI Container
         container.className = "grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-4 select-none";
         
         // Helper to check if a right-item is matched
         const getMatchedLeftForRight = (rIdx) => Object.keys(matches).find(k => matches[k] === rIdx);

         // --- LEFT COLUMN ---
         const leftCol = document.createElement('div');
         leftCol.className = "space-y-3";
         leftCol.innerHTML = `<h4 class="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 text-center">Éléments</h4>`;
         
         q.pairs.forEach((pair, i) => {
             const isMatched = (matches[i] !== undefined);
             const isSelected = (sel?.side === 'left' && sel?.index === i);
             
             let css = "bg-white border-2 border-gray-100 text-gray-600 hover:border-indigo-200 hover:shadow-sm";
             let icon = `<div class="w-2 h-2 rounded-full bg-gray-200"></div>`;
             
             if (isMatched) {
                 css = "bg-green-50 border-2 border-green-500 text-green-800 shadow-sm";
                 icon = `<i data-lucide="check" class="w-4 h-4 text-green-600"></i>`;
             } else if (isSelected) {
                 css = "bg-indigo-50 border-2 border-indigo-600 text-indigo-900 shadow-md transform scale-[1.02]";
                 icon = `<div class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>`;
             }

             const btn = `
             <button onclick="handleMatch('left', ${i})" 
                class="w-full text-left p-4 rounded-xl flex items-center justify-between gap-4 transition-all duration-200 ${css}">
                <span class="font-bold text-sm md:text-base truncate">${pair.a}</span>
                ${icon}
             </button>`;
             leftCol.innerHTML += btn;
         });

         // --- RIGHT COLUMN ---
         const rightCol = document.createElement('div');
         rightCol.className = "space-y-3";
         rightCol.innerHTML = `<h4 class="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 text-center">Correspondances</h4>`;
         
         rightIndices.forEach((originalIndex) => {
             const pair = q.pairs[originalIndex];
             const matchedLeft = getMatchedLeftForRight(originalIndex);
             const isMatched = (matchedLeft !== undefined);
             const isSelected = (sel?.side === 'right' && sel?.index === originalIndex);

             // Dynamic Style
             let css = "bg-white border-2 border-gray-100 text-gray-600 hover:border-indigo-200 hover:shadow-sm";
             let icon = `<div class="w-2 h-2 rounded-full bg-gray-200"></div>`;

             if (isMatched) {
                 css = "bg-green-50 border-2 border-green-500 text-green-800 shadow-sm";
                 icon = `<i data-lucide="link" class="w-4 h-4 text-green-600"></i>`;
             } else if (isSelected) {
                 css = "bg-indigo-50 border-2 border-indigo-600 text-indigo-900 shadow-md transform scale-[1.02]";
                 icon = `<div class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>`;
             }

             const btn = `
             <button onclick="handleMatch('right', ${originalIndex})" 
                class="w-full text-right p-4 rounded-xl flex items-center justify-between gap-4 flex-row-reverse transition-all duration-200 ${css}">
                <span class="font-bold text-sm md:text-base truncate">${pair.b}</span>
                ${icon}
             </button>`;
             rightCol.innerHTML += btn;
         });

         container.appendChild(leftCol);
         container.appendChild(rightCol);
    }

    // --- Actions ---
    
    select(optIdx) { this.answers[this.idx] = optIdx; this.render(); }
    
    match(side, index) {
        // Init Selection State if mismatch
        if (this.currentMatchSelection && this.currentMatchSelection.qIdx !== this.idx) {
            this.currentMatchSelection = null;
        }

        if (!this.currentMatchSelection) {
            // First click
            this.currentMatchSelection = { side, index, qIdx: this.idx };
        } else {
            const prev = this.currentMatchSelection;
            // 1. Deselect if clicking same
            if (prev.side === side && prev.index === index) {
                this.currentMatchSelection = null;
            } 
            // 2. Switch if clicking same side
            else if (prev.side === side) {
                this.currentMatchSelection = { side, index, qIdx: this.idx };
            }
            // 3. Match
            else {
                const leftIdx = (side === 'left') ? index : prev.index;
                const rightIdx = (side === 'right') ? index : prev.index;
                
                // Ensure answers object exists
                if (!this.answers[this.idx]) this.answers[this.idx] = {};
                
                // Set Match
                this.answers[this.idx][leftIdx] = rightIdx;
                
                // Clear conflicts (Review if this rightIdx was used elsewhere)
                Object.keys(this.answers[this.idx]).forEach(k => {
                    if (k !== String(leftIdx) && this.answers[this.idx][k] === rightIdx) {
                        delete this.answers[this.idx][k];
                    }
                });

                this.currentMatchSelection = null;
            }
        }
        this.render();
    }
    toggleImg(id) { 
        const arr = this.answers[this.idx] || [];
        if(arr.includes(id)) this.answers[this.idx] = arr.filter(x=>x!==id);
        else this.answers[this.idx] = [...arr, id];
        this.render();
    }
    setCloze(slot, val) { 
        if(!this.answers[this.idx]) this.answers[this.idx] = {};
        this.answers[this.idx][slot] = val;
    }
    setCode(val) { this.answers[this.idx] = val; }
    
    next() { if(this.idx < this.questions.length - 1) { this.idx++; this.render(); } }
    prev() { if(this.idx > 0) { this.idx--; this.render(); } }
    
    async finish() {
        console.log("Finishing Quiz Instance...");
        // Calc Score
        let correct = 0;
        const total = this.questions.length;
        this.questions.forEach((q, i) => {
            const ans = this.answers[i];
            let ok = false;
            
            // Basic/Boolean
            if (q.type === 'boolean') {
                const userVal = ans === 0 ? "true" : "false";
                if (userVal === String(q.correctAnswer)) ok = true;
            } else if (q.type === 'multiple' || q.type === undefined) { // Default multiple choice
                const correctIndex = (q.correctIndex !== undefined) ? Number(q.correctIndex) : q.correct;
                if (ans === correctIndex) ok = true;
            }
            // Image Choice (multiple correct)
            else if (q.type === 'image_choice') {
                const correctIds = q.correct.map(String); // Ensure correct IDs are strings
                const userIds = (ans || []).map(String); // Ensure user IDs are strings
                if (correctIds.length === userIds.length && correctIds.every(id => userIds.includes(id))) {
                    ok = true;
                }
            }
            // Ordering
            else if (q.type === 'ordering') {
                const correctOrder = q.items.map(item => item.text); // Original order is correct
                const userAnswerOrder = (ans || []).map(item => item.text);
                if (correctOrder.length === userAnswerOrder.length && correctOrder.every((val, idx) => val === userAnswerOrder[idx])) {
                    ok = true;
                }
            }
            // Cloze
            else if (q.type === 'cloze') {
                let allClozeCorrect = true;
                let clozeIdx = 0;
                q.content.replace(/{{([^}]+)}}/g, (match, p1) => {
                    const correctVal = p1.trim().toLowerCase();
                    const userVal = (ans[clozeIdx] || '').trim().toLowerCase();
                    if (userVal !== correctVal) {
                        allClozeCorrect = false;
                    }
                    clozeIdx++;
                    return match;
                });
                ok = allClozeCorrect;
            }
            // Code (simple string match for now)
            else if (q.type === 'code') {
                if (ans && q.correctAnswer && ans.trim() === q.correctAnswer.trim()) {
                    ok = true;
                }
            }
            // Matching
            else if (q.type === 'matching') {
                const matches = ans || {};
                let correctPairs = 0;
                // Check each submitted match
                Object.keys(matches).forEach(lIdx => {
                    // Correct if Left Index == Right Index (assuming pairs are synced in 'pairs' array)
                    if (Number(lIdx) === Number(matches[lIdx])) {
                        correctPairs++;
                    }
                });
                
                // All pairs must be correct to get the point
                if (correctPairs === q.pairs.length) ok = true;
            }

            if(ok) correct++;
        });
        
        const score = total > 0 ? Math.round((correct/total)*100) : 0;
        
        // Show Results
        const card = document.getElementById('quiz-question-container');
        const res = document.getElementById('quiz-result-container');
        if(card) card.classList.add('hidden');
        if(res) res.classList.remove('hidden');
        
        if(document.getElementById('result-score')) document.getElementById('result-score').textContent = score + '%';
        if(document.getElementById('result-correct')) document.getElementById('result-correct').textContent = correct;
        if(document.getElementById('result-wrong')) document.getElementById('result-wrong').textContent = total - correct;
        
        // Save
        if (score >= 50 && this.quiz.id) {
             // UI Feedback
            const existingFeedback = document.getElementById('quiz-feedback-msg');
            if (existingFeedback) existingFeedback.remove();

            const feedback = document.createElement('div');
            feedback.id = 'quiz-feedback-msg';
            feedback.className = "mt-4 p-3 bg-green-100 text-green-700 rounded-xl font-bold text-sm animate-pulse";
            feedback.innerHTML = `<i data-lucide="trending-up" class="w-4 h-4 inline mr-2"></i> Progression mise à jour !`;
            if (res) res.appendChild(feedback);
            if (window.lucide) window.lucide.createIcons();

            await updateProgress(this.quiz.id, true);
        }
    }
}

// --- Global Bridges ---

window.startQuiz = (source) => {
    let quiz = (typeof source === 'number') ? currentCourse.quizzes[source] : source;
    if(!quiz) { showToast("Quiz introuvable", "error"); return; }
    
    // Destroy previous
    if(activeQuizRunner) activeQuizRunner = null;
    
    // Start New
    activeQuizRunner = new QuizRunner(quiz);
    activeQuizRunner.init();
};

window.closeQuizModal = () => {
    const modal = document.getElementById('quiz-modal');
    if(modal) modal.remove(); // Force Destroy DOM
    document.body.style.overflow = 'auto';
    activeQuizRunner = null;
};

window.nextQuestion = () => activeQuizRunner?.next();
window.prevQuestion = () => activeQuizRunner?.prev();
window.selectOption = (i) => activeQuizRunner?.select(i);
window.handleMatch = (s, i) => activeQuizRunner?.match(s, i);
window.toggleImageSelect = (id) => activeQuizRunner?.toggleImg(id);
window.updateCloze = (i, v) => activeQuizRunner?.setCloze(i, v);
window.updateCode = (v) => activeQuizRunner?.setCode(v);
window.finishQuiz = () => activeQuizRunner?.finish();

// Drag & Drop Bridge
window.initOrderingEvents = () => {
    const list = document.getElementById('ordering-list');
    if(!list || !activeQuizRunner) return;
    let draggedItem = null;
    list.querySelectorAll('.ordering-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => item.classList.add('opacity-50'), 0);
        });
        item.addEventListener('dragend', () => {
            draggedItem = null;
            item.classList.remove('opacity-50');
            // Re-calc order based on current DOM
            const newOrder = [];
            list.querySelectorAll('.ordering-item').forEach(li => {
                 const originalIndex = parseInt(li.getAttribute('data-original-index'));
                 // Retrieve the original item object from the question's items array
                 newOrder.push(activeQuizRunner.questions[activeQuizRunner.idx].items[originalIndex]);
            });
            activeQuizRunner.answers[activeQuizRunner.idx] = newOrder;
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            const siblings = [...list.querySelectorAll('.ordering-item:not(.opacity-50)')];
            const nextSibling = siblings.find(sibling => e.clientY <= sibling.getBoundingClientRect().top + sibling.offsetHeight / 2);
            list.insertBefore(draggedItem, nextSibling);
        });
    });
};


// --- Progress Logic ---

async function updateProgress(itemId, isPassed = false) {
    if (!currentEnrollment) {
        console.warn("updateProgress: No active enrollment found.");
        return;
    }

    // Initialize tracking array if not exists
    if (!currentEnrollment.completedItems) {
        currentEnrollment.completedItems = [];
    }

    // Normalize to String for consistent duplicate checking
    const itemIdStr = String(itemId);

    // Filter Logic: Check Type
    // If it's a Quiz, we only allow if isPassed is TRUE.
    let isQuiz = false;
    
    // Check Global Quizzes
    if (currentCourse.quizzes && currentCourse.quizzes.some(q => String(q.id) === itemIdStr)) {
        isQuiz = true;
    }
    // Check Lesson Quizzes
    if (!isQuiz && currentCourse.chapters) {
        for (const c of currentCourse.chapters) {
            if (c.lessons) {
                const l = c.lessons.find(l => String(l.id) === itemIdStr);
                if (l && l.type === 'quiz') {
                    isQuiz = true;
                    break;
                }
            }
        }
    }

    if (isQuiz && !isPassed) {
        console.log("Progress Skip: Quiz not passed yet.", itemId);
        return;
    }

    // Avoid duplicates
    if (currentEnrollment.completedItems.some(existing => String(existing) === itemIdStr)) {
        console.log("Item already completed:", itemId);
        return;
    }

    // Add item (Store as-is or consistently? Let's use the raw ID to match schema types if mixed)
    currentEnrollment.completedItems.push(itemId);

    // Calculate Total Items (Lessons + Quizzes)
    let totalItems = 0;
    if (currentCourse.chapters) {
        currentCourse.chapters.forEach(c => {
            if (c.lessons) totalItems += c.lessons.length;
        });
    }
    if (currentCourse.quizzes) {
        totalItems += currentCourse.quizzes.length;
    }

    // Calculate Percentage
    const completedCount = currentEnrollment.completedItems.length;
    // Prevent Division by Zero
    const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 100;

    // Update Enrollment Object
    currentEnrollment.progress = progressPercent;
    currentEnrollment.completedLessons = completedCount; 
    currentEnrollment.totalLessons = totalItems;
    
    // Timestamp for sync debugging
    currentEnrollment.lastUpdated = new Date().toISOString();

    // UI Update
    const bar = document.getElementById('course-progress-bar');
    if (bar) bar.style.width = `${progressPercent}%`;

    // Save to Backend
    try {
        console.log("Sending Progress Update Payload:", JSON.parse(JSON.stringify(currentEnrollment)));
        await dataManager.update('enrollments', currentEnrollment.id, currentEnrollment);
        console.log('Progress stored successfully:', progressPercent, '%');
    } catch (e) {
        console.error('Failed to save progress API:', e);
        throw e; // RETHROW to allow caller to handle/alert
    }
}

window.showToast = (message, type = 'error') => {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = `fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-[100] animate-bounce-slow flex items-center gap-3 ${type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'error' ? 'alert-triangle' : 'check-circle'}" class="w-6 h-6"></i>
        <p class="font-bold text-sm">${message}</p>
    `;
    document.body.appendChild(toast);
    
    if (window.lucide) window.lucide.createIcons();
    
    // Auto remove after 5s
    setTimeout(() => {
        if (toast && toast.parentNode) toast.remove();
    }, 5000);
};


window.nextLesson = () => {
    if(!activeChapter || !activeLesson) return;
    
    // Find current indices
    const cIdx = currentCourse.chapters.indexOf(activeChapter);
    const lIdx = activeChapter.lessons ? activeChapter.lessons.indexOf(activeLesson) : -1;
    
    if(cIdx === -1 || lIdx === -1) return;
    
    let nextChap = activeChapter;
    let nextLess = activeChapter.lessons[lIdx + 1];
    
    if(!nextLess) {
        // Next Chapter
        if (cIdx < currentCourse.chapters.length - 1) {
            nextChap = currentCourse.chapters[cIdx + 1];
            nextLess = nextChap.lessons ? nextChap.lessons[0] : null;
        }
    }
    
    if(nextLess) {
        loadLesson(nextChap, nextLess);
    } else {
        showToast("Vous avez terminé le cours !", "success");
    }
};

window.openPDFModal = (url, title) => {
    let modal = document.getElementById('pdf-viewer-modal');
    
    // Lazy Inject Modal
    if (!modal) {
        const modalHTML = `
        <div id="pdf-viewer-modal" class="fixed inset-0 z-[60] bg-gray-900/90 hidden flex items-center justify-center backdrop-blur-sm p-4 animate-enter">
            <div class="bg-white rounded-2xl w-full h-full md:w-[90%] md:h-[90%] flex flex-col shadow-2xl overflow-hidden">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <h3 id="pdf-modal-title" class="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <i data-lucide="file-text" class="w-5 h-5 text-orange-500"></i> <span>Document</span>
                    </h3>
                    <div class="flex gap-3">
                        <a id="pdf-new-tab-btn" href="#" target="_blank" class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors">
                            <i data-lucide="external-link" class="w-4 h-4"></i> <span class="hidden sm:inline">Ouvrir l'original</span>
                        </a>
                        <button onclick="document.getElementById('pdf-viewer-modal').classList.add('hidden')" class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                </div>
                <!-- Content -->
                <div class="flex-1 bg-gray-50 relative">
                     <iframe id="pdf-modal-iframe" src="" class="absolute inset-0 w-full h-full" style="border:none;"></iframe>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('pdf-viewer-modal');
        lucide.createIcons();
    }
    
    // Update Content
    document.getElementById('pdf-modal-title').querySelector('span').innerText = title || 'Document PDF';
    document.getElementById('pdf-modal-iframe').src = url;
    document.getElementById('pdf-new-tab-btn').href = url;
    
    // Show
    document.getElementById('pdf-viewer-modal').classList.remove('hidden');
}

// Function لفتح دوسي Drive في Popup (Grid View)
window.openDriveFolderModal = (driveLink) => {
    // 1. نخرجوا الـ ID متاع الدوسي من الرابط
    let folderId = "";
    const idMatch = driveLink.match(/[-\w]{25,}/);
    if (idMatch) folderId = idMatch[0];

    // 2. نكونوا رابط الـ Grid View (باش يظهروا مربعات)
    const cleanUrl = folderId 
        ? `https://drive.google.com/embeddedfolderview?id=${folderId}#grid` 
        : driveLink;

    // 3. نحوا أي Modal قديم كان موجود
    const existing = document.getElementById('drive-folder-modal');
    if (existing) existing.remove();

    // 4. نصنعوا الـ Modal (Design Glassmorphism)
    const modalHTML = `
    <div id="drive-folder-modal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onclick="document.getElementById('drive-folder-modal').remove()"></div>
        
        <div class="relative w-full h-[85vh] max-w-6xl bg-[#0f172a]/95 border border-slate-600/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            <div class="flex justify-between items-center px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-violet-900/20 to-transparent">
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    📂 Dossier des Ressources
                </h3>
                <button onclick="document.getElementById('drive-folder-modal').remove()" class="p-2 rounded-full hover:bg-white/10 text-white transition-all">✕</button>
            </div>

            <div class="flex-1 relative bg-white">
                <iframe 
                    src="${cleanUrl}" 
                    class="absolute inset-0 w-full h-full border-0"
                    allowfullscreen>
                </iframe>
            </div>
        </div>
    </div>
    `;

    // 5. نزيدوه للصفحة
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};
