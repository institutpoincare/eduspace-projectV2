// Logic for Recorded Courses (Enregistre)
// Handles Wizard, Chapters, and Data Logic

const tempChapters = [];
let tempQuizzes = []; // New: Quizzes array
let editingId = null;
let currentQuizId = null; // To track editing quiz

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    
    // Explicitly bind modal buttons
    const bindBtn = (id, handler) => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // console.log(`Button ${id} clicked`);
                handler();
            });
        }
    };

    bindBtn('btn-cancel-lesson', closeLessonModal);
    bindBtn('btn-confirm-lesson', confirmAddLesson);
    bindBtn('btn-close-modal-x', closeLessonModal);
    
    // Bind Navigation Buttons
    // Bind Navigation Buttons
    bindBtn('btn-step1-next', () => nextStep(2));
    bindBtn('btn-step2-back', () => nextStep(1));
    bindBtn('btn-step2-next', () => nextStep(4));  // Skip Step 3
    
    // Step 4 (Vente) Nav
    // Note: The HTML ID might be btn-step3-back if copied from previous template, 
    // but based on previous turns, the button in step 4 goes back to 3. We retarget it to 2.
    bindBtn('btn-step3-back', () => nextStep(2)); // Re-purpose this button in Step 4 to go back to 2
    
    bindBtn('btn-finish', () => finish());

});

// --- Wizard Navigation ---

window.showWizard = (reset = true) => {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-wizard').classList.remove('hidden');
    document.getElementById('view-wizard').classList.add('flex');
    if(reset) resetForm();
    goToStep(1);
}

window.closeLessonModal = () => {
    const modal = document.getElementById('lesson-modal');
    if(modal) modal.classList.add('hidden');
    currentChapterId = null;
    currentInsertIndex = -1;
}

// Add Close Quiz Modal global
window.closeQuizModal = () => {
    const modal = document.getElementById('quiz-modal');
    if(modal) modal.classList.add('hidden');
    currentQuizId = null;
    currentInsertIndex = -1;
}

window.showList = () => {
    document.getElementById('view-wizard').classList.add('hidden');
    document.getElementById('view-wizard').classList.remove('flex');
    document.getElementById('view-list').classList.remove('hidden');
    loadCourses();
}

window.nextStep = (step) => {
    goToStep(step);
}

function goToStep(step) {
    // Hide all steps
    [1, 2, 3, 4].forEach(s => {
        const el = document.getElementById(`step-${s}`);
        if(el) el.classList.add('hidden');
        
        const ind = document.getElementById(`step-ind-${s}`);
        if(ind) ind.classList.remove('active', 'completed');
        
        // Reset indicator color
        const num = document.querySelector(`#step-ind-${s} .step-number`);
        if(num) {
            num.classList.remove('bg-blue-600', 'text-white', 'bg-indigo-600', 'bg-purple-600', 'bg-green-600', 'bg-green-500');
            num.classList.add('text-gray-400');
        }
    });

    // Show current step
    const currentEl = document.getElementById(`step-${step}`);
    if(currentEl) currentEl.classList.remove('hidden');
    
    // Update Indicators logic for 3-step flow (1 -> 2 -> 4)
    // We treat '3' as skipped/hidden or merge it visually if users want 4 steps. 
    // But request implies "Quiz no longer a step".
    // Let's update indicators for 1, 2, 4.
    
    const steps = [1, 2, 4];
    const currentIndex = steps.indexOf(step);
    
    steps.forEach((s, index) => {
        // Map 4 -> indicator 3 if needed, or just light up 4.
        // Assuming indicator IDs are 1, 2, 3, 4 in HTML.
        // Let's activate indicator 's' directly.
        
        const ind = document.getElementById(`step-ind-${s}`);
        if(!ind) return;
        
        const num = ind.querySelector('.step-number');
        
        if (s === step) {
             ind.classList.add('active');
             let color = 'blue';
             if(s === 2) color = 'indigo';
             if(s === 4) color = 'green';
             
             num.classList.remove('text-gray-400', 'border-gray-200');
             num.classList.add(`bg-${color}-600`, 'text-white', `border-${color}-600`);
        } else if (index < currentIndex) {
             ind.classList.add('completed');
             num.classList.remove('text-gray-400');
             num.classList.add('bg-green-500', 'text-white', 'border-green-500');
        }
    });
    
    // Hide indicator 3 if it exists, since we skip it
    const ind3 = document.getElementById('step-ind-3');
    if(ind3) ind3.style.display = 'none'; // Hide it visually
    const divider3 = ind3?.nextElementSibling; // The line after it
    if(divider3 && divider3.classList.contains('w-6')) divider3.style.display = 'none'; 
    const divider2 = document.getElementById('step-ind-2')?.nextElementSibling;
    // Note: Divider handling in vanilla JS without direct IDs on dividers is tricky, ignoring for safety or assuming HTML update handles it.

    if(step === 4) {
        renderCourseSummary();
    }
}

// --- Form & Preview Logic ---

window.updatePreview = () => {
    const title = document.getElementById('w-title').value || "Titre du cours ici";
    const desc = document.getElementById('w-desc')?.value || "La description de votre cours apparaîtra ici de manière élégante.";
    const isFree = document.getElementById('w-free')?.checked;
    const price = document.getElementById('w-price')?.value || "49";
    const promo = document.getElementById('w-promo')?.value;
    
    // Update title
    const prevTitle = document.querySelector('#prev-card-title');
    if(prevTitle) {
        document.querySelectorAll('#prev-card-title').forEach(el => el.textContent = title);
    }
    
    // Update description
    const prevDesc = document.querySelector('#prev-card-desc');
    if(prevDesc) {
        prevDesc.textContent = desc;
    }
    
    // Update price
    const prevPrice = document.querySelector('#prev-card-price');
    if(prevPrice) {
        if(isFree) {
            prevPrice.innerHTML = '<span class="text-green-600 font-bold text-xl">Gratuit</span>';
        } else if(promo && promo > 0 && promo < price) {
            prevPrice.innerHTML = `
                <div>
                    <span class="text-xs text-gray-400 font-bold uppercase">Prix</span>
                    <div class="flex items-center gap-2">
                        <div class="font-bold text-xl text-red-600">${promo} <span class="text-xs">TND</span></div>
                        <div class="font-bold text-sm text-gray-400 line-through">${price}</div>
                    </div>
                </div>
            `;
        } else {
            prevPrice.innerHTML = `
                <div>
                    <span class="text-xs text-gray-400 font-bold uppercase">Prix</span>
                    <div class="font-bold text-xl text-blue-600">${price} <span class="text-xs">TND</span></div>
                </div>
            `;
        }
    }
}

let currentCoverImage = null;

window.openUserPreview = (id) => {
    // Bridge Session to LocalStorage for New Tab
    const user = dataManager.getCurrentUser();
    if(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }
    window.open(`../../pages/etudiant/course-view.html?id=${id}&preview=true`, '_blank');
}

window.handleImg = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentCoverImage = e.target.result; // Store for submission
            document.querySelectorAll('#prev-img-edit').forEach(img => {
                img.src = e.target.result;
                img.classList.remove('hidden');
            });
            document.querySelectorAll('#prev-card-img').forEach(img => {
                img.src = e.target.result;
            });
        }
        reader.readAsDataURL(input.files[0]);
    }
}

window.togglePriceInputs = (checkbox) => {
    const inputs = document.getElementById('price-inputs');
    if(checkbox.checked) {
        inputs.classList.add('opacity-50', 'pointer-events-none');
        document.getElementById('w-price').value = 0;
    } else {
        inputs.classList.remove('opacity-50', 'pointer-events-none');
    }
    updatePreview(); // Update preview when toggling free/paid
}

