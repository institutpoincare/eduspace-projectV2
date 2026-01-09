// Entreprise Registration Handler
console.log('🚀 Chargement du script d\'inscription entreprise...');

// Expose finishRegistration to global scope because it is called by inline onclick in the HTML logic
window.finishRegistration = async function() {
    console.log('🏢 Finalisation de l\'inscription entreprise...');

    // Get Data from Form
    // Note: The enterprise form is multi-step and somewhat complex.
    // Inputs are scattered.
    
    // Step 1 Inputs
    const firstNameInput = document.querySelector('input[placeholder="Ex: Ahmed"]');
    const lastNameInput = document.querySelector('input[placeholder="Ex: Ben Ali"]');
    const emailInput = document.querySelector('input[placeholder="email@exemple.com"]');
    const phoneInput = document.querySelector('input[placeholder="+216 00 000 000"]');
    
    // We don't have a password field in the UI for Enterprise (mockup issue?)
    // Or maybe it is auto-generated?
    // Let's assume there is none and we generate a default one or asking user later.
    // Wait, the HTML (Step 1) DOES NOT HAVE PASSWORD.
    // This is a mockup flaw.
    // I will add a default password '12345678' or prompt.
    // Or I should look closer at the HTML.
    
    const firstName = firstNameInput ? firstNameInput.value : '';
    const lastName = lastNameInput ? lastNameInput.value : '';
    const email = emailInput ? emailInput.value : '';
    const phone = phoneInput ? phoneInput.value : '';
    
    if (!firstName || !lastName || !email) {
        alert("Veuillez remplir les informations obligatoires (Nom, Prénom, Email).");
        return;
    }

    const name = `${firstName} ${lastName}`;
    
    // Payment Data
    const courseSelect = document.getElementById('courseSelect');
    const payAmount = document.getElementById('payAmount');
    
    const coursePrice = courseSelect ? courseSelect.value : 0;
    const amountPaid = payAmount ? payAmount.value : 0;
    
    // Create User Object
    const newUser = {
        name: name,
        email: email,
        phone: phone,
        password: 'password123', // Default temporary password since UI is missing it
        role: 'entreprise',
        joinedAt: new Date().toISOString(),
        payment: {
            coursePrice: coursePrice,
            amountPaid: amountPaid
        }
    };

    // Animate button
    const btn = document.getElementById('nextBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Traitement...';
    btn.classList.add('brightness-90', 'cursor-not-allowed');
    btn.disabled = true;

    try {
        console.log('📡 Envoi inscription entreprise...', newUser);
        
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de l\'inscription');
        }

        const result = await response.json();
        console.log('✅ Inscription réussie:', result);

        // Store user
        if (result.user) {
             sessionStorage.setItem('user', JSON.stringify(result.user));
        }

        setTimeout(() => {
            alert("🎉 Inscription réussie ! \nL'apprenant a été ajouté et la facture a été générée.");
            // Redirect to dashboard (employes.html seems to be the one)
            window.location.href = 'employes.html';
        }, 1000);

    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur: ' + error.message);
        btn.innerHTML = originalText;
        btn.classList.remove('brightness-90', 'cursor-not-allowed');
        btn.disabled = false;
    }
};
