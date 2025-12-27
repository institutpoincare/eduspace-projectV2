// Formateur Registration Handler
console.log('🚀 Chargement du script d\'inscription formateur...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé, initialisation du formulaire...');

    const form = document.getElementById('formateurInscriptionForm');
    const submitBtn = document.querySelector('.btn-submit');

    if (!form) {
        console.error('❌ Formulaire non trouvé!');
        return;
    }

    console.log('✅ Formulaire trouvé, configuration en cours...');

    // Simple CAPTCHA verification
    let captchaVerified = false;
    const captchaContainer = document.getElementById('captchaContainer');
    const captchaInput = document.getElementById('captchaInput');
    const captchaQuestion = document.getElementById('captchaQuestion');

    if (!captchaInput || !captchaQuestion) {
        console.error('❌ Éléments CAPTCHA non trouvés!');
        return;
    }

    // Generate simple math CAPTCHA
    function generateCaptcha() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 + num2;

        captchaQuestion.textContent = `Combien font ${num1} + ${num2} ?`;
        captchaInput.dataset.answer = answer;
        captchaVerified = false;
        console.log('🔢 CAPTCHA généré:', num1, '+', num2, '=', answer);
    }

    // Verify CAPTCHA
    function verifyCaptcha() {
        const userAnswer = parseInt(captchaInput.value);
        const correctAnswer = parseInt(captchaInput.dataset.answer);

        console.log('🔍 Vérification CAPTCHA:', userAnswer, '===', correctAnswer);

        if (userAnswer === correctAnswer) {
            captchaVerified = true;
            captchaInput.style.borderColor = '#10b981'; // green
            console.log('✅ CAPTCHA vérifié avec succès');
            return true;
        } else if (captchaInput.value) {
            captchaVerified = false;
            captchaInput.style.borderColor = '#ef4444'; // red
            console.log('❌ CAPTCHA incorrect');
            return false;
        }
        return false;
    }

    captchaInput.addEventListener('input', () => {
        verifyCaptcha();
    });

    // Initialize CAPTCHA
    generateCaptcha();

    // Handle form submission
    async function handleSubmit(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        console.log('📝 Traitement de la soumission...');

        // Verify CAPTCHA first
        if (!captchaVerified) {
            console.log('❌ CAPTCHA non vérifié');
            alert('Veuillez compléter le CAPTCHA correctement.');
            return false;
        }

        console.log('✅ CAPTCHA OK, récupération des données...');

        // Get form data
        const formData = new FormData(form);
        const name = formData.get('name');
        const specialite = formData.get('specialite');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const password = formData.get('password');

        console.log('📊 Données du formulaire:', { name, specialite, email, phone, password: '***' });

        // Validate inputs
        if (!name || !specialite || !email || !phone || !password) {
            console.log('❌ Champs manquants');
            alert('Veuillez remplir tous les champs, y compris le numéro de téléphone.');
            return false;
        }

        // Create user object
        const newUser = {
            name: name,
            email: email,
            phone: phone,
            password: password,
            role: 'formateur',
            specialite: specialite
        };

        console.log('📡 Envoi de la requête API...');

        try {
            // Send to API
            const response = await fetch('http://localhost:3001/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });

            console.log('📨 Réponse reçue:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erreur serveur:', errorText);
                throw new Error('Erreur lors de l\'inscription');
            }

            const result = await response.json();
            console.log('✅ Inscription réussie:', result);

            // Store user info in sessionStorage (compatible with dataManager)
            sessionStorage.setItem('user', JSON.stringify(result));
            console.log('💾 Utilisateur sauvegardé dans sessionStorage');

            // Show success message
            alert('Inscription réussie! Bienvenue sur EduSpace.');

            // Redirect to formateur dashboard
            console.log('🔄 Redirection vers dashboard.html');
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('❌ Erreur complète:', error);
            alert('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
        }

        return false;
    }

    // Prevent default form submission
    form.addEventListener('submit', (e) => {
        console.log('📝 Événement submit déclenché');
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
        return false;
    });

    // Add click listener to button
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            console.log('🖱️ Bouton cliqué - Traitement manuel');
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
            return false;
        });
    }

    console.log('✅ Gestionnaires d\'événements configurés');
});
