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
}

const instructorPayments = new InstructorPayments();
document.addEventListener('DOMContentLoaded', () => instructorPayments.init());
