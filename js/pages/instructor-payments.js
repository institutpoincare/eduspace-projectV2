/**
 * Instructor Payments - Gestion Dynamique des Revenus et Transactions
 */

class InstructorPayments {
    constructor() {
        this.currentInstructor = null;
        this.transactions = [];
    }

    async init() {
        console.log('💰 Initialisation des Paiements Formateur');
        await dataManager.init();

        // Get current user from session
        const user = sessionStorage.getItem('user');
        if (user) {
            this.currentInstructor = JSON.parse(user);
        } else {
            window.location.href = '../../pages/login-formateur.html';
            return;
        }

        if (this.currentInstructor.role !== 'formateur') {
            console.error('❌ L\'utilisateur n\'est pas un formateur');
            window.location.href = '../../pages/login-formateur.html';
            return;
        }

        console.log('👤 Formateur connecté:', this.currentInstructor.name, 'ID:', this.currentInstructor.id);

        this.updateHeader();
        await this.loadPaymentData();
        this.loadBankDetails();
    }

    updateHeader() {
        const userName = this.currentInstructor.name || 'Formateur';
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

        const initialsElement = document.querySelector('.h-full.w-full.rounded-full.bg-white.flex.items-center.justify-center');
        if (initialsElement) initialsElement.textContent = initials;
    }

    async loadPaymentData() {
        try {
            // Load real payments from database
            const allPayments = await dataManager.getAll('payments');
            
            // Filter payments for this instructor
            this.transactions = allPayments.filter(p => p.instructorId === this.currentInstructor.id);
            
            console.log('💳 Paiements chargés:', this.transactions.length);

            // Calculate real totals
            const totalRevenue = this.transactions
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const pendingAmount = this.transactions
                .filter(p => p.status === 'pending')
                .reduce((sum, p) => sum + (p.amount || 0), 0);

            this.updateStats(totalRevenue, pendingAmount);
            this.renderTransactions(this.transactions);
            this.loadAccessRequests(); // New function call
        } catch (error) {
            console.error('❌ Erreur chargement données paiements:', error);
            this.updateStats(0, 0);
            this.renderTransactions([]);
        }
    }

    updateStats(total, pending) {
        const totalElement = document.querySelector('.gradient-card-1 h2');
        if (totalElement) {
            totalElement.innerHTML = `${total.toLocaleString()} <span class="text-2xl font-normal opacity-80">TND</span>`;
        }

        const pendingElement = document.querySelector('.gradient-card-2 h2');
        if (pendingElement) {
            pendingElement.innerHTML = `${pending.toLocaleString()} <span class="text-2xl font-normal opacity-80">TND</span>`;
        }

        // Update course count
        const courseCountElement = document.querySelector('.gradient-card-1 p');
        if (courseCountElement) {
            const paidCount = this.transactions.filter(p => p.status === 'paid').length;
            courseCountElement.textContent = `${paidCount} cours payés`;
        }
    }

