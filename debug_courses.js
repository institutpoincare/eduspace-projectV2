const fs = require('fs');
const path = require('path');

const coursesPath = path.join(__dirname, 'data', 'courses.json');

try {
    const data = fs.readFileSync(coursesPath, 'utf8');
    const courses = JSON.parse(data);
    
    console.log("Count of courses:", courses.length);
    courses.forEach(course => {
        console.log(`ID: ${course.id}, Title: ${course.title}, Price: ${course.price}, PromoPrice: ${course.promoPrice}`);
    });
} catch (err) {
    console.error("Error reading courses:", err);
}
