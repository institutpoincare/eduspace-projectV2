
const fs = require('fs');
const path = require('path');

const coursesPath = path.join('d:\\files\\Eduspace\\eduspace-vanilla\\data\\courses.json');
const ahmedId = "3fe68e9a-f5a7-4a34-b110-5b10879e40a8";

try {
    let courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    console.log(`Initial course count: ${courses.length}`);

    // 1. Remove "drfgsdfg" and other garbage/demos
    const garbageIds = ["1766910063655", "1766911610236", "39882b71-1a40-4b5b-b726-9b9ef9e2e52e"];
    courses = courses.filter(c => !garbageIds.includes(c.id));

    // 2. Remove any "Demo" courses or classes
    courses = courses.filter(c => {
        const title = (c.title || "").toLowerCase();
        const cat = (c.category || "").toLowerCase();
        // Keep Ahmed's stuff for now, filter others
        // User said "fasa5 kol mahou demos" (delete all demos)
        // Also "mes classe fiha deux classe demo" (my classes has 2 demo classes)
        // We often denote demos by "Demo" in title or category, or instructor name "Formateur Demo"
        if (title.includes('demo') || cat.includes('demo')) return false;
        if (c.instructorName && c.instructorName.toLowerCase().includes('demo')) return false;
        return true;
    });

    // 3. Ensure Ahmed has NO live classes (type: 'class')
    // User: "ahmed aboudi ma3andou 7ata classe"
    const classesToRemove = courses.filter(c => c.instructorId === ahmedId && c.type === 'class');
    console.log(`Removing ${classesToRemove.length} live classes for Ahmed.`);
    courses = courses.filter(c => !(c.instructorId === ahmedId && c.type === 'class'));

    // 4. Ensure Ahmed HAS recorded courses (type: 'course' or undefined usually defaults to course in some logic, but let's be explicit)
    // User: "3andou des cours enregistré"
    // We'll Create 3 sample recorded courses for him if they don't exist.
    const ahmedRecorded = courses.filter(c => c.instructorId === ahmedId && c.type !== 'class');
    
    if (ahmedRecorded.length === 0) {
        console.log("Creating recorded courses for Ahmed...");
        const newCourses = [
            {
                id: "course-ahmed-1",
                instructorId: ahmedId,
                instructorName: "Ahmed Aboudi",
                type: "course", // Recorded
                title: "Anglais pour Débutants : Les Bases",
                description: "Apprenez les bases de la langue anglaise avec ce cours complet pour débutants. Grammaire, vocabulaire et prononciation.",
                category: "Anglais",
                price: 50,
                cover: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800",
                isPublished: true,
                chapters: [
                    {
                        id: 1,
                        title: "Introduction",
                        lessons: [
                            { id: 101, title: "L'alphabet et les sons", type: "video", meta: "link", content: "https://www.youtube.com/watch?v=sT-T3_1kZzg" } // Example link
                        ]
                    }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: "course-ahmed-2",
                instructorId: ahmedId,
                instructorName: "Ahmed Aboudi",
                type: "course",
                title: "Business English : Réussir vos entretiens",
                description: "Maîtrisez l'anglais des affaires pour booster votre carrière et réussir vos entretiens à l'international.",
                category: "Anglais",
                price: 80,
                cover: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
                isPublished: true,
                chapters: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: "course-ahmed-3",
                instructorId: ahmedId,
                instructorName: "Ahmed Aboudi",
                type: "course",
                title: "Préparation au TOEFL/IELTS",
                description: "Stratégies et exercices pratiques pour obtenir un score élevé aux examens internationaux d'anglais.",
                category: "Anglais",
                price: 120,
                cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
                isPublished: true,
                chapters: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        courses.push(...newCourses);
    }

    console.log(`Final course count: ${courses.length}`);
    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2), 'utf8');

} catch (e) {
    console.error("Error cleaning up courses:", e);
}