    renderTransactions(payments) {
        const tbody = document.querySelector('table tbody');
        if (!tbody) return;

        if (payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-12 text-center">
                        <div class="flex flex-col items-center gap-3">
                            <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                <i data-lucide="wallet" class="w-8 h-8 text-slate-400"></i>
                            </div>
                            <p class="text-slate-500 font-medium">Aucune transaction trouvée</p>
                            <p class="text-sm text-slate-400">Les paiements apparaîtront ici une fois effectués</p>
                        </div>
                    </td>
                </tr>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = '';
        
        // Sort by date (newest first)
        const sortedPayments = [...payments].sort((a, b) => 
            new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );

        sortedPayments.forEach(payment => {
            const tr = document.createElement('tr');
            tr.className = 'group hover:bg-slate-50 transition-colors';
            
            const date = new Date(payment.createdAt || payment.date);
            const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
            
            const statusConfig = {
                'paid': { label: 'Payé', color: 'emerald', icon: 'check-circle' },
                'pending': { label: 'En attente', color: 'orange', icon: 'clock' },
                'failed': { label: 'Retard', color: 'red', icon: 'x-circle' }
            };
            
            const status = statusConfig[payment.status] || statusConfig['pending'];
            
            tr.innerHTML = `
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            ${(payment.courseName || payment.description || 'P').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">${payment.courseName || payment.description || 'Paiement'}</p>
                            <p class="text-xs text-slate-400">${payment.studentName || payment.method || '-'}</p>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6 text-sm text-slate-500">${dateStr}</td>
                <td class="py-4 px-6 text-sm font-bold ${payment.status === 'paid' ? 'text-emerald-600' : 'text-slate-600'}">
                    ${payment.status === 'paid' ? '+' : ''}${payment.amount.toLocaleString()} TND
                </td>
                <td class="py-4 px-6 text-sm text-slate-500">${payment.method || '-'}</td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-${status.color}-100 text-${status.color}-700">
                        <i data-lucide="${status.icon}" class="w-3 h-3"></i> ${status.label}
                    </span>
                </td>
                <td class="py-4 px-6 text-right">
                    ${payment.status === 'paid' ? `
                        <button class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Télécharger la facture">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </button>
                    ` : payment.status === 'pending' ? `
                        <button class="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                            Payer
                        </button>
                    ` : `
                        <button class="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">
                            Régulariser
                        </button>
                    `}
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async loadAccessRequests() {
        const container = document.getElementById('requests-container');
        const list = document.getElementById('access-requests-list');
        const countBadge = document.getElementById('requests-count');
        
        if (!container || !list) return;

        // Fetch All Enrollments
        const allEnrollments = await dataManager.getAll('enrollments');
        // Filter: Pending + Transfer + Current Instructor's Course
        // Need to get courses first to match instructorId
        const allCourses = await dataManager.getAll('courses');
        const myCourseIds = allCourses.filter(c => c.instructorId === this.currentInstructor.id).map(c => c.id);

        const requests = allEnrollments.filter(e => 
            e.status === 'pending' && 
            e.paymentMethod === 'transfer' && 
            myCourseIds.includes(e.courseId)
        );

        if (requests.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        countBadge.textContent = `${requests.length} en attente`;

        // We need students names
        const allUsers = await dataManager.getAll('users');

        list.innerHTML = requests.map(req => {
            const student = allUsers.find(u => u.id === req.studentId) || { name: 'Inconnu' };
            const course = allCourses.find(c => c.id === req.courseId) || { title: 'Cours Inconnu' };
            const date = new Date(req.requestDate).toLocaleDateString();

            return `
            <tr class="hover:bg-amber-50/50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            ${student.name.charAt(0)}
                        </div>
                        <div>
                            <p class="font-bold text-gray-900">${student.name}</p>
                            <p class="text-xs text-gray-500">Étudiant</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm font-medium text-gray-700">${course.title}</p>
                    <p class="text-xs text-gray-500">Virement Bancaire</p>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    <div class="flex items-center gap-1 cursor-pointer text-indigo-600 hover:text-indigo-800 hover:underline" onclick="instructorPayments.viewReceipt('${req.receipt}')">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                        Voir le reçu
                    </div>
                </td>
                <td class="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button onclick="instructorPayments.rejectAccess('${req.id}')" class="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                        Refuser
                    </button>
                    <button onclick="instructorPayments.approveAccess('${req.id}')" class="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all">
                        Valider l'accès
                    </button>
                </td>
            </tr>
            `;
        }).join('');
        
        lucide.createIcons();
    }

    async approveAccess(enrollmentId) {
        if (!confirm("Confirmer la réception du paiement et débloquer l'accès ?")) return;

        try {
            // Get the enrollment to check amountPaid/studentId
            const enrollment = await dataManager.getById('enrollments', enrollmentId);
            
            if (enrollment) {
                // Update Enrollment Status
                await dataManager.update('enrollments', enrollmentId, {
                    status: 'active',
                    activatedAt: new Date().toISOString()
                });
                
                // Create Payment Record
                const payment = {
                    id: dataManager.generateId ? dataManager.generateId() : crypto.randomUUID(), // Fallback if generateId missing
                    instructorId: this.currentInstructor.id,
                    amount: enrollment.amountPaid || 0, // Should be updated properly from course price if 0
                    status: 'paid',
                    date: new Date().toISOString(),
                    method: 'Virement',
                    description: 'Achat Cours (Validé)',
                    studentId: enrollment.studentId
                };
                
                // Use create() not add()
                await dataManager.create('payments', payment);
                
                this.init(); // Reload
                alert("Accès validé avec succès !");
            }
        } catch (error) {
            console.error("Erreur validation:", error);
            alert("Erreur lors de la validation: " + error.message);
        }
    }

    async rejectAccess(enrollmentId) {
        if (!confirm("Refuser cette demande ?")) return;
        await dataManager.delete('enrollments', enrollmentId);
        this.init();
    }
    async loadBankDetails() {
        if (this.currentInstructor.bankDetails) {
            const { bankName, rib, beneficiaryName } = this.currentInstructor.bankDetails;
            
            // Update UI Card
            const cardTitle = document.querySelector('.bg-white.rounded-2xl.p-6 .font-bold.text-slate-800');
            const cardSub = document.querySelector('.bg-white.rounded-2xl.p-6 .text-sm.text-slate-500');
            
            if (cardTitle) cardTitle.textContent = bankName || 'Virement Bancaire';
            if (cardSub) cardSub.textContent = (rib ? `RIB: ${rib}` : 'Non configuré');
        }
    }

    openBankModal() {
        const modal = document.getElementById('bank-config-modal');
        if (!modal) return;
        
        // Pre-fill
        if (this.currentInstructor.bankDetails) {
            document.getElementById('config-bank-name').value = this.currentInstructor.bankDetails.bankName || '';
            document.getElementById('config-bank-rib').value = this.currentInstructor.bankDetails.rib || '';
            document.getElementById('config-bank-beneficiary').value = this.currentInstructor.bankDetails.beneficiaryName || '';
        }

        modal.classList.remove('hidden');
    }

    closeBankModal() {
        document.getElementById('bank-config-modal').classList.add('hidden');
    }

    async saveBankDetails() {
        console.log("💾 Tentative de sauvegarde...");
        try {
            const bankName = document.getElementById('config-bank-name').value;
            const rib = document.getElementById('config-bank-rib').value;
            const beneficiaryName = document.getElementById('config-bank-beneficiary').value;

            console.log("Valeurs:", { bankName, rib, beneficiaryName });

            if (!bankName || !rib || !beneficiaryName) {
                alert("Attention: Veuillez remplir tous les champs (Banque, RIB, Bénéficiaire).");
                return;
            }

            // Update local object
            this.currentInstructor.bankDetails = { bankName, rib, beneficiaryName };
            
            // Update Database (PUT request)
            console.log("Mise à jour de l'utilisateur...", this.currentInstructor.id);
            
            // We use update() which handles the API call
            await dataManager.update('users', this.currentInstructor.id, { 
                bankDetails: this.currentInstructor.bankDetails 
            });
            
            // Update Session
            sessionStorage.setItem('user', JSON.stringify(this.currentInstructor));
            
            this.loadBankDetails();
            
            // Show Animation
            document.getElementById('bank-config-form').classList.add('hidden');
            document.getElementById('bank-config-success').classList.remove('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons();

            // Wait and Close
            setTimeout(() => {
                this.closeBankModal();
                // Reset for next time
                setTimeout(() => {
                    document.getElementById('bank-config-form').classList.remove('hidden');
                    document.getElementById('bank-config-success').classList.add('hidden');
                }, 300);
            }, 1500);
            // alert("✅ Coordonnées bancaires enregistrées avec succès !"); // REMOVED

        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
            alert("Une erreur est survenue lors de la sauvegarde: " + error.message);
        }
    }

    viewReceipt(receiptUrl) {
        const modal = document.getElementById('receipt-modal');
        const img = document.getElementById('receipt-image');
        const error = document.getElementById('receipt-error');
        const downloadBtn = document.getElementById('receipt-download');
        
        if (!modal || !img) return;

        // Reset state
        img.classList.remove('hidden');
        error.classList.add('hidden');

        let src = receiptUrl;
        
        // Handle placeholders only if explicitly the old dummy or empty
        if (!src || src === 'recu_virement_simule.jpg') {
             src = 'https://placehold.co/600x800/e2e8f0/475569?text=Reçu+Simulé'; 
        }
        // If it sends large Base64, it might fail in some console logs but works in src

        img.src = src;
        img.onerror = () => {
            console.warn("Erreur chargement image:", src.substring(0, 50) + "...");
            img.classList.add('hidden');
            error.classList.remove('hidden');
        };

        // For base64, download works better with a filename
        downloadBtn.href = src;
        if (src.startsWith('data:')) {
            downloadBtn.download = 'recu-paiement.png';
        } else {
            downloadBtn.removeAttribute('download'); // Let browser decide
        }
        
        modal.classList.remove('hidden');
    }

    closeReceiptModal() {
        document.getElementById('receipt-modal').classList.add('hidden');
    }
}

const instructorPayments = new InstructorPayments();
window.instructorPayments = instructorPayments;
document.addEventListener('DOMContentLoaded', () => instructorPayments.init());
