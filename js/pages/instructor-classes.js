
// instructor-classes.js - Gestion Complète des Classes

let currentTab = 'classes';
let isEditing = false;
let editingId = null;
let wizStep = 1;

// Temporary Data for Wizard
let tempSlots = [];
let tempSchedule = []; // New: Live Class Schedule
let tempInvites = []; // New: Invited Students
let tempFolders = []; // New: Folders for Resources
let tempResources = []; // For Drive/PDFs
let tempStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (window.dataManager) await dataManager.init();
    lucide.createIcons();
    loadClasses();
});

// --- Main Loads ---

async function loadClasses() {
    const user = dataManager.getCurrentUser();
    if (!user) return; // Should redirect if not logged

    // Load Data
    const allCourses = await dataManager.getAll("courses") || [];
    const allEnrollments = await dataManager.getAll("enrollments") || [];
    const allUsers = await dataManager.getAll("users") || [];

    // Filter Instructor Classes
    const myClasses = allCourses.filter(c => c.instructorId === user.id && c.type === 'class'); // Assuming type='class' differentiates

    updateStats(myClasses, allEnrollments);
    renderClassesList(myClasses, allEnrollments);
    renderRequestsList(myClasses, allEnrollments, allUsers);
    renderPaymentsList(myClasses, allEnrollments, allUsers);
}

function updateStats(classes, enrollments) {
    // Total Classes
    document.getElementById("stat-total-classes").textContent = classes.length;
    
    // Total Active Students (Unique)
    const myClassIds = classes.map(c => c.id);
    const myEnrollments = enrollments.filter(e => myClassIds.includes(e.courseId) && e.status === 'active');
    document.getElementById("stat-total-students").textContent = myEnrollments.length;

    // Total Revenue (Estimated vs Actual)
    let totalRevenue = 0;
    let expectedRevenue = 0;
    
    myEnrollments.forEach(e => {
        const cls = classes.find(c => c.id === e.courseId);
        if (cls) {
            totalRevenue += (e.amountPaid || 0);
            expectedRevenue += (cls.price || 0);
        }
    });

    document.getElementById("stat-revenue").textContent = totalRevenue + " TND";
    document.querySelector("#stat-revenue + p").textContent = `Objectif: ${expectedRevenue} TND`;

    // Payment Rate
    const rate = expectedRevenue > 0 ? Math.round((totalRevenue / expectedRevenue) * 100) : 0;
    document.getElementById("stat-payment-rate").textContent = rate + "%";
}

// --- Render Lists ---

