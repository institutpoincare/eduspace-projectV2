// Parent Registration Handler
console.log('🚀 Chargement du script d\'inscription parent...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé, initialisation du formulaire parent...');

    // Le formulaire dans parent/inscription.html n'a pas d'ID, on va devoir le chercher
    // Ou mieux, on va modifier parent/inscription.html pour ajouter un ID
    // Pour l'instant on cherche le form global
    const form = document.querySelector('form');
    // Le bouton submit
    const submitBtn = document.querySelector('button[type="submit"]');

    if (!form) {
        console.error('❌ Formulaire non trouvé!');
        return;
    }

    // Supprimer l'attribut onsubmit inline s'il existe encore (on le retirera dans le fichier HTML aussi)
    form.removeAttribute('onsubmit');

    console.log('✅ Formulaire trouvé, configuration en cours...');

    // Handle form submission
    async function handleSubmit(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        console.log('📝 Traitement de la soumission...');

        // Get inputs directly by type since they might not have names in the original HTML
        const inputs = form.querySelectorAll('input');
        
        // Map inputs based on placeholder or order (fragile but compatible with existing HTML structure if not updated)
        // BUT we will update HTML to add names.
        // Assuming HTML has names now (I will add them in next step)
        
        const formData = new FormData(form);
        const name = formData.get('name') || inputs[0].value;
        const email = formData.get('email') || inputs[1].value;
        const phone = formData.get('phone') || inputs[2].value;
        const password = formData.get('password') || inputs[3].value;

        console.log('📊 Données du formulaire:', { name, email, phone, password: '***' });

        // Validate inputs
        if (!name || !email || !phone || !password) {
            console.log('❌ Champs manquants');
            alert('Veuillez remplir tous les champs.');
            return false;
        }

        // Create user object for parent
        const newUser = {
            name: name,
            email: email,
            phone: phone,
            password: password,
            role: 'parent',
            joinedAt: new Date().toISOString()
        };

        console.log('📡 Envoi de la requête API...');
        
        // Show loading state
        const originalBtnText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Inscription en cours...';

        try {
            // Send to API - Utiliser la route publique /api/register
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });

            console.log('📨 Réponse reçue:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Erreur serveur:', errorData.message);
                throw new Error(errorData.message || 'Erreur lors de l\'inscription');
            }

            const result = await response.json();
            console.log('✅ Inscription réussie:', result);

            // Store user info in sessionStorage
            if (result.user) {
                 sessionStorage.setItem('user', JSON.stringify(result.user));
                 // Also set token if returned (usually not returned by register but good to have)
                 if (result.token) sessionStorage.setItem('token', result.token);
            }
            
            console.log('💾 Utilisateur sauvegardé');

            // Show success message
            alert('Compte parent créé avec succès !');

            // Redirect to dashboard
            console.log('🔄 Redirection vers dashboard.html');
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('❌ Erreur complète:', error);
            alert('Erreur: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }

        return false;
    }

    form.addEventListener('submit', handleSubmit);
    
    console.log('✅ Gestionnaire submit configuré');
});
