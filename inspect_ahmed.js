
const fs = require('fs');
const path = require('path');

const coursesPath = path.join('d:\\files\\Eduspace\\eduspace-vanilla\\data\\courses.json');

try {
    const raw = fs.readFileSync(coursesPath, 'utf8');
    const courses = JSON.parse(raw);

    const ahmedId = "3fe68e9a-f5a7-4a34-b110-5b10879e40a8";
    
    const ahmedCourses = courses.filter(c => c.instructorId === ahmedId);
    console.log("Ahmed's Courses Found:", ahmedCourses.length);
    ahmedCourses.forEach(c => console.log(JSON.stringify(c, null, 2)));

    console.log("--- Possible Lost Courses (Anglais) ---");
    const anglaisCourses = courses.filter(c => 
        (c.category === 'Anglais' || (c.title && c.title.toLowerCase().includes('anglais')))
    );
    anglaisCourses.forEach(c => console.log(`ID: ${c.id}, Title: ${c.title}, Instructor: ${c.instructorId}, Type: ${c.type}`));
    
    console.log("--- Courses Example Content ---");
    const examplePath = path.join('d:\\files\\Eduspace\\eduspace-vanilla\\data\\courses-example.json');
    if(fs.existsSync(examplePath)) {
        const exCourses = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
        exCourses.forEach(c => console.log(`[Example] ID: ${c.id}, Title: ${c.title}, Instructor: ${c.instructorId}`));
    }
    
    // Also check for any 'demo' courses globally just in case
    // const demoCourses = courses.filter(c => c.title && c.title.toLowerCase().includes('demo'));
    // console.log("Demo Courses Count:", demoCourses.length);

} catch (e) {
    console.error(e);
}
