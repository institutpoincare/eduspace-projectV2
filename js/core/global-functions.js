/**
 * Global Functions - Shared across all pages
 */

// Start chat with instructor or student
function startChat(userId, userType) {
    console.log('💬 Starting chat with:', userId, userType);
    
    // Get current user
    const currentUser = sessionStorage.getItem('user');
    if (!currentUser) {
        alert('Veuillez vous connecter pour discuter');
        window.location.href = '/pages/login-etudiant.html';
        return;
    }

    // Store chat info in sessionStorage
    sessionStorage.setItem('chatWith', JSON.stringify({
        userId: userId,
        userType: userType,
        timestamp: new Date().toISOString()
    }));

    // Verify userType
    if (userType === 'etudiant') {
        window.location.href = '/pages/etudiant/messages.html';
    } else {
         window.location.href = '/pages/etudiant/messages.html';
    }
}

// View instructor CV/Profile
function viewInstructorCV(instructorId) {
    console.log('👁️ Viewing instructor profile:', instructorId);
    window.location.href = `/pages/formateur/profil.html?id=${instructorId}`;
}

// View center profile
function viewCenterProfile(centerId) {
    console.log('🏢 Viewing center profile:', centerId);
    window.location.href = `/pages/centre/profil.html?id=${centerId}`;
}

// Enroll in course
function enrollInCourse(courseId) {
    console.log('📚 Enrolling in course:', courseId);
    
    const currentUser = sessionStorage.getItem('user');
    if (!currentUser) {
        alert('Veuillez vous connecter pour vous inscrire');
        window.location.href = '/pages/login-etudiant.html';
        return;
    }

    // Redirect to course enrollment page
    window.location.href = `/pages/etudiant/mes-cours.html?enroll=${courseId}`;
}

// Make global
if (typeof window !== 'undefined') {
    window.startChat = startChat;
    window.viewInstructorCV = viewInstructorCV;
    window.viewCenterProfile = viewCenterProfile;
    window.enrollInCourse = enrollInCourse;
}
