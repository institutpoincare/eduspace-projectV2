/**
 * Instructor Classes - Dynamic Statistics & Data Management
 * Handles all dynamic calculations for class management dashboard
 */

class DynamicClassStats {
    constructor() {
        this.classes = [];
        this.allEnrollments = [];
        this.currentUser = null;
    }

    async init() {
        console.log('📊 Initializing Dynamic Class Statistics');
        await dataManager.init();
        this.currentUser = dataManager.getCurrentUser();
        
        if (!this.currentUser || this.currentUser.role !== 'formateur') {
            window.location.href = '../login.html';
            return;
        }

        await this.loadAndCalculate();
    }

    async loadAndCalculate() {
        try {
            // Load all courses for this instructor
            const allCourses = await dataManager.getAll('courses');
            this.classes = allCourses.filter(c => c.instructorId === this.currentUser.id);
            
            // Build enrollments array from studentIds in each class
            this.allEnrollments = [];
            this.classes.forEach(c => {
                if (c.studentIds && Array.isArray(c.studentIds)) {
                    c.studentIds.forEach(s => {
                        this.allEnrollments.push({
                            ...s,
                            classId: c.id,
                            className: c.name || c.title,
                            classPrice: c.price,
                            enrolledAt: s.enrolledAt || c.createdAt || new Date().toISOString()
                        });
                    });
                }
            });

            this.updateAllStats();
        } catch (error) {
            console.error('❌ Error loading class data:', error);
        }
    }

    updateAllStats() {
        this.updateClassStats();
        this.updateEnrollmentStats();
        this.updateRevenueStats();
        this.updatePaymentStats();
    }

    updateClassStats() {
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        const totalClasses = this.classes.length;
        const classesThisMonth = this.classes.filter(c => {
            const createdDate = c.createdAt ? new Date(c.createdAt) : new Date(0);
            return createdDate >= oneMonthAgo;
        }).length;

        // Update DOM
        const totalEl = document.getElementById('stat-total-classes');
        const trendEl = document.getElementById('stat-classes-trend');
        
        if (totalEl) totalEl.textContent = totalClasses;
        if (trendEl) {
            trendEl.textContent = `+${classesThisMonth} ce mois`;
            trendEl.className = classesThisMonth > 0 
                ? 'text-xs mt-2 font-medium text-green-600' 
                : 'text-xs mt-2 font-medium text-gray-400';
        }

        console.log(`📚 Total Classes: ${totalClasses} (+${classesThisMonth} ce mois)`);
    }

    updateEnrollmentStats() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const totalStudents = this.allEnrollments.length;
        const studentsThisWeek = this.allEnrollments.filter(e => {
            const enrollDate = new Date(e.enrolledAt);
            return enrollDate >= oneWeekAgo;
        }).length;

        // Calculate weekly growth percentage
        const weeklyGrowth = totalStudents > 0 
            ? Math.round((studentsThisWeek / totalStudents) * 100) 
            : 0;

        // Update DOM
        const totalEl = document.getElementById('stat-total-students');
        if (totalEl) totalEl.textContent = totalStudents;

        // Find and update the trend element for enrollments (2nd card)
        const cards = document.querySelectorAll('.bg-white.p-5.rounded-2xl.border.border-gray-100');
        if (cards[1]) {
            const trendEl = cards[1].querySelector('p.text-xs.mt-2');
            if (trendEl) {
                if (studentsThisWeek > 0) {
                    trendEl.textContent = `+${studentsThisWeek} cette semaine`;
                    trendEl.className = 'text-xs mt-2 font-medium text-green-600';
                } else {
                    trendEl.textContent = `Aucune inscription récente`;
                    trendEl.className = 'text-xs mt-2 font-medium text-gray-400';
                }
            }
        }

        console.log(`👥 Total Students: ${totalStudents} (+${studentsThisWeek} cette semaine, +${weeklyGrowth}%)`);
    }

    updateRevenueStats() {
        let totalRevenue = 0;
        let totalExpected = 0;

        this.allEnrollments.forEach(enrollment => {
            const price = parseFloat(enrollment.classPrice) || 0;
            const paid = parseFloat(enrollment.amountPaid) || 0;
            totalExpected += price;
            totalRevenue += paid;
        });

        const revenueGoal = 15000; // 15k TND goal
        const goalPercentage = revenueGoal > 0 
            ? Math.round((totalRevenue / revenueGoal) * 100) 
            : 0;

        // Update DOM
        const revenueEl = document.getElementById('stat-revenue');
        if (revenueEl) revenueEl.textContent = totalRevenue + ' TND';

        // Find and update the objective element (3rd card)
        const cards = document.querySelectorAll('.bg-white.p-5.rounded-2xl.border.border-gray-100');
        if (cards[2]) {
            const objEl = cards[2].querySelector('p.text-xs.mt-2');
            if (objEl) {
                objEl.textContent = `Objectif: ${revenueGoal.toLocaleString()} TND (${goalPercentage}%)`;
                objEl.className = goalPercentage >= 50 
                    ? 'text-xs mt-2 font-medium text-green-600' 
                    : 'text-xs mt-2 font-medium text-blue-600';
            }
        }

        console.log(`💰 Revenue: ${totalRevenue} TND / ${totalExpected} TND expected (Goal: ${goalPercentage}% of ${revenueGoal} TND)`);
    }

    updatePaymentStats() {
        let fullyPaidCount = 0;
        let partiallyPaidCount = 0;
        let unpaidCount = 0;
        let totalPaid = 0;
        let totalExpected = 0;

        this.allEnrollments.forEach(enrollment => {
            const price = parseFloat(enrollment.classPrice) || 0;
            const paid = parseFloat(enrollment.amountPaid) || 0;
            
            totalExpected += price;
            totalPaid += paid;

            if (paid >= price && price > 0) {
                fullyPaidCount++;
            } else if (paid > 0) {
                partiallyPaidCount++;
            } else {
                unpaidCount++;
            }
        });

        const totalStudents = this.allEnrollments.length;
        const paymentRate = totalStudents > 0 
            ? Math.round((fullyPaidCount / totalStudents) * 100) 
            : 0;
        const collectionRate = totalExpected > 0 
            ? Math.round((totalPaid / totalExpected) * 100) 
            : 0;

        // Update DOM
        const rateEl = document.getElementById('stat-payment-rate');
        const statusEl = document.getElementById('stat-payment-status');

        if (rateEl) rateEl.textContent = paymentRate + '%';
        
        if (statusEl) {
            if (totalStudents === 0) {
                statusEl.textContent = 'N/A';
                statusEl.className = 'text-xs mt-2 font-medium text-gray-400';
            } else {
                statusEl.textContent = `${fullyPaidCount} payés / ${totalStudents} (${collectionRate}% collecté)`;
                statusEl.className = 
                    paymentRate >= 80 ? 'text-xs mt-2 font-medium text-green-600' :
                    paymentRate >= 50 ? 'text-xs mt-2 font-medium text-orange-500' :
                    'text-xs mt-2 font-medium text-red-500';
            }
        }

        console.log(`💳 Payment Rate: ${paymentRate}% (${fullyPaidCount} fully paid, ${partiallyPaidCount} partial, ${unpaidCount} unpaid) | Collection: ${collectionRate}%`);
    }

    // Method to refresh stats after data changes
    async refresh() {
        await this.loadAndCalculate();
    }
}

// Create global instance
window.dynamicClassStats = new DynamicClassStats();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await window.dynamicClassStats.init();
});