function renderClassesList(classes, enrollments) {
    const container = document.getElementById("classes-list");
    if (!classes.length) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center p-12 text-center">
                <div class="bg-gray-100 p-4 rounded-full mb-4"><i data-lucide="layers" class="w-8 h-8 text-gray-400"></i></div>
                <h3 class="text-lg font-bold text-gray-900">Aucune classe pour le moment</h3>
                <p class="text-gray-500 mb-6 max-w-sm">Commencez par créer votre première classe pour gérer vos élèves.</p>
                <button onclick="openCreateModal()" class="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Créer une Classe</button>
            </div>`;
        return;
    }

    container.innerHTML = classes.map(c => {
        const count = enrollments.filter(e => e.courseId === c.id && e.status === 'active').length;
        const resourcesCount = (c.resources || []).length;

        return `
        <div class="premium-card p-6 rounded-3xl group relative bg-white border border-gray-100/50 hover:border-blue-200 transaction-all duration-300">
            <div class="absolute top-4 right-4 flex gap-1">
                <button onclick="editClass('${c.id}')" class="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Modifier">
                    <i data-lucide="edit-2" class="w-5 h-5"></i>
                </button>
                <button onclick="deleteClass('${c.id}')" class="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
            
            <div class="flex items-start justify-between mb-4">
                <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wider border border-blue-100">
                    ${c.category || 'Général'}
                </span>
            </div>

            <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">${c.title}</h3>
            <p class="text-sm text-gray-500 mb-6 line-clamp-2">${c.description || 'Aucune description'}</p>

            <div class="flex items-center gap-4 mb-6">
                 <div class="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <i data-lucide="users" class="w-4 h-4 text-gray-400"></i> ${count} Élèves
                </div>
                <div class="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <i data-lucide="folder" class="w-4 h-4 text-gray-400"></i> ${resourcesCount} Ressources
                </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-gray-50">
                <div class="font-bold text-lg text-gray-900">${c.price} <span class="text-sm text-gray-500 font-normal">TND</span></div>
                <button onclick="manageResources('${c.id}')" class="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200">
                    Gérer
                </button>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

function renderRequestsList(classes, enrollments, users) {
    const container = document.getElementById("requests-list");
    const classIds = classes.map(c => c.id);
    const pending = enrollments.filter(e => classIds.includes(e.courseId) && e.status === 'pending');

    // Update Badge
    const badge = document.querySelector("#tab-requests span");
    if (pending.length > 0) {
        badge.textContent = pending.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    if (!pending.length) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">Aucune demande en attente.</div>`;
        return;
    }

    container.innerHTML = pending.map(req => {
        const student = users.find(u => u.id === req.studentId) || { name: 'Inconnu', email: 'N/A' };
        const course = classes.find(c => c.id === req.courseId);
        const hasReceipt = req.receipt && req.receipt.length > 0;

        return `
        <div class="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100">
                    ${student.name.charAt(0)}
                </div>
                <div>
                    <h4 class="font-bold text-gray-900">${student.name}</h4>
                    <div class="text-sm text-gray-500 flex items-center gap-2">
                        <span>${course ? course.title : 'Classe Inconnue'}</span>
                        <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>${new Date(req.requestDate).toLocaleDateString()}</span>
                    </div>
                    ${hasReceipt ? `
                        <button onclick="viewReceipt('${req.id}')" class="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            <i data-lucide="file-text" class="w-3 h-3"></i> Voir le reçu
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="rejectRequest('${req.id}')" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Refuser</button>
                <button onclick="acceptRequest('${req.id}')" class="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">Accepter</button>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

function renderPaymentsList(classes, enrollments, users) {
    const container = document.getElementById("payments-list");
    const classIds = classes.map(c => c.id);
    const activeEnrollments = enrollments.filter(e => classIds.includes(e.courseId) && e.status === 'active');

    if (!activeEnrollments.length) {
        container.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500">Aucun étudiant actif.</td></tr>`;
        return;
    }

    container.innerHTML = activeEnrollments.map(enr => {
        const student = users.find(u => u.id === enr.studentId) || { name: 'Inconnu', email: 'N/A' };
        const course = classes.find(c => c.id === enr.courseId) || { title: 'Unknown', price: 0 };
        const paid = enr.amountPaid || 0;
        const remaining = Math.max(0, course.price - paid);
        
        let statusHtml = '';
        if (remaining === 0) statusHtml = `<span class="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">Payé</span>`;
        else if (paid > 0) statusHtml = `<span class="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">Partiel</span>`;
        else statusHtml = `<span class="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">Non Payé</span>`;

        return `
        <tr class="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
            <td class="px-6 py-4">
                <div class="font-bold text-gray-900">${student.name}</div>
                <div class="text-xs text-gray-500">${student.email}</div>
            </td>
            <td class="px-6 py-4 font-medium text-gray-600">${course.title}</td>
            <td class="px-6 py-4 font-bold text-gray-900">${course.price} TND</td>
            <td class="px-6 py-4 font-bold text-green-600">${paid} TND</td>
            <td class="px-6 py-4 font-bold text-red-500">${remaining} TND</td>
            <td class="px-6 py-4">${statusHtml}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="openPaymentModal('${enr.id}', '${student.name}', ${course.price}, ${paid})" class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
    lucide.createIcons();
}


// --- Actions ---

window.viewReceipt = async (enrollmentId) => {
    const enrollments = await dataManager.getAll("enrollments");
    const req = enrollments.find(e => e.id === enrollmentId);
    if (req && req.receipt) {
        // Handle if receipt is array or string
        const url = Array.isArray(req.receipt) ? req.receipt[0] : req.receipt;
        if(url) window.open(url, '_blank');
        else showToast("Lien du reçu invalide", "error");
    } else {
        showToast("Aucun reçu trouvé", "error");
    }
};

window.acceptRequest = async (enrollmentId) => {
    try {
        await dataManager.update("enrollments", enrollmentId, {
            status: 'active',
            joinDate: new Date().toISOString()
        });
        showToast("Demande acceptée !", "success");
        loadClasses();
    } catch (error) {
        console.error("Error accepting request:", error);
        showToast("Erreur lors de l'acceptation", "error");
    }
};

window.rejectRequest = async (enrollmentId) => {
     // Delete or mark rejected
     await dataManager.delete("enrollments", enrollmentId);
     showToast("Demande refusée", "success");
     loadClasses();
};


// --- Wizard ---

window.openCreateModal = () => {
    isEditing = false;
    document.getElementById("create-modal").classList.remove("hidden");
    const titleEl = document.getElementById("modal-title");
    if(titleEl) titleEl.textContent = "Nouvelle Classe";
    resetWizard();
};

window.editClass = async (id) => {
    isEditing = true;
    editingId = id;
    
    const allCourses = await dataManager.getAll("courses");
    const course = allCourses.find(c => c.id === id);
    if(!course) return;

    document.getElementById("create-modal").classList.remove("hidden");
    
    // Set Title
    const titleEl = document.getElementById("modal-title");
    if(titleEl) titleEl.textContent = `Gérer la Classe: ${course.title}`;

    // Fill basic
    document.getElementById("w-name").value = course.title;
    document.getElementById("w-desc").value = course.description || "";
    document.getElementById("w-meet-link").value = course.meetLink || "";
    document.getElementById("w-drive-folder").value = course.recordingsFolderUrl || course.recordingsFolder || "";
    
    // Fill Pricing
    if(course.pricing) {
        document.getElementById("w-price-type").value = course.pricing.type || "monthly";
        document.getElementById("w-price").value = course.pricing.price || 0;
        updatePriceLabel(course.pricing.type);
    } else {
        document.getElementById("w-price").value = course.price || 0;
    }
    
    // Fill Dynamic Filters
    const catSelect = document.getElementById("w-cat");
    if(catSelect) {
        catSelect.value = course.category || "";
        
        // Trigger generic change logic or manually update
        if(window.dynamicFilters && course.category) {
            window.dynamicFilters.updateSubjects(course.category);
            window.dynamicFilters.updateLevels(course.category);
            
            // Set Subject & Level after update
            setTimeout(() => {
                const subSelect = document.getElementById("w-subject");
                const lvlSelect = document.getElementById("w-lvl");
                
                if(course.subject && subSelect) subSelect.value = course.subject;
                if(course.level && lvlSelect) lvlSelect.value = course.level;
            }, 50);
        }
    }
    
    // Fill Arrays - Use Deep Copy to prevent reference issues
    tempResources = course.resources ? JSON.parse(JSON.stringify(course.resources)) : [];
    tempSchedule = course.schedule ? JSON.parse(JSON.stringify(course.schedule)) : [];
    tempInvites = (course.students && course.students.invited) ? [...course.students.invited] : [];
    tempFolders = course.folders ? JSON.parse(JSON.stringify(course.folders)) : [];
    
    renderTempFoldersSelect();
    renderTempResources();
    renderTempSchedule();
    renderTempInvites();
};

window.closeModal = () => {
    document.getElementById("create-modal").classList.add("hidden");
};

function resetWizard() {
    // Only reset if we are NOT in editing mode or if explicitly requested
    // This prevents accidental clearing if openCreateModal is called redundantly
    if(isEditing && editingId) return;

    document.getElementById("w-name").value = "";
    document.getElementById("w-desc").value = "";
    document.getElementById("w-meet-link").value = "";
    document.getElementById("w-drive-folder").value = "";
    document.getElementById("w-price").value = "";
    document.getElementById("w-price-type").value = "monthly";
    updatePriceLabel("monthly");
    
    const catSelect = document.getElementById("w-cat");
    if(catSelect) {
        catSelect.value = "";
        if(window.dynamicFilters) {
             window.dynamicFilters.updateSubjects("");
             window.dynamicFilters.updateLevels("");
        }
    }

    tempResources = [];
    tempFolders = [];
    tempSchedule = [];
    tempInvites = [];
    
    renderTempFoldersSelect();
    renderTempResources();
    renderTempSchedule();
    renderTempInvites();
}

// --- New Features Logic ---

window.updatePriceLabel = (type) => {
    const lbl = document.getElementById('lbl-price');
    if(type === 'monthly') lbl.textContent = "Prix Mensuel (TND)";
    else if(type === 'hourly') lbl.textContent = "Prix Par Heure (TND)";
    else lbl.textContent = "Prix Global (TND)";
};

// Schedule Logic
window.addSession = () => {
    console.log("addSession clicked");
    const day = document.getElementById('sch-day').value;
    const start = document.getElementById('sch-start').value;
    const end = document.getElementById('sch-end').value;
    
    if(!day || !start || !end) {
        alert("Veuillez remplir jour et horaires");
        return;
    }
    
    tempSchedule.push({ day, startTime: start, endTime: end });
    renderTempSchedule();
    
    // Reset times but keep day for easier multi-entry
    document.getElementById('sch-start').value = '';
    document.getElementById('sch-end').value = '';
};

window.removeSession = (index) => {
    tempSchedule.splice(index, 1);
    renderTempSchedule();
};

function renderTempSchedule() {
    const el = document.getElementById('schedule-list');
    if(!el) return;
    
    if(tempSchedule.length === 0) {
        el.innerHTML = '<div class="text-sm text-gray-400 italic">Aucune séance planifiée.</div>';
        return;
    }
    
    el.innerHTML = tempSchedule.map((s, i) => `
        <div class="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-100 text-sm animate-enter">
            <div>
                <span class="font-bold text-orange-800 uppercase text-xs w-20 inline-block">${s.day}</span>
                <span class="text-gray-700 font-mono">${s.startTime} - ${s.endTime}</span>
            </div>
            <button onclick="removeSession(${i})" class="text-gray-400 hover:text-red-500"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

// Invite Logic
window.addInvite = () => {
    const email = document.getElementById('inv-email').value;
    if(!email || !email.includes('@')) {
        alert("Email invalide");
        return;
    }
    if(tempInvites.includes(email)) {
        alert("Déjà ajouté");
        return;
    }
    
    tempInvites.push(email); // In real app, we might search userID here
    document.getElementById('inv-email').value = '';
    renderTempInvites();
};

window.removeInvite = (email) => {
    tempInvites = tempInvites.filter(e => e !== email);
    renderTempInvites();
};

function renderTempInvites() {
    const el = document.getElementById('invites-list');
    if(!el) return;
    
    el.innerHTML = tempInvites.map(email => `
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-xs font-bold animate-enter">
            <i data-lucide="mail" class="w-3 h-3"></i>
            ${email}
            <button onclick="removeInvite('${email}')" class="hover:text-red-500"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}


// --- Resource Management ---

// --- Folder Management ---

window.addFolder = () => {
    const name = document.getElementById('fol-name').value;
    if(!name) return;
    
    const newFolder = { id: Date.now().toString(), name: name };
    tempFolders.push(newFolder);
    document.getElementById('fol-name').value = '';
    
    renderTempFoldersSelect();
    renderTempResources(); // Re-render to show empty folder (optional) or just to update UI
};

window.renderTempFoldersSelect = () => {
    const select = document.getElementById('res-folder');
    if(!select) return;
    
    // Keep first option (Root)
    const rootOpt = select.options[0];
    select.innerHTML = '';
    select.appendChild(rootOpt);
    
    tempFolders.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        select.appendChild(opt);
    });
};

window.addResource = () => {
    const type = document.getElementById('res-type').value;
    const title = document.getElementById('res-title').value;
    const link = document.getElementById('res-link').value;
    const folderId = document.getElementById('res-folder').value || null; // New: Folder ID
    
    if(!title || !link) {
        alert("Veuillez remplir le titre et le lien");
        return;
    }

    tempResources.push({ 
        id: Date.now(), 
        type, 
        title, 
        link,
        folderId // Save folder
    });

    document.getElementById('res-title').value = '';
    document.getElementById('res-link').value = '';
    
    renderTempResources();
};

window.removeResource = (id) => {
    tempResources = tempResources.filter(r => r.id != id);
    renderTempResources();
};

window.removeFolder = (id) => {
    if(confirm("Supprimer ce dossier et son contenu ?")) {
        tempFolders = tempFolders.filter(f => f.id !== id);
        // Move resources from this folder to root or delete them? Usually delete or move to root.
        // Let's move them to root (folderId = null) for safety
        tempResources.forEach(r => {
             if(r.folderId === id) r.folderId = null; 
        });
        
        renderTempFoldersSelect();
        renderTempResources();
    }
};

function renderTempResources() {
    const el = document.getElementById('resources-list');
    if(!el) return;
    
    el.innerHTML = '';

    // Render Folders First
    tempFolders.forEach(folder => {
        const folderResources = tempResources.filter(r => r.folderId === folder.id);
        
        el.innerHTML += `
        <div class="border border-gray-200 rounded-xl overflow-hidden mb-2">
            <div class="bg-gray-50 p-3 flex items-center justify-between border-b border-gray-100">
                <div class="flex items-center gap-2 font-bold text-gray-700">
                    <i data-lucide="folder" class="w-4 h-4 text-blue-500"></i> ${folder.name}
                    <span class="text-xs text-gray-400 font-normal">(${folderResources.length} éléments)</span>
                </div>
                <button onclick="removeFolder('${folder.id}')" class="text-xs text-red-400 hover:text-red-600">Supprimer</button>
            </div>
            <div class="p-2 space-y-2 bg-white">
                ${folderResources.length === 0 ? '<div class="text-xs text-gray-400 italic px-2">Dossier vide</div>' : 
                  folderResources.map(r => renderResourceItem(r)).join('')}
            </div>
        </div>`;
    });

    // Render Root Resources (No folder)
    const rootResources = tempResources.filter(r => !r.folderId);
    if(rootResources.length > 0) {
        el.innerHTML += `
        <div class="p-2 space-y-2">
             <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fichiers à la racine</div>
             ${rootResources.map(r => renderResourceItem(r)).join('')}
        </div>`;
    }
    
    if(tempFolders.length === 0 && rootResources.length === 0) {
         el.innerHTML = '<div class="text-center py-4 text-gray-400 text-sm">Aucune ressource ajoutée</div>';
    }

    lucide.createIcons();
}

function renderResourceItem(r) {
    return `
        <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm group">
            <div class="flex items-center gap-3">
                <div class="p-1.5 ${r.type === 'drive' ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-red-600'} rounded-lg">
                    <i data-lucide="${r.type === 'drive' ? 'video' : 'file-text'}" class="w-4 h-4"></i>
                </div>
                <div>
                     <div class="text-sm font-bold text-gray-900">${r.title}</div>
                     <div class="text-xs text-gray-400 flex items-center gap-1">
                        ${r.link.substring(0, 25)}...
                     </div>
                </div>
            </div>
            <button onclick="removeResource(${r.id})" class="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded transition-colors">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
}

window.deleteClass = async (id) => {
    if(confirm("Êtes-vous sûr de vouloir supprimer cette classe ? Cette action est irréversible.")) {
        try {
            // Also optional: Delete image from storage if exists, but we skip for now
            await dataManager.delete("courses", id);
            
            // Cleanup related enrollments locally if needed (backend usually handles cascade)
            // But since this is JSON DB, we might want to manually clean up enrollments?
            // For now, let's just delete the course.
            
            showToast("Classe supprimée avec succès", "success");
            loadClasses();
        } catch (e) {
            console.error(e);
            showToast("Erreur lors de la suppression", "error");
        }
    }
};

window.finishCreate = async () => {
    // Basic Info
    const title = document.getElementById("w-name").value;
    const description = document.getElementById("w-desc").value;
    const category = document.getElementById("w-cat").value;
    const subject = document.getElementById("w-subject").value;
    const level = document.getElementById("w-lvl").value;
    
    // Meet Link
    const meetLink = document.getElementById("w-meet-link").value;
    const recordingsFolderUrl = document.getElementById("w-drive-folder").value;
    
    // Pricing Object
    const priceType = document.getElementById("w-price-type").value;
    const priceVal = parseFloat(document.getElementById("w-price").value) || 0;
    const pricing = {
        type: priceType,
        price: priceVal,
        currency: 'TND'
    };
    
    // Schedule
    // tempSchedule is already accurate from UI state

    // Students Object
    const students = {
        enrolled: isEditing ? (await getExistingEnrolled(editingId)) : [],
        invited: [...tempInvites] // Use spread to avoid reference issues
    };
    
    if(!title) { alert("Titre requis"); return; }
    if(!category) { alert("Catégorie requise"); return; }

    const newClass = {
        id: isEditing ? editingId : dataManager.generateId(),
        instructorId: dataManager.getCurrentUser().id,
        type: 'class',
        title: title,
        description: description,
        name: title,
        category,
        subject,
        level,
        subject,
        level,
        meetLink,
        recordingsFolderUrl,
        pricing,
        price: priceVal, // Legacy support for grids showing flat price
        schedule: tempSchedule,
        students: students,
        resources: [...tempResources],
        folders: [...tempFolders],
        updatedAt: new Date().toISOString()
    };

    if(!isEditing) {
        newClass.createdAt = new Date().toISOString();
        await dataManager.create("courses", newClass);
    } else {
        // Fix: Pass ID as second argument to update
        let existing = (await dataManager.getAll("courses")).find(c => c.id === editingId) || {};
        const updated = { ...existing, ...newClass };
        await dataManager.update("courses", editingId, updated);
    }
    
    closeModal();
    alert(isEditing ? "Classe mise à jour !" : "Classe créée avec succès !");
    loadClasses();
};

async function getExistingEnrolled(classId) {
    const all = await dataManager.getAll("courses");
    const existing = all.find(c => c.id === classId);
    return (existing && existing.students) ? existing.students.enrolled : [];
}

// Utils
function showToast(msg, type='success') {
    // Simple alert for now, can be upgraded
    alert(msg); 
}

// Exports
window.switchTab = (tab) => {
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'border-blue-600', 'text-blue-600');
        b.classList.add('border-transparent', 'text-gray-500');
    });
    document.getElementById(`tab-${tab}`).classList.add('active', 'border-blue-600', 'text-blue-600');
    document.getElementById(`tab-${tab}`).classList.remove('border-transparent', 'text-gray-500');
    
    document.querySelector('.tab-content:not(.hidden)').classList.add('hidden');
    document.getElementById(`content-${tab}`).classList.remove('hidden');
};

window.manageResources = (id) => {
    // Redirect to the new Full Page Dashboard
    window.location.href = `class-dashboard.html?id=${id}`;
};
