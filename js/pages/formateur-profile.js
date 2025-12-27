/**
 * Formateur Profile Management - إدارة الملف الشخصي للمدرس
 * Handles all profile operations dynamically including CV sections
 */

class FormateurProfile {
    constructor() {
        this.currentUser = null;
        this.profileImage = null;
        this.cvFile = null;
        this.workExperiences = [];
        this.education = [];
        this.certifications = [];
        this.teachingExperiences = [];
    }

    async init() {
        console.log('👤 تهيئة صفحة الملف الشخصي...');
        await dataManager.init();

        this.currentUser = dataManager.getCurrentUser();
        if (!this.currentUser || this.currentUser.role !== 'formateur') {
            window.location.href = '../login.html';
            return;
        }

        await this.loadProfileData();
        await this.loadStatistics();
    }

    async loadProfileData() {
        console.log('📋 تحميل بيانات المدرس:', this.currentUser);

        // تحميل المعلومات الأساسية
        document.getElementById('name').value = this.currentUser.name || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('phone').value = this.currentUser.phone || '';
        document.getElementById('specialite').value = this.currentUser.specialite || '';
        document.getElementById('bio').value = this.currentUser.bio || '';
        document.getElementById('experience').value = this.currentUser.experience || 0;
        document.getElementById('qualification').value = this.currentUser.qualification || '';

        // تحميل الصورة الشخصية
        if (this.currentUser.profileImage) {
            document.getElementById('profile-image-preview').src = this.currentUser.profileImage;
        }

        // تحميل معلومات CV إن وجدت
        if (this.currentUser.cvFile) {
            document.getElementById('current-cv-display').classList.remove('hidden');
            document.getElementById('cv-filename').textContent = this.currentUser.cvFileName || 'CV.pdf';
        }

        // تحميل الأقسام الديناميكية
        this.workExperiences = this.currentUser.workExperiences || [];
        this.education = this.currentUser.education || [];
        this.certifications = this.currentUser.certifications || [];
        this.teachingExperiences = this.currentUser.teachingExperiences || [];

        this.renderWorkExperiences();
        this.renderEducation();
        this.renderCertifications();
        this.renderTeachingExperiences();

        console.log('✅ تم تحميل البيانات بنجاح');
    }

