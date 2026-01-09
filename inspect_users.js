const db = require('./server/db-manager');

async function inspect() {
    console.log("Loading users...");
    const users = await db.findAll('users');
    console.log(`Found ${users.length} users.`);
    
    users.forEach(u => {
        console.log(`- ID: ${u.id}`);
        console.log(`  Name: ${u.name}`);
        console.log(`  Email: "${u.email}"`); // Quotes to reveal spaces
        console.log(`  Role: ${u.role}`);
        console.log(`  AuthMethod: ${u.authMethod}`);
        console.log(`  HasPassword: ${!!u.password}`);
        if (u.password) {
             console.log(`  Password (first 10 chars): ${u.password.substring(0, 10)}...`);
             // Check if bcrypt
             if (u.password.startsWith('$2')) {
                 console.log('  Password format: BCRYPT HASH');
             } else {
                 console.log('  Password format: PLAIN TEXT (or other)');
             }
        }
        console.log('---');
    });
}

inspect();
