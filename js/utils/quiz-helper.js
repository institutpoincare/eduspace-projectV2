/**
 * Helper function to find quizzes for a specific chapter.
 * Handles potential type mismatches (string vs number) for IDs.
 * 
 * @param {Object} courseData - The full course object containing a 'quizzes' array at the root.
 * @param {string|number} chapterId - The ID of the chapter to filter by.
 * @returns {Array} - An array of quiz objects belonging to the specified chapter.
 */
function getQuizzesForChapter(courseData, chapterId) {
    if (!courseData || !courseData.quizzes || !Array.isArray(courseData.quizzes)) {
        console.warn("getQuizzesForChapter: No quizzes found in courseData.");
        return [];
    }

    // Convert chapterId to string for consistent comparison
    const targetChapterId = String(chapterId);

    return courseData.quizzes.filter(quiz => {
        // Safe check if quiz has a chapterId, then compare as strings
        return quiz.chapterId && String(quiz.chapterId) === targetChapterId;
    });
}