// --- Chapter & Lesson Management ---

let currentChapterId = null;

window.addChapter = () => {
    const id = Date.now();
    tempChapters.push({ 
        id, 
        title: `Chapitre ${tempChapters.length + 1}`, 
        lessons: [] 
    });
    renderChapters();
}

window.updateChapterTitle = (chapterId, newTitle) => {
    const chapter = tempChapters.find(c => c.id === chapterId);
    if (chapter) {
        chapter.title = newTitle;
        console.log(`✅ Titre du chapitre mis à jour: "${newTitle}"`);
    }
}

window.removeChapter = (chapterId) => {
    if(confirm('Supprimer ce chapitre et tout son contenu ?')) {
        tempChapters = tempChapters.filter(c => c.id !== chapterId);
        renderChapters();
        renderCourseSummary();
    }
}

window.removeLesson = (chapterId, lessonId) => {
    if(confirm('Supprimer cette leçon ?')) {
        const chapter = tempChapters.find(c => c.id === chapterId);
        if (chapter) {
            chapter.lessons = chapter.lessons.filter(l => l.id !== lessonId);
            renderChapters();
            renderCourseSummary();
        }
    }
}

window.openContentModal = (chapterId, lessonId, type) => {
    currentChapterId = chapterId;
    currentLessonId = lessonId;
    
    // Open the lesson modal and set the type
    const modal = document.getElementById('lesson-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Set the type and show appropriate inputs
    if(type === 'video') {
        document.getElementById('section-video').classList.remove('hidden');
        document.getElementById('input-file').classList.add('hidden');
        document.querySelector('#lesson-modal h3').innerText = "Ajouter une Vidéo";
    } else if(type === 'pdf') {
        document.getElementById('section-video').classList.add('hidden');
        document.getElementById('input-file').classList.remove('hidden');
        document.querySelector('#lesson-modal h3').innerText = "Ajouter une Ressource";
    }
}

/**
 * Open Modal to add a lesson
 */
// Helper to render the "Add Lesson" button with expendable options
// Helper to render the "Add Lesson" button with expendable options
window.getAddButtonHTML = (cId, idx) => `
    <div class="mt-3 mb-2">
         <button id="btn-add-${cId}-${idx}" onclick="document.getElementById('add-opts-${cId}-${idx}').classList.remove('hidden'); this.classList.add('hidden')" 
            class="w-full py-3 bg-gray-50 hover:bg-indigo-50 border-2 border-dashed border-gray-200 hover:border-indigo-200 text-gray-500 hover:text-indigo-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group">
            <div class="p-1 bg-white rounded-full shadow-sm group-hover:bg-indigo-100 transition-colors">
                <i data-lucide="plus" class="w-4 h-4"></i>
            </div>
            Ajouter une leçon
         </button>

         <div id="add-opts-${cId}-${idx}" class="hidden p-4 bg-white rounded-xl border border-gray-200 shadow-sm animate-enter">
            
            <div class="mb-3">
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Titre de la leçon</label>
                <input type="text" id="input-title-${cId}-${idx}" placeholder="Ex: Introduction au chapitre..." 
                    class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-medium text-gray-700">
            </div>

            <p class="text-[10px] text-gray-400 font-bold uppercase mb-2 ml-1">Type de contenu :</p>
            <div class="flex gap-2">
                <button onclick="initAddLesson(${cId}, 'video', ${idx})" class="flex-1 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                    <i data-lucide="video" class="w-4 h-4"></i> Vidéo
                </button>
                <button onclick="initAddLesson(${cId}, 'pdf', ${idx})" class="flex-1 py-2.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                    <i data-lucide="file-text" class="w-4 h-4"></i> Ressource
                </button>
                <button onclick="initAddQuiz(${cId}, ${idx})" class="flex-1 py-2.5 bg-purple-50 border border-purple-100 text-purple-600 rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                    <i data-lucide="brain" class="w-4 h-4"></i> Quiz
                </button>
            </div>
        </div>
    </div>
`;

window.initAddLesson = (cId, type, idx) => {
    const titleInput = document.getElementById(`input-title-${cId}-${idx}`);
    const title = titleInput ? titleInput.value : '';
    addLesson(cId, type, idx, title);
}

window.initAddQuiz = (cId, idx) => {
    const titleInput = document.getElementById(`input-title-${cId}-${idx}`);
    const title = titleInput ? titleInput.value : '';
    addQuiz(cId, idx, title);
}

// --- Modal Lesson Addition ---
window.toggleLessonInputs = () => {
    // Force show all for multi-content mode
    document.getElementById('section-video').classList.remove('hidden');
    document.getElementById('input-file').classList.remove('hidden');
}

window.addLesson = (chapId, specificType = 'video', index = -1, preTitle = '') => {
    currentChapterId = chapId;
    currentInsertIndex = index;
    const modal = document.getElementById('lesson-modal');
    modal.classList.remove('hidden');
    
    // Reset & Pre-fill
    document.getElementById('l-title').value = preTitle;
    
    // Unhide All Sections (Multi-Content Mode)
    document.getElementById('section-video').classList.remove('hidden');
    document.getElementById('input-file').classList.remove('hidden');
    
    // Reset Values but ONLY if opening fresh (optional, here we reset for clean state)
    document.getElementById('l-video-url').value = '';
    document.getElementById('l-file').value = '';
    document.getElementById('pdf-name-display').innerText = 'Cliquez pour importer le PDF';
    
    // Reset Title
    const modalTitle = document.querySelector('#lesson-modal h3');
    if(modalTitle) modalTitle.innerText = 'Ajouter une Leçon'; // Generic title for multi-content

    // Hide Type Selector (Clean Interface) - No longer needed, as we show both inputs
    const typeContainer = document.querySelector('input[name="l-type"]').closest('div'); 
    if(typeContainer) {
        typeContainer.classList.add('hidden');
        typeContainer.classList.remove('flex');
    }

    // No need to set type radio, as both inputs are visible.
    // toggleLessonInputs() is now a no-op that ensures both are visible.
    toggleLessonInputs();
}

// Obsolete toggle functions removed




// --- Content Management ---
let currentLessonId = null;

window.createEmptyLesson = (chapId) => {
    const tempId = document.querySelector(`[id^="lesson-creator-"]`)?.id.split('-')[2] || Date.now(); // Try to get tempId from DOM or fallback
    // Actually showLessonPlaceholder creates a specific ID for title input. I should pass it or query it.
    // Simpler: querySelector inside the chapter container.
    // better: createEmptyLesson receives title value? No, cleaner to grab input by ID if I store tempId.
    // I will pass titleValue from the button call.
}

window.finalizeCreateLesson = (chapId, tempId) => {
    const titleInput = document.getElementById(`title-${tempId}`);
    if(!titleInput || !titleInput.value.trim()) { alert("Titre requis"); return; }
    
    const newLesson = {
        id: Date.now(),
        title: titleInput.value.trim(),
        contents: []
    };
    
    const chap = tempChapters.find(c => c.id === chapId);
    if(chap) {
        chap.lessons.push(newLesson);
        renderChapters();
    }
}

window.openContentModal = (cId, lId, type) => {
    currentChapterId = cId;
    currentLessonId = lId;
    const modal = document.getElementById('lesson-modal');
    modal.classList.remove('hidden');
    
    // UI Setup: HIDE Title (Context is established), SHOW specific input
    document.getElementById('l-title').closest('div').classList.add('hidden'); // Hide Title Input Wrapper
    
    // Hide all first
    document.getElementById('section-video').classList.add('hidden');
    const pdfSection = document.getElementById('input-file');
    pdfSection.classList.add('hidden'); // Hide PDF wrapper initially
    
    // Reset values
    document.getElementById('l-video-url').value = '';
    document.getElementById('l-file').value = '';
    const driveInput = document.getElementById('l-pdf-drive');
    if(driveInput) driveInput.value = '';
    
    // Show request type
    if(type === 'video') {
        document.getElementById('section-video').classList.remove('hidden');
        document.querySelector('#lesson-modal h3').innerText = "Ajouter une Vidéo";
    } else if (type === 'pdf') {
        pdfSection.classList.remove('hidden');
        document.querySelector('#lesson-modal h3').innerText = "Ajouter une Ressource";
        
        // Inject Google Drive Input if missing
        if(!document.getElementById('pdf-drive-section')) {
            const driveHTML = `
            <div id="pdf-drive-section" class="mt-4 pt-4 border-t border-gray-100 animate-enter">
                <label class="block text-sm font-bold text-gray-700 mb-2">Ou importer via Google Drive</label>
                <div class="relative">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <i data-lucide="link" class="w-5 h-5"></i>
                    </div>
                    <input type="text" id="l-pdf-drive" class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-orange-500 transition-all font-medium" placeholder="Collez le lien Google Drive...">
                </div>
            </div>`;
            pdfSection.insertAdjacentHTML('beforeend', driveHTML);
            if(window.lucide) lucide.createIcons();
        }
    }
}

window.confirmAddLesson = () => {
    // Acts as 'Confirm Add Content' now
    if(!currentChapterId || !currentLessonId) return;
    
    const chap = tempChapters.find(c => c.id === currentChapterId);
    if(!chap) return;
    
    const lesson = chap.lessons.find(l => l.id === currentLessonId);
    if(!lesson) return;
    
    const contents = lesson.contents || []; // Ensure array
    
    // Determine what is visible/filled to add
    const vidSection = document.getElementById('section-video');
    const fileSection = document.getElementById('input-file');
    
    let added = false;
    
    if(!vidSection.classList.contains('hidden')) {
        const url = document.getElementById('l-video-url').value;
        if(url) {
            contents.push({ type: 'video', content: url, meta: 'link' });
            added = true;
        } else { alert("Lien requis"); return; }
    } else if (!fileSection.classList.contains('hidden')) {
        const fileIn = document.getElementById('l-file');
        const driveIn = document.getElementById('l-pdf-drive');
        
        if(fileIn.files.length > 0) {
            contents.push({ type: 'pdf', content: fileIn.files[0].name, meta: 'file' });
            added = true;
        } else if (driveIn && driveIn.value.trim()) {
            contents.push({ type: 'pdf', content: driveIn.value.trim(), meta: 'drive' });
            added = true;
        } else { 
            alert("Veuillez sélectionner un fichier ou entrer un lien Drive"); 
            return; 
        }
    }
    
    if(added) {
        lesson.contents = contents; // Update
        renderChapters();
        closeLessonModal();
    }
}

function renderChapters() {
    const container = document.getElementById('chapters-container');
    if(tempChapters.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <div class="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                    <i data-lucide="folder-open" class="w-6 h-6 text-gray-400"></i>
                </div>
                <p class="text-gray-500 font-medium">Aucun chapitre pour le moment.</p>
                <button onclick="addChapter()" class="text-blue-600 font-bold text-sm mt-1 hover:underline">Commencer à ajouter</button>
            </div>
        `;
        return;
    }

    container.innerHTML = tempChapters.map((chap, index) => `
        <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-enter mb-4 relative group">
            <!-- Chapter Header -->
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-3 w-full">
                    <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <i data-lucide="folder" class="w-5 h-5"></i>
                    </div>
                    <input type="text" value="${chap.title}" 
                        class="font-bold text-lg text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 hover:bg-white focus:bg-white focus:border-indigo-500 outline-none transition-all w-full mr-4 z-10 relative cursor-text"
                        onchange="updateChapterTitle(${chap.id}, this.value)">
                </div>
                <button onclick="removeChapter(${chap.id})" class="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            
            <!-- Content Wrapper -->
            <div class="pl-2 mt-4 px-2">
                <!-- Lessons List -->
                <div id="lessons-container-${chap.id}" class="space-y-2 mb-4">
                   ${(chap.lessons || []).map(lesson => {
                      // Normalize to multi-content
                      const items = lesson.contents || [{ type: lesson.type, content: lesson.content }];
                      
                      return `
                      <div class="bg-white border border-gray-100 rounded-lg group hover:border-indigo-200 transition-colors shadow-sm overflow-hidden">
                          <!-- Lesson Header -->
                          <div class="p-3 flex justify-between items-center bg-gray-50/50">
                              <span class="font-bold text-sm text-gray-800 flex items-center gap-2">
                                  <div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                  ${lesson.title}
                              </span>
                              <button onclick="removeLesson(${chap.id}, ${lesson.id})" class="text-gray-300 hover:text-red-500 p-1 opacity-100 transition-opacity">
                                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                              </button>
                          </div>
                          
                          <!-- Contents -->
                          <div class="px-3 pb-3 space-y-1">
                              ${items.map(item => {
                                  // Display quiz title or question count for quiz items
                                  let displayText = item.content || 'Contenu';
                                  if(item.type === 'quiz') {
                                      displayText = item.title || `Quiz (${item.questions ? item.questions.length : '?'} questions)`;
                                  }
                                  return `
                                <div class="flex items-center gap-2 text-xs text-gray-600 p-2 bg-gray-50 rounded-md border border-gray-100 pl-3">
                                    <i data-lucide="${item.type === 'video' ? 'video' : (item.type === 'quiz' ? 'brain' : 'file-text')}" class="w-4 h-4 ${item.type === 'video' ? 'text-indigo-500' : (item.type === 'quiz' ? 'text-purple-500' : 'text-orange-500')}"></i>
                                    <span class="truncate font-medium">${displayText}</span>
                                </div>
                              `}).join('')}
                              
                              <!-- Content Toolbar (Separation of Concerns) -->
                              <div class="pt-2 flex gap-2 border-t border-gray-100 mt-2">
                                  <button onclick="openContentModal(${chap.id}, ${lesson.id}, 'video')" class="flex-1 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded flex items-center justify-center gap-1 transition-colors">
                                      <i data-lucide="video" class="w-3 h-3"></i> +Vidéo
                                  </button>
                                  <button onclick="openContentModal(${chap.id}, ${lesson.id}, 'pdf')" class="flex-1 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded flex items-center justify-center gap-1 transition-colors">
                                      <i data-lucide="file-text" class="w-3 h-3"></i> +PDF
                                  </button>
                                  <button onclick="addQuiz(${chap.id}, ${lesson.id})" class="flex-1 py-1.5 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded flex items-center justify-center gap-1 transition-colors">
                                      <i data-lucide="brain" class="w-3 h-3"></i> +Quiz
                                  </button>
                              </div>
                          </div>
                      </div>
                   `}).join('')}
                </div>
                </div>
                
                <!-- Explicit Add Lesson Button (Inline Action) -->
                <button onclick="showLessonPlaceholder(${chap.id})" class="w-full mt-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                    <i data-lucide="plus" class="w-4 h-4"></i> Ajouter une Leçon
                </button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// Inline Lesson Creator Logic
// User requested implementation
window.showLessonPlaceholder = (chapterId) => {
    const container = document.getElementById(`lessons-container-${chapterId}`);
    const tempId = Date.now();
    
    const placeholderHTML = `
    <div id="lesson-creator-${tempId}" class="mt-3 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 animate-fadeIn">
        <div class="mb-4">
            <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Titre de la leçon</label>
            <input type="text" id="title-${tempId}" class="w-full p-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 outline-none font-bold text-gray-700" placeholder="Ex: Introduction au chapitre...">
        </div>
        <p class="text-center text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Choisir le contenu</p>
        <div class="flex gap-4">
            <button onclick="selectLessonType('${chapterId}', '${tempId}', 'video')" class="flex-1 py-3 bg-white border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-50 font-bold shadow-sm flex items-center justify-center gap-2 transition-all">
                <i data-lucide="video" class="w-5 h-5"></i> Vidéo
            </button>
            <button onclick="selectLessonType('${chapterId}', '${tempId}', 'resource')" class="flex-1 py-3 bg-white border border-orange-100 text-orange-600 rounded-lg hover:bg-orange-50 font-bold shadow-sm flex items-center justify-center gap-2 transition-all">
                <i data-lucide="file-text" class="w-5 h-5"></i> Ressource
            </button>
            <button onclick="selectLessonType('${chapterId}', '${tempId}', 'quiz')" class="flex-1 py-3 bg-white border border-purple-100 text-purple-600 rounded-lg hover:bg-purple-50 font-bold shadow-sm flex items-center justify-center gap-2 transition-all">
                <i data-lucide="brain" class="w-5 h-5"></i> Quiz
            </button>
        </div>
    </div>`;
    
    container.insertAdjacentHTML('beforeend', placeholderHTML);
    if (window.lucide) lucide.createIcons();
}

// Simplified Lesson Creator (Title Only)
window.showLessonPlaceholder = (chapterId) => {
    const container = document.getElementById(`lessons-container-${chapterId}`);
    const tempId = Date.now();
    
    // Title Input Only
    const placeholderHTML = `
    <div id="lesson-creator-${tempId}" class="mt-3 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 animate-enter">
        <div class="mb-3">
            <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Titre de la leçon</label>
            <input type="text" id="title-${tempId}" class="w-full p-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 outline-none font-bold text-gray-700" placeholder="Entrez le titre...">
        </div>
        <div class="flex gap-2">
            <button onclick="finalizeCreateLesson(${chapterId}, ${tempId})" class="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">Créer la leçon</button>
            <button onclick="this.closest('.animate-enter').remove()" class="px-4 bg-gray-100 text-gray-500 rounded-lg font-bold hover:bg-gray-200">X</button>
        </div>
    </div>`;
    
    container.insertAdjacentHTML('beforeend', placeholderHTML);
    if(window.lucide) lucide.createIcons(); 
}

// Legacy SelectType (Removed)

window.saveInlineLesson = (cId, tempId, type) => {
    const title = document.getElementById(`title-${tempId}`).value;
    let content = '';
    let meta = '';
    
    if(type === 'video') {
        content = document.getElementById(`content-${tempId}`).value;
        if(!content) { alert('Lien requis'); return; }
        meta = 'link';
    } else if (type === 'pdf') {
        const fileInput = document.getElementById(`content-file-${tempId}`);
        if(fileInput.files.length > 0) {
            content = fileInput.files[0].name; 
            meta = 'file';
        } else {
             alert('Fichier requis'); return;
        }
    } else {
        content = 'Quiz';
        meta = 'quiz';
    }

    const chap = tempChapters.find(c => String(c.id) === String(cId));
    if(chap) {
        chap.lessons.push({
            id: Date.now(),
            title: title,
            type: type,
            content: content,
            meta: meta
        });
        renderChapters();
    }
}

window.saveInlineLesson = (cId, tempId, type) => {
    const title = document.getElementById(`title-${tempId}`).value;
    let content = '';
    let meta = '';
    
    if(type === 'video') {
        content = document.getElementById(`content-${tempId}`).value;
        if(!content) { alert('Lien requis'); return; }
        meta = 'link';
    } else if (type === 'pdf') {
        const fileInput = document.getElementById(`content-file-${tempId}`);
        if(fileInput.files.length > 0) {
            content = fileInput.files[0].name; // Mock upload
            meta = 'file';
        } else {
             alert('Fichier requis'); return;
        }
    } else {
        content = 'Quiz';
        meta = 'quiz';
    }

    const chap = tempChapters.find(c => c.id === cId);
    if(chap) {
        chap.lessons.push({
            id: Date.now(),
            title: title,
            type: type,
            content: content,
            meta: meta
        });
        renderChapters();
    }
}

window.removeChapter = (id) => {
    if(confirm('Supprimer ce chapitre ?')) {
        const idx = tempChapters.findIndex(c => c.id === id);
        if(idx > -1) {
            tempChapters.splice(idx, 1);
            renderChapters();
        }
    }
}

window.removeLesson = (chapId, lessonId) => {
    const chap = tempChapters.find(c => c.id === chapId);
    if(chap) {
        chap.lessons = chap.lessons.filter(l => l.id !== lessonId);
        renderChapters();
    }
}
window.deleteLesson = window.removeLesson; // Alias for user template

window.openLessonModal = (chapId) => {
    addLesson(chapId, 'video', -1, '');
    
    // Force Type Selector visible (Override addLesson's hiding)
    const typeContainer = document.querySelector('input[name="l-type"]').closest('div'); 
    if(typeContainer) {
         typeContainer.classList.remove('hidden');
         typeContainer.classList.add('flex');
    }
    // Generic Title
    const modalTitle = document.querySelector('#lesson-modal h3');
    if(modalTitle) modalTitle.innerText = 'Ajouter une Leçon';
}

// --- Quiz Management ---

window.populateChapterSelect = () => {
    const select = document.getElementById('q-chapter');
    if(!select) return;
    
    // Keep first option
    select.innerHTML = '<option value="">-- Aucun (Quiz Global) --</option>';
    
    tempChapters.forEach((chap, idx) => {
        const opt = document.createElement('option');
        opt.value = chap.id;
        opt.innerText = `Chapitre ${idx+1}: ${chap.title}`;
        select.appendChild(opt);
    });
}

// REFACTORED: Now supports adding quiz to lesson contents
let currentQuizLessonId = null; // Track target lesson for quiz content

window.addQuiz = (chapId = null, lessonIdOrIndex = null, preTitle = '') => {
    currentQuizId = null;
    currentChapterId = chapId;
    
    // Determine if lessonIdOrIndex is a lessonId (number) or insert index (legacy)
    if(typeof lessonIdOrIndex === 'number' && lessonIdOrIndex > 1000000000) {
        // It's a lessonId (timestamp-based)
        currentQuizLessonId = lessonIdOrIndex;
        currentInsertIndex = -1;
    } else {
        // It's an index or null (legacy mode - create standalone quiz lesson)
        currentQuizLessonId = null;
        currentInsertIndex = lessonIdOrIndex || -1;
    }
    
    const titleInput = document.getElementById('q-title');
    titleInput.value = preTitle;
    if(!preTitle) titleInput.focus();
    
    populateChapterSelect();
    
    // Set Chapter if provided
    if(chapId) {
        document.getElementById('q-chapter').value = chapId;
    } else {
        document.getElementById('q-chapter').value = "";
    }
    
    // Reset Type to Native
    const radios = document.getElementsByName('q-type');
    for(let r of radios) r.checked = (r.value === 'native');
    toggleQuizType();
    
    // Reset Native
    document.getElementById('questions-container').innerHTML = '';
    addQuestion();
    
    // Reset Link
    document.getElementById('q-link-url').value = '';
    
    // Reset File
    const fileInput = document.getElementById('q-file-input');
    if(fileInput) fileInput.value = '';
    document.getElementById('q-file-instr').value = '';
    document.getElementById('q-file-name').innerText = 'Cliquez pour choisir un fichier';
    
    const modal = document.getElementById('quiz-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

window.toggleQuizType = () => {
    const type = document.querySelector('input[name="q-type"]:checked').value;
    
    const secNative = document.getElementById('sec-q-native');
    const secLink = document.getElementById('sec-q-link');
    const secFile = document.getElementById('sec-q-file');
    
    // Hide all
    secNative.classList.add('hidden');
    secLink.classList.add('hidden');
    secFile.classList.add('hidden');
    
    // Show selected
    if(type === 'native') secNative.classList.remove('hidden');
    if(type === 'link') secLink.classList.remove('hidden');
    if(type === 'file') secFile.classList.remove('hidden');
}

window.updateQuizFileName = (input) => {
    if(input.files && input.files[0]) {
        document.getElementById('q-file-name').innerText = input.files[0].name;
    }
}

window.editQuiz = (id) => {
    const quiz = tempQuizzes.find(q => q.id === id);
    if(!quiz) return;
    
    currentQuizId = id;
    document.getElementById('q-title').value = quiz.title;
    
    populateChapterSelect();
    document.getElementById('q-chapter').value = quiz.chapterId || ""; // Set selected chapter
    
    // Set Type
    const type = quiz.type || 'native'; // Backwards compatibility
    const radios = document.getElementsByName('q-type');
    for(let r of radios) r.checked = (r.value === type);
    toggleQuizType();
    
    if(type === 'native') {
        const container = document.getElementById('questions-container');
        container.innerHTML = '';
        quiz.questions.forEach(q => addQuestion(q));
    } else if (type === 'link') {
        document.getElementById('q-link-url').value = quiz.content || '';
    } else if (type === 'file') {
        document.getElementById('q-file-instr').value = quiz.instructions || '';
        if(quiz.content) {
             document.getElementById('q-file-name').innerText = "Fichier actuel: " + quiz.content;
        }
    }
    
    const modal = document.getElementById('quiz-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

window.addQuestion = (data = null) => {
    const container = document.getElementById('questions-container');
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    const type = data ? (data.type || 'multiple') : 'multiple';
    
    const div = document.createElement('div');
    div.className = "bg-gray-50 p-4 rounded-xl border border-gray-200 relative group question-item";
    div.dataset.id = id;
    
    div.innerHTML = `
        <div class="flex justify-between items-start mb-3 pr-8">
            <div class="w-2/3">
                <input type="text" class="q-text w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-bold focus:border-purple-500 transition-colors" placeholder="Votre Question ? (LaTeX: $$x^2$$)" value="${data ? data.text : ''}" oninput="updateMathPreview(this)">
                <div class="math-preview hidden mt-2 p-2 bg-white/50 border border-gray-200 rounded text-gray-800 text-sm"></div>
            </div>
            <div class="w-1/3 pl-2">
                <select class="q-type-select w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs font-bold text-gray-600 focus:border-purple-500" onchange="changeQuestionType(this)">
                    <option value="multiple" ${type === 'multiple' ? 'selected' : ''}>Choix Multiple</option>
                    <option value="boolean" ${type === 'boolean' ? 'selected' : ''}>Vrai / Faux</option>
                    <option value="short" ${type === 'short' ? 'selected' : ''}>Réponse Courte</option>
                    <option disabled>--- Avancé ---</option>
                    <option value="image_choice" ${type === 'image_choice' ? 'selected' : ''}>Choix par Image</option>
                    <option value="ordering" ${type === 'ordering' ? 'selected' : ''}>Ordonnancement</option>
                    <option value="matching" ${type === 'matching' ? 'selected' : ''}>Associations</option>
                    <option value="cloze" ${type === 'cloze' ? 'selected' : ''}>Texte à Trous</option>
                    <option value="code" ${type === 'code' ? 'selected' : ''}>Code Challenge</option>
                </select>
            </div>
        </div>
        
        <button onclick="removeQuestion(this)" class="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        
        <div class="q-content space-y-2 pl-2 border-l-2 border-purple-200">
            <!-- Dynamic Content -->
        </div>
    `;
    
    container.appendChild(div);
    renderQuestionInputs(div.querySelector('.q-content'), type, id, data);
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

window.changeQuestionType = (select) => {
    const item = select.closest('.question-item');
    const contentDiv = item.querySelector('.q-content');
    const id = item.dataset.id;
    renderQuestionInputs(contentDiv, select.value, id, null);
}

window.renderQuestionInputs = (container, type, id, data) => {
    let html = '';
    
    if(type === 'multiple') {
        // QCM
        html = [0, 1, 2].map(i => `
            <div class="flex items-center gap-2">
                <input type="radio" name="correct-${id}" value="${i}" class="q-correct accent-purple-600 w-4 h-4 cursor-pointer" ${data && data.correctIndex == i ? 'checked' : (i===0 && !data ? 'checked' : '')}>
                <input type="text" class="q-opt flex-1 p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs" placeholder="Option ${i+1}" value="${data && data.options && data.options[i] ? data.options[i] : ''}">
            </div>
        `).join('');
    } else if (type === 'boolean') {
        // TRUE / FALSE
        const isTrue = data ? (data.correctAnswer === 'true') : true;
        html = `
            <div class="flex gap-4 mt-2">
                <label class="flex items-center gap-2 cursor-pointer p-2 bg-white border ${isTrue ? 'border-green-500 bg-green-50' : 'border-gray-200'} rounded-lg flex-1">
                    <input type="radio" name="correct-${id}" value="true" class="q-correct accent-green-600" ${isTrue ? 'checked' : ''}>
                    <span class="text-sm font-bold ${isTrue ? 'text-green-700' : 'text-gray-600'}">Vrai</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer p-2 bg-white border ${!isTrue && data ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-lg flex-1">
                    <input type="radio" name="correct-${id}" value="false" class="q-correct accent-red-600" ${!isTrue && data ? 'checked' : ''}>
                    <span class="text-sm font-bold ${!isTrue && data ? 'text-red-700' : 'text-gray-600'}">Faux</span>
                </label>
            </div>
        `;
    } else if (type === 'short') {
        // SHORT ANSWER
        html = `
            <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Réponse exacte attendue</label>
                <input type="text" class="q-answer w-full p-2 bg-purple-50 border border-purple-200 rounded-lg outline-none text-sm font-bold text-purple-700" placeholder="Ex: Paris" value="${data ? data.correctAnswer : ''}">
                <p class="text-[10px] text-gray-400 mt-1">L'étudiant devra taper ce mot exactement (ignorant la casse).</p>
            </div>
        `;
    } else if (type === 'image_choice') {
        // IMAGE CHOICE
        // Use placeholder images if no data
        html = `
            <p class="text-[10px] text-gray-400 mb-2">Entrez les URLs des images. Sélectionnez la bonne réponse.</p>
            ${[0, 1, 2, 3].map(i => `
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${id}" value="${i}" class="q-correct accent-purple-600 w-4 h-4 cursor-pointer" ${data && data.correctIndex == i ? 'checked' : (i===0 && !data ? 'checked' : '')}>
                <input type="text" class="q-img-url flex-1 p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs" placeholder="URL Image ${i+1} (https://...)" value="${data && data.options ? (data.options[i]?.image || '') : ''}">
                <button class="p-2 bg-gray-100 rounded hover:bg-gray-200" title="Upload" onclick="alert('Upload simulé: Copiez une URL pour le moment')"><i data-lucide="image" class="w-4 h-4 text-gray-500"></i></button>
            </div>
            `).join('')}
        `;
    } else if (type === 'ordering') {
        // ORDERING
        html = `
            <p class="text-[10px] text-gray-400 mb-2">Entrez les éléments dans l'<strong>ORDRE CORRECT</strong>. Ils seront mélangés pour l'étudiant.</p>
            ${[0, 1, 2, 3].map(i => `
            <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-bold text-gray-400 w-6">${i+1}.</span>
                <input type="text" class="q-order-item flex-1 p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs" placeholder="Étape ${i+1}" value="${data && data.items ? (data.items[i]?.text || '') : ''}">
            </div>
            `).join('')}
        `;
    } else if (type === 'matching') {
        // MATCHING
        html = `
            <p class="text-[10px] text-gray-400 mb-2">Entrez les paires correspondantes (A va avec B).</p>
            ${[0, 1, 2].map(i => `
            <div class="flex items-center gap-2 mb-2">
                <input type="text" class="q-match-a flex-1 p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs" placeholder="Terme A" value="${data && data.pairs ? (data.pairs[i]?.a || '') : ''}">
                <i data-lucide="arrow-right" class="w-4 h-4 text-gray-300"></i>
                <input type="text" class="q-match-b flex-1 p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs" placeholder="Définition B" value="${data && data.pairs ? (data.pairs[i]?.b || '') : ''}">
            </div>
            `).join('')}
        `;
    } else if (type === 'cloze') {
        // CLOZE
        html = `
            <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Texte avec trous</label>
                <textarea class="q-cloze-text w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-mono h-24" placeholder="Angular est un {{framework}} créé par {{Google}}.">${data ? data.content : ''}</textarea>
                <p class="text-[10px] text-purple-600 mt-1 font-bold">Mettez les mots à cacher entre doubles accolades {{...}}.</p>
            </div>
        `;
    } else if (type === 'code') {
        // CODE
        html = `
            <div class="space-y-3">
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">Snippet de Code</label>
                    <textarea class="q-code-snippet w-full p-2 bg-gray-900 text-green-400 border border-gray-700 rounded-lg outline-none text-sm font-mono h-24" placeholder="function test() { ... }">${data ? data.codeSnippet : ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">Réponse attendue (Facultatif)</label>
                    <textarea class="q-code-answer w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-mono h-16" placeholder="Sortie attendue ou correction...">${data ? data.correctAnswer : ''}</textarea>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

window.removeQuestion = (btn) => {
    btn.closest('.question-item').remove();
}

window.saveQuiz = () => {
    const titleInput = document.getElementById('q-title');
    const title = titleInput.value.trim();
    
    if(!title) { 
        alert("Veuillez donner un titre à votre évaluation (tout en haut)."); 
        titleInput.focus();
        titleInput.classList.add('border-red-500');
        titleInput.addEventListener('input', () => titleInput.classList.remove('border-red-500'), { once: true });
        return; 
    }
    
    const type = document.querySelector('input[name="q-type"]:checked').value;
    const chapterId = document.getElementById('q-chapter').value || null; // Capture Chapter ID
    
    let quizData = {
        title,
        type,
        chapterId // Save it
    };
    
    if(type === 'native') {
        const questionsContainer = document.getElementById('questions-container');
        const questionEls = questionsContainer.querySelectorAll('.question-item');
        
        if(questionEls.length === 0) { alert("Au moins une question requise pour un QCM"); return; }
        
        const questions = [];
        
        for(let el of questionEls) {
            const text = el.querySelector('.q-text').value;
            if(!text) { alert("Texte de question manquant"); return; }
            
            const qType = el.querySelector('.q-type-select').value;
            let questionData = {
                text,
                type: qType
            };
            
            if(qType === 'multiple') {
                const options = [];
                let correctIndex = 0;
                const optInputs = el.querySelectorAll('.q-opt');
                const radios = el.querySelectorAll('.q-correct');
                
                for(let i=0; i<optInputs.length; i++) {
                    const optVal = optInputs[i].value;
                    if(!optVal) { alert("Toutes les options de réponse doivent être remplies"); return; }
                    options.push(optVal);
                    if(radios[i].checked) correctIndex = i;
                }
                questionData.options = options;
                questionData.correctIndex = correctIndex;
                
            } else if (qType === 'boolean') {
                const checked = el.querySelector('.q-correct:checked');
                if(!checked) { alert("Veuillez sélectionner Vrai ou Faux par défaut"); return; }
                questionData.correctAnswer = checked.value; // "true" or "false"
                
            } else if (qType === 'short') {
                const ans = el.querySelector('.q-answer').value;
                if(!ans) { alert("Réponse attendue manquante"); return; }
                questionData.correctAnswer = ans;

            } else if (qType === 'image_choice') {
                const options = [];
                let correctIndex = 0;
                const urlInputs = el.querySelectorAll('.q-img-url');
                const radios = el.querySelectorAll('.q-correct');

                for(let i=0; i<urlInputs.length; i++) {
                    const url = urlInputs[i].value;
                    // Allow empty URLs if less than 4 needed? Enforce at least 2.
                    if(i < 2 && !url) { alert("Au moins 2 images sont requises"); return; }
                    if(url) {
                         options.push({ id: i, image: url });
                    }
                    if(radios[i].checked) correctIndex = i;
                }
                questionData.options = options;
                questionData.correctIndex = correctIndex;

            } else if (qType === 'ordering') {
                const items = [];
                const itemInputs = el.querySelectorAll('.q-order-item');
                for(let i=0; i<itemInputs.length; i++) {
                    const txt = itemInputs[i].value;
                    if(i < 2 && !txt) { alert("Au moins 2 éléments à ordonner"); return; }
                    if(txt) {
                        items.push({ id: i, text: txt, order: i });
                    }
                }
                questionData.items = items;

            } else if (qType === 'matching') {
                const pairs = [];
                const inputsA = el.querySelectorAll('.q-match-a');
                const inputsB = el.querySelectorAll('.q-match-b');
                
                for(let i=0; i<inputsA.length; i++) {
                    const valA = inputsA[i].value;
                    const valB = inputsB[i].value;
                    if(i < 2 && (!valA || !valB)) { alert("Au moins 2 paires requises"); return; }
                    if(valA && valB) {
                        pairs.push({ a: valA, b: valB });
                    }
                }
                questionData.pairs = pairs;

            } else if (qType === 'cloze') {
                const content = el.querySelector('.q-cloze-text').value;
                if(!content) { alert("Texte à trous manquant"); return; }
                // Validate {{...}}?
                if(!content.includes('{{') || !content.includes('}}')) {
                    alert("Le texte à trous doit contenir au moins un élément entre {{ }}"); return;
                }
                questionData.content = content;

            } else if (qType === 'code') {
                const snippet = el.querySelector('.q-code-snippet').value;
                const ans = el.querySelector('.q-code-answer').value;
                if(!snippet) { alert("Snippet de code manquant"); return; }
                questionData.codeSnippet = snippet;
                questionData.correctAnswer = ans;
            }
            
            questions.push(questionData);
        }
        quizData.questions = questions;
        
    } else if (type === 'link') {
        const url = document.getElementById('q-link-url').value;
        if(!url) { alert("Lien du quiz obligatoire"); return; }
        quizData.content = url;
    
    } else if (type === 'file') {
        const instr = document.getElementById('q-file-instr').value;
        const fileInput = document.getElementById('q-file-input');
        
        if(!currentQuizId && (!fileInput.files || fileInput.files.length === 0)) {
            alert("Veuillez choisir un fichier pour le devoir"); return;
        }
        
        quizData.instructions = instr;
        if(fileInput.files && fileInput.files.length > 0) {
            quizData.content = fileInput.files[0].name; // Mock upload
        } else if(currentQuizId) {
            // Keep existing content
            const old = tempQuizzes.find(q => q.id === currentQuizId);
            if(old) quizData.content = old.content;
        }
    }
    
    if(currentQuizId) {
        // Update Quiz (TODO: Implement edit logic)
        alert("Édition de quiz non implémentée pour le moment");
        return;
    } else {
        // Create New Quiz
        quizData.id = Date.now();
        
        // HYBRID LESSON MODE: Add to lesson contents
        if(currentQuizLessonId) {
            const chap = tempChapters.find(c => String(c.id) === String(chapterId));
            if(!chap) { alert("Chapitre introuvable"); return; }
            
            const lesson = chap.lessons.find(l => l.id === currentQuizLessonId);
            if(!lesson) { alert("Leçon introuvable"); return; }
            
            // Initialize contents array if needed
            if(!lesson.contents) lesson.contents = [];
            
            // Add quiz as content item
            const quizContentItem = {
                type: 'quiz',
                title: quizData.title,
                questions: quizData.questions || [],
                // Embed full quiz data for native quizzes
                ...quizData
            };
            
            lesson.contents.push(quizContentItem);
            renderChapters();
            closeQuizModal();
            return;
        }
        
        // LEGACY MODE: Create standalone quiz lesson (fallback)
        if(chapterId) {
             const chap = tempChapters.find(c => String(c.id) === String(chapterId));
             if(chap) {
                 const lessonQuiz = {
                     id: quizData.id,
                     title: quizData.title,
                     type: 'quiz',
                     content: quizData.questions ? `${quizData.questions.length} Questions` : (quizData.content || 'Quiz'),
                     meta: 'quiz',
                     data: quizData 
                 };
                 
                 if(currentInsertIndex > -1) {
                     chap.lessons.splice(currentInsertIndex + 1, 0, lessonQuiz);
                 } else {
                     chap.lessons.push(lessonQuiz);
                 }
                 renderChapters();
             } else {
                 alert("Erreur: Chapitre introuvable");
             }
        } else {
             alert("Veuillez sélectionner un chapitre pour ce quiz");
             return;
        }
    }
    
    closeQuizModal();
} // End saveQuiz

window.renderQuizzes = () => {
    const container = document.getElementById('quiz-container');
    if(tempQuizzes.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <div class="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                    <i data-lucide="help-circle" class="w-6 h-6 text-gray-400"></i>
                </div>
                <p class="text-gray-500 font-medium">Aucune évaluation pour le moment.</p>
                <button onclick="addQuiz()" class="text-purple-600 font-bold text-sm mt-1 hover:underline">Commencer à ajouter</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tempQuizzes.map((q, index) => {
        let icon = 'list-checks', color = 'text-purple-600', bg = 'bg-purple-100', info = `${q.questions ? q.questions.length : 0} Questions`;
        
        if(q.type === 'link') {
            icon = 'link'; color = 'text-blue-600'; bg = 'bg-blue-100'; info = 'Lien Externe';
        } else if (q.type === 'file') {
             icon = 'file-up'; color = 'text-orange-600'; bg = 'bg-orange-100'; info = 'Devoir / Fichier';
        }

        return `
        <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-enter mb-4 relative group">
             <div class="absolute left-0 top-0 bottom-0 w-1.5 ${q.type === 'link' ? 'bg-blue-500' : (q.type === 'file' ? 'bg-orange-500' : 'bg-purple-500')} rounded-l-xl"></div>
             
             <div class="flex justify-between items-start">
                <div class="flex items-center gap-4">
                    <div class="p-3 rounded-lg ${bg} ${color}">
                        <i data-lucide="${icon}" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg">${q.title}</h3>
                        <p class="text-xs text-gray-500 font-medium flex items-center gap-1">
                            ${info}
                            ${q.type === 'link' ? `<a href="${q.content}" target="_blank" class="hover:underline text-blue-400 truncate max-w-[150px] inline-block align-bottom ml-1 hidden md:inline-block">(${q.content})</a>` : ''}
                        </p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editQuiz(${q.id})" class="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="removeQuiz(${q.id})" class="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
             </div>
        </div>
    `}).join('');
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

window.removeQuiz = (id) => {
    if(confirm('Supprimer ce quiz ?')) {
        tempQuizzes = tempQuizzes.filter(q => q.id !== id);
        renderQuizzes();
    }
}

function renderCourseSummary() {
    const container = document.getElementById('course-summary-container');
    if(!container) return;

    if(tempChapters.length === 0 && tempQuizzes.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400 italic">Aucun contenu ajouté.</p>';
        return;
    }

    let html = '';
    
    // Chapters
    tempChapters.forEach((chap, idx) => {
        html += `
            <div class="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-bold text-gray-500 uppercase">Chapitre ${idx + 1}</span>
                    <span class="text-sm font-bold text-gray-800">${chap.title}</span>
                </div>
        `;
        
        if(chap.lessons.length > 0) {
            html += `<ul class="space-y-1 pl-4 border-l-2 border-gray-100 ml-1">`;
            chap.lessons.forEach(l => {
                let icon = l.type === 'video' ? 'video' : 'file-text';
                let color = l.type === 'video' ? 'text-blue-500' : 'text-red-500';
                html += `
                    <li class="text-xs text-gray-600 flex items-center gap-2">
                         <i data-lucide="${icon}" class="w-3 h-3 ${color}"></i> ${l.title}
                    </li>
                `;
            });
            html += `</ul>`;
        } else {
             html += `<p class="text-xs text-gray-400 pl-4 italic">Aucune leçon.</p>`;
        }
        
        html += `</div>`;
    });

    // Quizzes Summary
    if(tempQuizzes.length > 0) {
        html += `<div class="mt-4 pt-2 border-t border-dashed border-gray-200">
            <h4 class="text-xs font-bold text-purple-600 uppercase mb-2">Quiz & Évaluations</h4>
            <ul class="space-y-2">`;
        
        tempQuizzes.forEach(q => {
            let icon = 'help-circle';
            let color = 'text-purple-500';
            let bg = 'bg-purple-50';
            
            if(q.type === 'link') { icon = 'link'; color = 'text-blue-500'; bg = 'bg-blue-50'; }
            if(q.type === 'file') { icon = 'file-up'; color = 'text-orange-500'; bg = 'bg-orange-50'; }
            
             html += `
                <li class="flex items-center gap-2 text-sm text-gray-700 ${bg} p-2 rounded-lg">
                    <i data-lucide="${icon}" class="w-4 h-4 ${color}"></i> ${q.title}
                </li>
             `;
        });
        
        html += `</ul></div>`;
    }

    container.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// --- Data & Submit ---

window.finish = async () => {
    const title = document.getElementById('w-title').value;
    const isFree = document.getElementById('w-free').checked;
    const price = isFree ? 0 : (document.getElementById('w-price').value || 0);
    const promo = isFree ? 0 : (document.getElementById('w-promo').value || 0); // Get Promo
    const desc = document.getElementById('w-desc').value || '';
    
    if(!title) { alert("Le titre est obligatoire"); return; }

    const user = dataManager.getCurrentUser();
    if(!user) {
        alert("❌ Erreur: Vous devez être connecté pour créer un cours.\n\nVeuillez vous reconnecter.");
        window.location.href = '/index.html';
        return;
    }

    // Check if token exists
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if(!token) {
        alert("❌ Session expirée. Veuillez vous reconnecter.");
        window.location.href = '/index.html';
        return;
    }

    console.log("✅ Utilisateur connecté:", user.name, "| Token présent:", !!token);

    const courseData = {
        title,
        description: desc,
        price: parseInt(price),
        promoPrice: parseInt(promo), // Save Promo
        cover: currentCoverImage, 
        chapters: tempChapters,
        quizzes: tempQuizzes,
        isPublished: true,
        instructorId: user.id,
        instructorName: user.name,
        updatedAt: new Date().toISOString()
    };

    const btnFinish = document.getElementById('btn-finish');
    if(btnFinish) {
        btnFinish.disabled = true;
        btnFinish.innerHTML = '<i class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></i> Publication...';
    }

    try {
        if(editingId) {
            // Update
            console.log("📝 Mise à jour du cours:", editingId);
            await dataManager.update("courses", editingId, courseData);
            console.log("✅ Course updated:", editingId);
        } else {
            // Create New
            courseData.createdAt = new Date().toISOString();
            courseData.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
            
            console.log("📝 Création du cours:", courseData.title);
            await dataManager.create("courses", courseData);
            console.log("✅ Course created:", courseData.id);
        }

        alert("✅ Cours publié avec succès ! 🚀");
        showList();
    } catch (error) {
        console.error("❌ Erreur saving course:", error);
        
        // Better error messages
        let errorMsg = "❌ Erreur lors de la sauvegarde:\n\n";
        if(error.message.includes('401')) {
            errorMsg += "Session expirée. Veuillez vous reconnecter.";
            setTimeout(() => window.location.href = '/index.html', 2000);
        } else if(error.message.includes('403')) {
            errorMsg += "Accès refusé. Vérifiez vos permissions.";
        } else {
            errorMsg += error.message || "Erreur inconnue";
        }
        
        alert(errorMsg);
    } finally {
        if(btnFinish) {
            btnFinish.disabled = false;
            btnFinish.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> Publier Maintenant';
            if(typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
}

async function loadCourses() {
    const container = document.getElementById('courses-grid');
    if(!container) return;

    container.innerHTML = '<div class="col-span-3 text-center py-20"><div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div></div>';

    const courses = await dataManager.getAll("courses");
    
    // Fix: Add null check for getCurrentUser()
    const currentUser = dataManager.getCurrentUser();
    if(!currentUser) {
        console.error("No user logged in");
        container.innerHTML = `
            <div class="col-span-3 text-center py-20">
                <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-circle" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Erreur de connexion</h3>
                <p class="text-gray-500 mb-6">Vous devez être connecté pour voir vos cours.</p>
                <a href="/index.html" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 inline-block">Se connecter</a>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const myCourses = courses.filter(c => c.instructorId === currentUser.id);

    if(myCourses.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-20">
                <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="video" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Aucun cours trouvé</h3>
                <p class="text-gray-500 mb-6">Commencez par créer votre premier cours en vidéo.</p>
                <button onclick="showWizard()" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Créer un Cours</button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = myCourses.map(c => {
        // Price Logic
        let priceDisplay = '';
        if(c.price == 0) {
            priceDisplay = '<span class="text-green-600 font-bold text-lg">Gratuit</span>';
        } else if (c.promoPrice && c.promoPrice > 0 && c.promoPrice < c.price) {
            priceDisplay = `
                <div class="flex flex-col items-end">
                    <span class="text-red-500 font-bold text-lg">${c.promoPrice} TND</span>
                    <span class="text-gray-400 text-xs line-through font-medium">${c.price} TND</span>
                </div>
            `;
        } else {
             priceDisplay = `<span class="text-blue-600 font-bold text-lg">${c.price} TND</span>`;
        }

        return `
        <div class="premium-card bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
            <div class="h-48 bg-gray-200 relative">
                <img src="${c.cover || 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-gray-800">
                    ${c.chapters ? c.chapters.length : 0} Chapitres
                </div>
                <div class="absolute top-2 left-2 bg-purple-600/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-white">
                    ${c.quizzes ? c.quizzes.length : 0} Quiz
                </div>
            </div>
            <div class="p-6">
                <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-1">${c.title}</h3>
                <div class="flex items-center justify-between mt-4">
                    ${priceDisplay}
                    
                    <div class="flex gap-2">
                        <button onclick="openUserPreview('${c.id}')" class="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors tooltip flex items-center justify-center" title="Aperçu Étudiant (Course Player)">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="editCourse('${c.id}')" class="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors tooltip" title="Modifier">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteCourse('${c.id}')" class="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors tooltip" title="Supprimer">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
    lucide.createIcons();
}


window.deleteCourse = async (id) => {
    if(confirm("Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.")) {
        try {
            await dataManager.delete("courses", id);
            // Also notify the server to delete associated files (optional, depending on backend)
            alert("Cours supprimé avec succès.");
            loadCourses();
        } catch(e) {
            console.error(e);
            alert("Erreur lors de la suppression.");
        }
    }
}

window.editCourse = async (id) => {
    try {
        const course = await dataManager.getById("courses", id);
        if(course) {
            editingId = course.id;
            
            // Populate Form
            document.getElementById('w-title').value = course.title;
            document.getElementById('w-price').value = course.price;
            document.getElementById('w-promo').value = course.promoPrice || ''; // Load Promo
            
            if(course.price == 0) document.getElementById('w-free').checked = true;
            document.getElementById('w-desc').value = course.description || '';
            
            // Load Chapters
            tempChapters.length = 0; 
            if(course.chapters) course.chapters.forEach(c => {
                if(!c.lessons) c.lessons = [];
                tempChapters.push(c);
            });
            
            // Load Quizzes
            tempQuizzes = course.quizzes || [];
            
            // Load Cover
            currentCoverImage = course.cover || null;
            if(currentCoverImage) {
                document.querySelectorAll('#prev-img-edit').forEach(img => {
                    img.src = currentCoverImage;
                    img.classList.remove('hidden');
                });
                document.querySelectorAll('#prev-card-img').forEach(img => {
                    img.src = currentCoverImage;
                });
            }

            // Show Wizard
            showWizard(false);
            renderChapters();
            renderQuizzes(); 
        }
    } catch(e) {
        console.error(e);
        alert("Impossible de charger le cours.");
    }
}

function resetForm() {
    editingId = null;
    tempChapters.length = 0; // Clear without reassignment
    tempQuizzes = []; // Clear quizzes
    
    const titleIn = document.getElementById('w-title');
    if(titleIn) titleIn.value = '';
    const priceIn = document.getElementById('w-price');
    if(priceIn) priceIn.value = '';
    
    // Clear other inputs
    const descIn = document.getElementById('w-desc');
    if(descIn) descIn.value = '';
    
    document.getElementById('w-free').checked = false;
    
    // Reset Cover
    currentCoverImage = null;
    document.querySelectorAll('#prev-img-edit').forEach(img => img.classList.add('hidden'));
    document.querySelectorAll('#prev-card-img').forEach(img => img.src = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800'); // Default
    
    renderChapters();
    renderQuizzes();
}

window.updateMathPreview = (input) => {
    const previewBox = input.nextElementSibling; // div.math-preview
    if (!previewBox) return;

    const val = input.value;
    const hasMath = val.includes('$') || val.includes('\\'); // Naive check

    if (hasMath && val.trim() !== '') {
        previewBox.classList.remove('hidden');
        previewBox.textContent = val; // Set text first logic for KaTeX to find
        
        if (typeof renderMathInElement === 'function') {
             try {
                 renderMathInElement(previewBox, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false}
                    ],
                    throwOnError: false
                 });
             } catch(e) {
                 console.warn("Math Render Error", e);
             }
        }
    } else {
        previewBox.classList.add('hidden');
    }
};
