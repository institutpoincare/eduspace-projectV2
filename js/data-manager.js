/**
 * Data Manager
 * Simule une base de données locale utilisant localStorage
 */

const DataManager = {
    // --- Initialisation ---
    init() {
        if (!localStorage.getItem('classes')) {
            localStorage.setItem('classes', JSON.stringify(this.getMockClasses()));
        }
        if (!localStorage.getItem('courses')) {
            localStorage.setItem('courses', JSON.stringify(this.getMockCourses()));
        }
        if (!localStorage.getItem('students')) {
            localStorage.setItem('students', JSON.stringify(this.getMockStudents()));
        }
    },

    // --- Mock Data ---
    getMockClasses() {
        return [
            {
                id: 1,
                name: 'Mathématiques Avancées',
                category: 'scolaire',
                level: 'Baccalauréat',
                price: '120',
                students: 4,
                status: 'actif',
                slots: [
                    { day: 'Lundi', startTime: '18:00', endTime: '20:00' },
                    { day: 'Jeudi', startTime: '18:00', endTime: '20:00' }
                ],
                weeksDuration: 4,
                accessCode: 'MATH-2024',
                studentIds: [101, 102, 103, 104],
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Physique - Mécanique',
                category: 'scolaire',
                level: '3ème année secondaire',
                price: '100',
                students: 2,
                status: 'actif',
                slots: [
                    { day: 'Mercredi', startTime: '14:00', endTime: '16:00' }
                ],
                weeksDuration: 4,
                accessCode: 'PHYS-2024',
                studentIds: [101, 105],
                created_at: new Date().toISOString()
            }
        ];
    },

    getMockCourses() {
        return [
            {
                id: 1,
                title: 'Introduction à l\'Algèbre',
                level: '1ère année secondaire',
                chapters: 3,
                documents: 5
            },
            {
                id: 2,
                title: 'Géométrie Vectorielle',
                level: '2ème année secondaire',
                chapters: 4,
                documents: 8
            }
        ];
    },

    getMockStudents() {
        return [
            { id: 101, name: 'Youssef Ben Salah', email: 'youssef@test.com', avatar: 'Y' },
            { id: 102, name: 'Myriam Dridi', email: 'myriam@test.com', avatar: 'M' },
            { id: 103, name: 'Ahmed Tounsi', email: 'ahmed@test.com', avatar: 'A' },
            { id: 104, name: 'Fatma Kallel', email: 'fatma@test.com', avatar: 'F' },
            { id: 105, name: 'Omar Jaziri', email: 'omar@test.com', avatar: 'O' }
        ];
    },

    // --- Classes Methods ---
    getClasses() {
        return JSON.parse(localStorage.getItem('classes') || '[]');
    },

    saveClass(classData) {
        const classes = this.getClasses();
        if (classData.id) {
            const index = classes.findIndex(c => c.id === classData.id);
            if (index !== -1) {
                // Merge existing data to preserve students if not provided
                classes[index] = { ...classes[index], ...classData };
            }
        } else {
            const newClass = {
                ...classData,
                id: Date.now(),
                students: 0,
                status: 'actif',
                revenue: 0,
                studentIds: [], // Now expects array of objects: { id, name, email, payment: 'Payé'|'Non payé', amountPaid: 0 }
                created_at: new Date().toISOString()
            };
            classes.push(newClass);
        }
        localStorage.setItem('classes', JSON.stringify(classes));
        return true;
    },

    updateClassStudent(classId, studentId, updateData) {
        const classes = this.getClasses();
        const classIdx = classes.findIndex(c => c.id === classId);
        if (classIdx === -1) return false;

        const cls = classes[classIdx];
        const studentIdx = cls.studentIds.findIndex(s => s.id === studentId);

        if (studentIdx !== -1) {
            cls.studentIds[studentIdx] = { ...cls.studentIds[studentIdx], ...updateData };
            classes[classIdx] = cls;
            localStorage.setItem('classes', JSON.stringify(classes));
            return true;
        }
        return false;
    },

    deleteClass(id) {
        const classes = this.getClasses().filter(c => c.id !== id);
        localStorage.setItem('classes', JSON.stringify(classes));
    },

    // --- Courses Methods ---
    getCourses() {
        return JSON.parse(localStorage.getItem('courses') || '[]');
    },

    saveCourse(courseData) {
        const courses = this.getCourses();
        const newCourse = {
            ...courseData,
            id: Date.now(),
            chapters: courseData.chapters?.length || 0,
            documents: 0 // Mock count
        };
        courses.push(newCourse);
        localStorage.setItem('courses', JSON.stringify(courses));
    },

    // --- Students Methods ---
    getStudents() {
        return JSON.parse(localStorage.getItem('students') || '[]');
    }
};

// Initialize on load if needed, but better to call explicitly
DataManager.init();
