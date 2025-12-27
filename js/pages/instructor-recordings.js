// Logic for Recorded Courses (Enregistre)
// Handles Wizard, Chapters, and Data Logic

const tempChapters = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    
    // Explicitly bind modal buttons
    const bindBtn = (id, handler) => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Button ${id} clicked`);
                handler();
            });
        } else {
            console.warn(`Button ${id} NOT FOUND`);
        }
    };

    bindBtn('btn-cancel-lesson', closeLessonModal);
    bindBtn('btn-confirm-lesson', confirmAddLesson);
    bindBtn('btn-close-modal-x', closeLessonModal); // Bind X button
    
    // Bind Navigation Buttons
    bindBtn('btn-step1-next', () => nextStep(2));
    bindBtn('btn-step2-back', () => nextStep(1));
    bindBtn('btn-step2-next', () => nextStep(3));
    bindBtn('btn-finish', () => finish()); // Wrap to ensure scope
    bindBtn('btn-step3-back', () => nextStep(2));

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
    if(modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex'); // Ensure flex is removed if added
    }
    currentChapterId = null;
    console.log("Modal closed");
}

window.showList = () => {
    document.getElementById('view-wizard').classList.add('hidden');
    document.getElementById('view-wizard').classList.remove('flex');
    document.getElementById('view-list').classList.remove('hidden');
    loadCourses(); // Refresh list
}

window.nextStep = (step) => {
    goToStep(step);
}

function goToStep(step) {
    // Hide all steps
    [1, 2, 3].forEach(s => {
        document.getElementById(`step-${s}`).classList.add('hidden');
        document.getElementById(`step-ind-${s}`).classList.remove('active', 'completed');
        // Reset indicator color
        const num = document.querySelector(`#step-ind-${s} .step-number`);
        if(num) {
            num.classList.remove('bg-blue-600', 'text-white', 'bg-indigo-600', 'bg-green-600', 'bg-green-500');
            num.classList.add('text-gray-400');
        }
    });

    // Show current step
    document.getElementById(`step-${step}`).classList.remove('hidden');
    
    // Update Indicators
    for(let i=1; i<=step; i++) {
        const ind = document.getElementById(`step-ind-${i}`);
        const num = ind.querySelector('.step-number');
        
        if(i === step) {
            ind.classList.add('active');
            let color = 'blue';
            if(step === 2) color = 'indigo';
            if(step === 3) color = 'green';
            
            num.classList.remove('text-gray-400', 'border-gray-200');
            num.classList.add(`bg-${color}-600`, 'text-white', `border-${color}-600`);
        } else {
            ind.classList.add('completed');
            num.classList.remove('text-gray-400');
            num.classList.add('bg-green-500', 'text-white', 'border-green-500');
        }
    }

    if(step === 3) {
        renderCourseSummary();
    }
}

// --- Form & Preview Logic ---

window.updatePreview = () => {
    const title = document.getElementById('w-title').value || "Titre du cours";
    // const price = document.getElementById('w-price').value || "0"; 
    // We update multiple preview elements if they exist
    
    // In step 3 preview card
    const prevTitle = document.querySelector('#prev-card-title'); // Assuming only on step 3 for now or generic class
    if(prevTitle) {
        document.querySelectorAll('#prev-card-title').forEach(el => el.textContent = title);
    }
}

let currentCoverImage = null;

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

/**
 * Open Modal to add a lesson
 */
window.addLesson = (chapId) => {
    currentChapterId = chapId;
    document.getElementById('lesson-modal').classList.remove('hidden');
    document.getElementById('l-title').focus();
    
    // Reset inputs
    document.getElementById('l-title').value = '';
    document.getElementById('l-video-url').value = '';
    document.getElementById('l-video-file').value = '';
    document.getElementById('vid-file-name').innerText = 'Cliquez pour choisir une vidéo';
    document.getElementById('l-file').value = '';
    
    // Default to video link
    document.querySelector('input[name="l-type"][value="video"]').checked = true;
    document.querySelector('input[name="video-source"][value="link"]').checked = true;
    toggleLessonInputs();
    toggleVideoSource();
}

