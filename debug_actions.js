async function testActions() {
    console.log("--- START DEBUG ---");
    
    // 1. Create
    console.log("1. Creating Course...");
    const createRes = await fetch('http://localhost:3001/api/courses', {
        method: 'POST',
        body: JSON.stringify({ title: "DEBUG ACTION", status: "active", instructorId: "formateur-demo-1" })
    });
    const item = await createRes.json();
    console.log("Created ID:", item.id);

    if (!item.id) return console.error("Create failed");

    // 2. Archive (Update)
    console.log("2. Archiving (PUT)...");
    item.status = "archived";
    const updateRes = await fetch(`http://localhost:3001/api/courses/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(item)
    });
    const updated = await updateRes.json();
    console.log("Update status:", updateRes.status);
    console.log("Updated Item Status:", updated.status);

    // 3. Delete
    console.log("3. Deleting...");
    const delRes = await fetch(`http://localhost:3001/api/courses/${item.id}`, { method: 'DELETE' });
    console.log("Delete status:", delRes.status);
    const delJson = await delRes.json();
    console.log("Delete response:", delJson);
    
    console.log("--- END DEBUG ---");
}

testActions();
