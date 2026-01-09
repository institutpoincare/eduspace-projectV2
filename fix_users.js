const db = require('./server/db-manager');

async function fixUsers() {
    console.log("Fixing users...");
    const users = await db.findAll('users');
    
    const user1Id = '3fe68e9a-f5a7-4a34-b110-5b10879e40a8'; // The "Main" account
    const user3Id = 'd885368c-c34c-4b2f-bc16-c57c900455e3'; // The "Google" account
    
    const user1 = users.find(u => u.id === user1Id);
    const user3 = users.find(u => u.id === user3Id);
    
    if (!user1) {
        console.error("User 1 not found!");
        return;
    }
    
    // Updates for User 1
    const updates = {
        password: '123456', // Reset password
        email: 'ahmed.aboudi@gmail.com', // Force correct email for manual login
    };
    
    if (user3 && user3.googleId) {
        updates.googleId = user3.googleId;
        updates.authMethod = 'google'; // Allow both?
        console.log(`Copying Google ID ${user3.googleId} from User 3 to User 1.`);
    }
    
    await db.updateById('users', user1Id, updates);
    console.log("User 1 updated (Password: 123456, Email: ahmed.aboudi@gmail.com, +GoogleId).");
    
    if (user3) {
        await db.deleteById('users', user3Id);
        console.log("User 3 (Duplicate) deleted.");
    }
}

fixUsers();
