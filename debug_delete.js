const http = require('http');

async function testDelete() {
    // 1. Create a dummy course
    console.log("Creating dummy course...");
    const createRes = await fetch('http://localhost:3001/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: "DELETE TEST",
            description: "To be deleted",
            instructorId: "formateur-demo-1"
        })
    });
    const created = await createRes.json();
    console.log("Created:", created);

    if (!created.id) {
        console.error("Failed to create course");
        return;
    }

    // 2. Delete the course
    console.log(`Deleting course ${created.id}...`);
    const deleteRes = await fetch(`http://localhost:3001/api/courses/${created.id}`, {
        method: 'DELETE'
    });
    
    console.log("Delete status:", deleteRes.status);
    const deleteBody = await deleteRes.json();
    console.log("Delete response:", deleteBody);
}

testDelete();