    renderWorkExperiences() {
        const container = document.getElementById('work-experience-container');
        container.innerHTML = '';
        
        this.workExperiences.forEach((exp, index) => {
            container.innerHTML += `
                <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="font-bold text-gray-900">${exp.title || ''}</h4>
                        <button type="button" onclick="formateurProfile.removeWorkExperience(${index})" 
                            class="text-red-600 hover:text-red-700 p-1">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Poste</label>
                            <input type="text" value="${exp.title || ''}" onchange="formateurProfile.updateWorkExp(${index}, 'title', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Professeur de Mathématiques" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Entreprise/École</label>
                            <input type="text" value="${exp.company || ''}" onchange="formateurProfile.updateWorkExp(${index}, 'company', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Nom de l'établissement" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Période</label>
                            <input type="text" value="${exp.period || ''}" onchange="formateurProfile.updateWorkExp(${index}, 'period', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="2020 - 2023" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Lieu</label>
                            <input type="text" value="${exp.location || ''}" onchange="formateurProfile.updateWorkExp(${index}, 'location', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Tunis, Tunisie" />
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-gray-600 mb-1">Description</label>
                            <textarea onchange="formateurProfile.updateWorkExp(${index}, 'description', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" rows="2" 
                                placeholder="Décrivez vos responsabilités...">${exp.description || ''}</textarea>
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderEducation() {
        const container = document.getElementById('education-container');
        container.innerHTML = '';
        
        this.education.forEach((edu, index) => {
            container.innerHTML += `
                <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="font-bold text-gray-900">${edu.degree || ''}</h4>
                        <button type="button" onclick="formateurProfile.removeEducation(${index})" 
                            class="text-red-600 hover:text-red-700 p-1">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Diplôme</label>
                            <input type="text" value="${edu.degree || ''}" onchange="formateurProfile.updateEducation(${index}, 'degree', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Master en Mathématiques" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Établissement</label>
                            <input type="text" value="${edu.institution || ''}" onchange="formateurProfile.updateEducation(${index}, 'institution', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Université..." />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Année</label>
                            <input type="text" value="${edu.year || ''}" onchange="formateurProfile.updateEducation(${index}, 'year', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="2020" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Mention</label>
                            <input type="text" value="${edu.mention || ''}" onchange="formateurProfile.updateEducation(${index}, 'mention', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Très bien, Bien..." />
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderCertifications() {
        const container = document.getElementById('certifications-container');
        container.innerHTML = '';
        
        this.certifications.forEach((cert, index) => {
            container.innerHTML += `
                <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="font-bold text-gray-900">${cert.name || ''}</h4>
                        <button type="button" onclick="formateurProfile.removeCertification(${index})" 
                            class="text-red-600 hover:text-red-700 p-1">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Nom de la certification</label>
                            <input type="text" value="${cert.name || ''}" onchange="formateurProfile.updateCertification(${index}, 'name', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Microsoft Certified Educator" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Organisme</label>
                            <input type="text" value="${cert.issuer || ''}" onchange="formateurProfile.updateCertification(${index}, 'issuer', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Microsoft, Google..." />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Date d'obtention</label>
                            <input type="text" value="${cert.date || ''}" onchange="formateurProfile.updateCertification(${index}, 'date', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Janvier 2023" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">ID/Lien de vérification</label>
                            <input type="text" value="${cert.credentialId || ''}" onchange="formateurProfile.updateCertification(${index}, 'credentialId', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Lien ou ID" />
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderTeachingExperiences() {
        const container = document.getElementById('teaching-experience-container');
        container.innerHTML = '';
        
        this.teachingExperiences.forEach((exp, index) => {
            container.innerHTML += `
                <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="font-bold text-gray-900">${exp.subject || ''}</h4>
                        <button type="button" onclick="formateurProfile.removeTeachingExp(${index})" 
                            class="text-red-600 hover:text-red-700 p-1">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Matière enseignée</label>
                            <input type="text" value="${exp.subject || ''}" onchange="formateurProfile.updateTeachingExp(${index}, 'subject', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Mathématiques" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Niveau</label>
                            <input type="text" value="${exp.level || ''}" onchange="formateurProfile.updateTeachingExp(${index}, 'level', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Bac, Préparatoire..." />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Nombre d'étudiants</label>
                            <input type="number" value="${exp.studentsCount || ''}" onchange="formateurProfile.updateTeachingExp(${index}, 'studentsCount', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="50" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">Période</label>
                            <input type="text" value="${exp.period || ''}" onchange="formateurProfile.updateTeachingExp(${index}, 'period', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="2018 - 2023" />
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-gray-600 mb-1">Méthodes & Réalisations</label>
                            <textarea onchange="formateurProfile.updateTeachingExp(${index}, 'achievements', this.value)"
                                class="w-full p-2 border border-gray-300 rounded-lg text-sm" rows="2" 
                                placeholder="Décrivez vos méthodes d'enseignement et résultats...">${exp.achievements || ''}</textarea>
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Update methods
    updateWorkExp(index, field, value) {
        if (this.workExperiences[index]) {
            this.workExperiences[index][field] = value;
        }
    }

    updateEducation(index, field, value) {
        if (this.education[index]) {
            this.education[index][field] = value;
        }
    }

    updateCertification(index, field, value) {
        if (this.certifications[index]) {
            this.certifications[index][field] = value;
        }
    }

    updateTeachingExp(index, field, value) {
        if (this.teachingExperiences[index]) {
            this.teachingExperiences[index][field] = value;
        }
    }

    // Remove methods
    removeWorkExperience(index) {
        if (confirm('Supprimer cette expérience?')) {
            this.workExperiences.splice(index, 1);
            this.renderWorkExperiences();
        }
    }

    removeEducation(index) {
        if (confirm('Supprimer cette formation?')) {
            this.education.splice(index, 1);
            this.renderEducation();
        }
    }

    removeCertification(index) {
        if (confirm('Supprimer cette certification?')) {
            this.certifications.splice(index, 1);
            this.renderCertifications();
        }
    }

    removeTeachingExp(index) {
        if (confirm('Supprimer cette expérience?')) {
            this.teachingExperiences.splice(index, 1);
            this.renderTeachingExperiences();
        }
    }

    async loadStatistics() {
        try {
            const allCourses = await dataManager.getAll('courses');
            const instructorCourses = allCourses.filter(c => c.instructorId === this.currentUser.id);
            
            let totalStudents = 0;
            instructorCourses.forEach(course => {
                if (course.studentIds && Array.isArray(course.studentIds)) {
                    totalStudents += course.studentIds.length;
                }
            });

            document.getElementById('stat-classes').textContent = instructorCourses.length;
            document.getElementById('stat-students').textContent = totalStudents;
            
            if (this.currentUser.createdAt) {
                const joinDate = new Date(this.currentUser.createdAt);
                const formattedDate = joinDate.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                document.getElementById('stat-joined').textContent = formattedDate;
            }

            console.log(`📊 Statistiques: ${instructorCourses.length} cours, ${totalStudents} étudiants`);
        } catch (error) {
            console.error('❌ Erreur chargement statistiques:', error);
        }
    }

    async saveProfile() {
        try {
            console.log('💾 Sauvegarde...');

            const updatedData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                specialite: document.getElementById('specialite').value.trim(),
                bio: document.getElementById('bio').value.trim(),
                experience: parseInt(document.getElementById('experience').value) || 0,
                qualification: document.getElementById('qualification').value,
                workExperiences: this.workExperiences,
                education: this.education,
                certifications: this.certifications,
                teachingExperiences: this.teachingExperiences
            };

            if (!updatedData.name || !updatedData.email || !updatedData.specialite) {
                alert('⚠️ Veuillez remplir tous les champs obligatoires');
                return;
            }

            if (this.profileImage) {
                updatedData.profileImage = this.profileImage;
            } else if (this.currentUser.profileImage) {
                updatedData.profileImage = this.currentUser.profileImage;
            }

            if (this.cvFile) {
                updatedData.cvFile = this.cvFile.data;
                updatedData.cvFileName = this.cvFile.name;
            } else if (this.currentUser.cvFile) {
                updatedData.cvFile = this.currentUser.cvFile;
                updatedData.cvFileName = this.currentUser.cvFileName;
            }

            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    alert('❌ Mots de passe non correspondants!');
                    return;
                }
                if (newPassword.length < 6) {
                    alert('❌ Le mot de passe doit contenir au moins 6 caractères');
                    return;
                }
                updatedData.password = newPassword;
            }

            await dataManager.update('users', this.currentUser.id, {
                ...this.currentUser,
                ...updatedData,
                updatedAt: new Date().toISOString()
            });

            this.currentUser = { ...this.currentUser, ...updatedData };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            alert('✅ Profil sauvegardé avec succès!');
            
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';

            console.log('✅ Profil sauvegardé');
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            alert('❌ Erreur lors de la sauvegarde');
        }
    }
}

// Global instance
window.formateurProfile = new FormateurProfile();

// Add functions
window.addWorkExperience = function() {
    window.formateurProfile.workExperiences.push({
        title: '',
        company: '',  
        period: '',
        location: '',
        description: ''
    });
    window.formateurProfile.renderWorkExperiences();
};

window.addEducation = function() {
    window.formateurProfile.education.push({
        degree: '',
        institution: '',
        year: '',
        mention: ''
    });
    window.formateurProfile.renderEducation();
};

window.addCertification = function() {
    window.formateurProfile.certifications.push({
        name: '',
        issuer: '',
        date: '',
        credentialId: ''
    });
    window.formateurProfile.renderCertifications();
};

window.addTeachingExperience = function() {
    window.formateurProfile.teachingExperiences.push({
        subject: '',
        level: '',
        studentsCount: '',
        period: '',
        achievements: ''
    });
    window.formateurProfile.renderTeachingExperiences();
};

window.previewImage = function(event) {
    const file = event.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('❌ Image uniquement');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ Taille max: 5 MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-image-preview').src = e.target.result;
            window.formateurProfile.profileImage = e.target.result;
            console.log('✅ Image chargée');
        };
        reader.readAsDataURL(file);
    }
};

window.handleCvUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            alert('❌ PDF, DOC ou DOCX uniquement');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ Taille max: 5 MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            window.formateurProfile.cvFile = {
                name: file.name,
                data: e.target.result,
                type: file.type,
                size: file.size
            };
            document.getElementById('current-cv-display').classList.remove('hidden');
            document.getElementById('cv-filename').textContent = file.name;
            console.log('✅ CV chargé:', file.name);
            alert('✅ CV téléchargé! N\'oubliez pas de sauvegarder.');
        };
        reader.readAsDataURL(file);
    }
};

window.removeCv = function() {
    if (confirm('⚠️ Supprimer le CV?')) {
        window.formateurProfile.cvFile = null;
        document.getElementById('current-cv-display').classList.add('hidden');
        document.getElementById('cv-input').value = '';
        console.log('🗑️ CV supprimé');
    }
};

window.saveProfile = async function() {
    await window.formateurProfile.saveProfile();
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    await window.formateurProfile.init();
    lucide.createIcons();
});