window.toggleLessonInputs = () => {
    const type = document.querySelector('input[name="l-type"]:checked').value;
    const vidSection = document.getElementById('section-video');
    const fileInput = document.getElementById('input-file');
    
    if (type === 'video') {
        vidSection.classList.remove('hidden');
        fileInput.classList.add('hidden');
    } else {
        vidSection.classList.add('hidden');
        fileInput.classList.remove('hidden');
    }
}

window.toggleVideoSource = () => {
    const source = document.querySelector('input[name="video-source"]:checked').value;
    const linkInput = document.getElementById('v-input-link');
    const uploadInput = document.getElementById('v-input-upload');

    if(source === 'link') {
        linkInput.classList.remove('hidden');
        uploadInput.classList.add('hidden');
    } else {
        linkInput.classList.add('hidden');
        uploadInput.classList.remove('hidden');
    }
}

window.updateVideoFileName = (input) => {
    if(input.files && input.files[0]) {
        document.getElementById('vid-file-name').innerText = input.files[0].name;
    }
}

window.confirmAddLesson = () => {
    console.log("Adding lesson..."); // Debug
    try {
        const title = document.getElementById('l-title').value;
        const typeEl = document.querySelector('input[name="l-type"]:checked');
        const type = typeEl ? typeEl.value : 'video';
        
        let content = '';
        let meta = ''; // To store extra info like 'youtube', 'local', 'pdf'
        
        if(!title) { alert("Le titre est obligatoire"); return; }
        
        if(type === 'video') {
            const sourceEl = document.querySelector('input[name="video-source"]:checked');
            const source = sourceEl ? sourceEl.value : 'link';
            
            if(source === 'link') {
                content = document.getElementById('l-video-url').value;
                if(!content) { alert("Lien vidéo requis"); return; }
                meta = 'link';
            } else {
                const file = document.getElementById('l-video-file').files[0];
                if(!file) { alert("Veuillez choisir une vidéo (ou utilisez un lien externe)"); return; }
                content = file.name; // In real app, we upload and get URL
                meta = 'local';
            }
        } else {
            // PDF
            const file = document.getElementById('l-file').files[0];
            // Allow empty file for demo if needed, but alert is better
            if(!file) { alert("Fichier PDF requis"); return; }
            content = file.name;
            meta = 'pdf';
        }
        
        console.log("Lesson Data:", { title, type, content, meta });

        if(!currentChapterId) {
             console.error("No chapter selected!");
             alert("Erreur: Aucun chapitre sélectionné. Veuillez réessayer.");
             closeLessonModal();
             return;
        }

        // Fix potential type mismatch (string vs number)
        const chap = tempChapters.find(c => String(c.id) === String(currentChapterId));
        if(chap) {
            chap.lessons.push({
                id: Date.now(),
                title,
                type,
                content,
                meta
            });
            console.log("Adding lesson to chapter:", chap.title, chap.lessons);
            renderChapters();
            closeLessonModal();
            console.log("Lesson added successfully.");
        } else {
            console.error("Chapter not found for ID:", currentChapterId, "Available Chapters:", tempChapters);
            alert("Erreur critique: Impossible de trouver le chapitre. Veuillez refaire l'opération.");
            closeLessonModal();
        }
    } catch (error) {
        console.error("Error adding lesson:", error);
        alert("Une erreur est survenue lors de l'ajout. Vérifiez la console (F12).");
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
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-xl"></div>
            
            <div class="flex justify-between items-center mb-4 pl-2">
                <input type="text" value="${chap.title}" 
                    class="font-bold text-lg text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors w-full mr-4"
                    onchange="updateChapterTitle(${chap.id}, this.value)">
                <button onclick="removeChapter(${chap.id})" class="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            
            <div class="pl-2 space-y-2">
                ${chap.lessons.map(l => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="p-2 rounded-lg ${l.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'} relative">
                                <i data-lucide="${l.type === 'video' ? 'video' : 'file-text'}" class="w-4 h-4"></i>
                                ${l.meta === 'local' ? '<div class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>' : ''}
                            </div>
                            <div>
                                <div class="text-sm font-bold text-gray-900">${l.title}</div>
                                <div class="text-[10px] text-gray-400 font-medium truncate max-w-[200px] flex items-center gap-1">
                                    ${l.meta === 'local' ? '<i data-lucide="hard-drive" class="w-3 h-3"></i>' : (l.type === 'video' ? '<i data-lucide="link" class="w-3 h-3"></i>' : '')}
                                    ${l.content}
                                </div>
                            </div>
                        </div>
                        <button onclick="removeLesson(${chap.id}, ${l.id})" class="text-gray-400 hover:text-red-500 p-1"><i data-lucide="x" class="w-4 h-4"></i></button>
                    </div>
                `).join('')}
                
                <button onclick="addLesson(${chap.id})" class="mt-2 w-full py-2 border border-dashed border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="plus-circle" class="w-4 h-4"></i> Ajouter une leçon
                </button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

window.updateChapterTitle = (id, newTitle) => {
    const chap = tempChapters.find(c => c.id === id);
    if(chap) chap.title = newTitle;
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

function renderCourseSummary() {
    const container = document.getElementById('course-summary-container');
    if(!container) return;

    if(tempChapters.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400 italic">Aucun chapitre ajouté.</p>';
        return;
    }

    let html = '';
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

    container.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// --- Data & Submit ---

window.finish = async () => {
    const title = document.getElementById('w-title').value;
    const price = document.getElementById('w-free').checked ? 0 : (document.getElementById('w-price').value || 0);
    const desc = document.getElementById('w-desc').value || '';
    
    if(!title) { alert("Le titre est obligatoire"); return; }

    const user = dataManager.getCurrentUser();
    if(!user) {
        alert("Erreur: Utilisateur non connecté.");
        return;
    }

    const courseData = {
        title,
        description: desc,
        price,
        cover: currentCoverImage, // Include the image
        chapters: tempChapters,
        isPublished: true,
        instructorId: user.id,
        instructorName: user.name, // Good to denormalize for easier display
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
            await dataManager.update("courses", editingId, courseData);
            console.log("Course updated:", editingId);
        } else {
            // Create New
            courseData.createdAt = new Date().toISOString();
            courseData.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
            
            await dataManager.create("courses", courseData);
            console.log("Course created");
        }

        alert("Cours publié avec succès ! 🚀");
        showList();
    } catch (error) {
        console.error("Erreur saving course:", error);
        alert("Erreur lors de la sauvegarde. Vérifiez la console.");
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
    const myCourses = courses.filter(c => c.instructorId === dataManager.getCurrentUser().id);

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

    container.innerHTML = myCourses.map(c => `
        <div class="premium-card bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
            <div class="h-48 bg-gray-200 relative">
                <img src="${c.cover || 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-gray-800">
                    ${c.chapters ? c.chapters.length : 0} Chapitres
                </div>
            </div>
            <div class="p-6">
                <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-1">${c.title}</h3>
                <div class="flex items-center justify-between mt-4">
                    <span class="text-blue-600 font-bold text-lg">${c.price == 0 ? 'Gratuit' : c.price + ' TND'}</span>
                    
                    <div class="flex gap-2">
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
    `).join('');
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
            if(course.price == 0) document.getElementById('w-free').checked = true;
            
            // Load Chapters
            tempChapters = course.chapters || [];
            
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
            // Don't resetForm() here because showWizard calls it.
            // Wait.. showWizard calls resetForm(). We need to override that.
            // Let's modify showWizard slightly or handle it manually.
        }
    } catch(e) {
        console.error(e);
        alert("Impossible de charger le cours.");
    }
}

function resetForm() {
    editingId = null;
    tempChapters = []; // Clear array reference
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
}
