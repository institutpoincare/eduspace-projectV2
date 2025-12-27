
// instructor-classes.js - Gestion Complète des Classes

let currentTab = 'classes';
let isEditing = false;
let editingId = null;
let wizStep = 1;

// Temporary Data for Wizard
let tempSlots = [];
let tempResources = []; // New: For Drive/PDFs
let tempStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (window.dataManager) await dataManager.init();
    lucide.createIcons();
    loadClasses();
    setupWizard();
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
            <div class="absolute top-4 right-4">
                <button onclick="editClass('${c.id}')" class="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                    <i data-lucide="more-vertical" class="w-5 h-5"></i>
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
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="rejectRequest('${req.id}')" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Refuser</button>
                <button onclick="acceptRequest('${req.id}')" class="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">Accepter</button>
            </div>
        </div>`;
    }).join('');
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

window.acceptRequest = async (enrollmentId) => {
    // In a real DB, update status. Here we simulate edit.
    // Ideally update 'enrollments'
    const enrollments = await dataManager.getAll("enrollments");
    const idx = enrollments.findIndex(e => e.id === enrollmentId);
    if (idx !== -1) {
        enrollments[idx].status = 'active';
        enrollments[idx].joinDate = new Date().toISOString();
        await dataManager.saveAll("enrollments", enrollments);
        showToast("Demande acceptée !", "success");
        loadClasses();
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
    resetWizard();
};

window.closeModal = () => {
    document.getElementById("create-modal").classList.add("hidden");
};

function resetWizard() {
    document.getElementById("w-name").value = "";
    document.getElementById("w-price").value = "";
    tempResources = [];
    renderTempResources();
}

// --- Resource Management ---

window.addResource = () => {
    const type = document.getElementById('res-type').value;
    const title = document.getElementById('res-title').value;
    const link = document.getElementById('res-link').value;
    
    if(!title || !link) {
        // Use a simple alert or toast if available
        alert("Veuillez remplir le titre et le lien");
        return;
    }

    tempResources.push({ 
        id: Date.now(), 
        type, 
        title, 
        link 
    });

    // Reset inputs
    document.getElementById('res-title').value = '';
    document.getElementById('res-link').value = '';
    
    renderTempResources();
};

window.removeResource = (id) => {
    tempResources = tempResources.filter(r => r.id != id);
    renderTempResources();
};

function renderTempResources() {
    const el = document.getElementById('resources-list');
    if(!el) return;
    
    if(tempResources.length === 0) {
        el.innerHTML = '<div class="text-center py-4 text-gray-400 text-sm">Aucune ressource ajoutée</div>';
        return;
    }

    el.innerHTML = tempResources.map(r => `
        <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm animate-enter">
            <div class="flex items-center gap-3">
                <div class="p-2 ${r.type === 'drive' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'} rounded-lg border border-gray-100">
                    <i data-lucide="${r.type === 'drive' ? 'video' : 'file-text'}" class="w-4 h-4"></i>
                </div>
                <div>
                    <div class="text-sm font-bold text-gray-900">${r.title}</div>
                    <div class="text-xs text-gray-400 flex items-center gap-1">
                        <i data-lucide="link" class="w-3 h-3"></i> ${r.link.substring(0, 30)}...
                    </div>
                </div>
            </div>
            <button onclick="removeResource(${r.id})" class="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

window.finishCreate = async () => {
    const title = document.getElementById("w-name").value;
    const category = document.getElementById("w-category").value;
    const price = parseFloat(document.getElementById("w-price").value) || 0;
    
    if(!title) { alert("Titre requis"); return; }

    // Ensure resources are saved correctly
    const resourcesToSave = [...tempResources];

    const newClass = {
        id: isEditing ? editingId : dataManager.generateId(),
        instructorId: dataManager.getCurrentUser().id,
        type: 'class',
        title: title, // Handle both 'title' and 'name' for compatibility
        name: title,
        category,
        price,
        resources: resourcesToSave,
        updatedAt: new Date().toISOString()
    };

    if(!isEditing) {
        newClass.createdAt = new Date().toISOString();
        await dataManager.add("courses", newClass);
    } else {
        // Merge with existing to keep other fields if any
        let existing = (await dataManager.getAll("courses")).find(c => c.id === editingId) || {};
        const updated = { ...existing, ...newClass };
        await dataManager.update("courses", updated);
    }
    
    closeModal();
    // Assuming showToast is defined or use alert
    alert(isEditing ? "Classe mise à jour !" : "Classe créée avec succès !");
    loadClasses();
};

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
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`content-${tab}`).classList.remove('hidden');
};
