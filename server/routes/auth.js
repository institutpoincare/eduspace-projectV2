/**
 * Routes d'authentification Google OAuth
 * Permet aux utilisateurs de se connecter avec Google
 */

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const db = require('../db-manager');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const SECRET_KEY = process.env.JWT_SECRET || "eduspace_jwt_secret_key";

// Configuration OAuth2 pour l'authentification utilisateur
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Scopes pour l'authentification utilisateur (profil + email)
const AUTH_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
];

/**
 * Route: Initier la connexion Google
 * GET /api/auth/google/login?role=etudiant
 */
router.get('/auth/google/login', (req, res) => {
    const { role } = req.query;
    
    if (!role || !['etudiant', 'formateur', 'parent', 'entreprise'].includes(role)) {
        return res.status(400).json({ error: 'Role invalide' });
    }

    // Générer l'URL d'autorisation avec le rôle dans le state
    // Modification: Utilisation d'un cookie pour sécuriser le state (Localhost Fix)
    const stateJson = JSON.stringify({
        role: req.query.role || 'etudiant',
        timestamp: Date.now(),
        type: 'user_auth'
    });
    const stateBase64 = Buffer.from(stateJson).toString('base64');

    // ✅ هكا الصحيح في Localhost
    res.cookie('auth_state', stateBase64, {
        httpOnly: true,
        secure: false, // ⚠️ لازم تكون false مادامك تخدم localhost
        sameSite: 'lax', // JS ne peut pas lire, mais navigateur l'envoie
        maxAge: 3600000 // 1 heure
    });

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: AUTH_SCOPES,
        state: stateBase64,
        prompt: 'select_account' 
    });

    res.json({ authUrl });
});

/**
 * Route: Callback Google OAuth
 * GET /api/auth/google/callback?code=...&state=...
 */
// Importer le service Drive OAuth pour le dispatcher
const googleDriveOAuth = require('../../backend/services/GoogleDriveOAuth');
const TOKENS_COLLECTION = 'teacherTokens';

/**
 * Route: Callback Google OAuth Centralisé
 * Gère à la fois le Login Utilisateur et la Connexion Drive Professeur
 * GET /api/auth/google/callback?code=...&state=...
 */
router.get('/auth/google/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error('❌ Erreur renvoyée par Google:', error);
        return res.redirect(`${process.env.APP_URL}/pages/login-choix.html?error=auth_failed_google`);
    }

    if (!code || !state) {
        return res.redirect(`${process.env.APP_URL}/pages/login-choix.html?error=missing_params`);
    }

    // 🔍 DEBUG STATE:
    console.log("🔍 DEBUG STATE:");
    console.log("👉 Cookie reçu (navigateur):", req.cookies ? req.cookies.auth_state : 'undefined');
    console.log("👉 State reçu (Google):", req.query.state);

    try {
        // 1. Tenter de décoder le state via Buffer (format Login)
        // Login Format: JSON({ role, timestamp, type: 'user_auth' })
        // Drive Format: JSON({ teacherId, timestamp, random })
        
        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        } catch (e) {
            console.error('❌ Erreur decodage state:', e);
            throw new Error('State invalide');
        }

        // ==========================================
        // CAS 1 : AUTHENTIFICATION UTILISATEUR (LOGIN)
        // ==========================================
        if (stateData.type === 'user_auth') {
            const { role } = stateData;
            console.log('🔹 Callback reçu pour LOGIN:', role);

            // Échanger le code contre des tokens
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            // Récupérer les informations de l'utilisateur
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const { data: userInfo } = await oauth2.userinfo.get();

            // Vérifier si l'utilisateur existe déjà
            // UPDATE: Chercher par email OU par googleId (pour gérer les changements d'email ou typos)
            const users = await db.findAll('users');
            let user = users.find(u => u.email === userInfo.email || (u.googleId && u.googleId === userInfo.id));

            if (!user) {
                // Créer un nouveau compte utilisateur
                user = await db.insert('users', {
                    email: userInfo.email,
                    name: userInfo.name || userInfo.email.split('@')[0],
                    role: role,
                    googleId: userInfo.id,
                    avatar: userInfo.picture,
                    joinedAt: new Date(),
                    authMethod: 'google'
                });
                console.log(`✅ Nouveau compte créé via Google: ${user.email} (${role})`);
            } else {
                // Mettre à jour les informations si nécessaire
                if (!user.googleId) {
                    await db.updateById('users', user.id, {
                        googleId: userInfo.id,
                        avatar: userInfo.picture,
                        authMethod: 'google'
                    });
                }
                console.log(`✅ Connexion Google réussie: ${user.email} (${user.role})`);
            }

            // Générer un JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    role: user.role, 
                    name: user.name,
                    email: user.email 
                }, 
                SECRET_KEY, 
                { expiresIn: '24h' }
            );

            // Rediriger vers la page appropriée
            const dashboardUrls = {
                'etudiant': '/pages/etudiant/dashboard.html',
                'formateur': '/pages/formateur/dashboard.html',
                'parent': '/pages/parent/dashboard.html',
                'entreprise': '/pages/entreprise/dashboard.html'
            };

            const redirectUrl = dashboardUrls[user.role] || '/pages/login-choix.html';
            
            // Redirection
             return res.redirect(`${process.env.APP_URL}${redirectUrl}?token=${token}&auth=google`);
        }

        // ==========================================
        // CAS 2 : CONNEXION DRIVE (PROFESSEUR)
        // ==========================================
        else if (stateData.teacherId) {
            console.log('🔹 Callback reçu pour DRIVE:', stateData.teacherId);
            const teacherId = stateData.teacherId;
            
            // Utiliser le service DriveOAuth pour échanger le code
            // Note: On utilise googleDriveOAuth instance car elle est configurée avec les scopes Drive
            const tokens = await googleDriveOAuth.getTokens(code);

            // Sauvegarder les tokens prof
            const allTokens = await db.findAll(TOKENS_COLLECTION);
            let teacherToken = allTokens.find(t => t.teacherId === teacherId);

            const tokenData = {
                teacherId,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: new Date(tokens.expiry_date).toISOString(),
                sync_status: 'active'
            };

            if (teacherToken) {
                await db.updateById(TOKENS_COLLECTION, teacherToken.id, tokenData);
            } else {
                await db.insert(TOKENS_COLLECTION, tokenData);
            }

            console.log(`✅ Tokens OAuth Drive sauvegardés pour: ${teacherId}`);
            return res.redirect(`${process.env.APP_URL}/pages/formateur/dashboard.html?drive_connected=true`);
        }

        // Cas Inconnu
        else {
            console.warn('⚠️ State inconnu:', stateData);
            throw new Error('Type de state inconnu');
        }

    } catch (error) {
        console.error('❌ Erreur lors du callback Google Centralisé:', error);
        // Essayer de rediriger intelligemment
        // Si c'est probablement un prof (basé sur le referer ou autre), on pourrait rediriger vers dashboard
        // Par défaut login
        res.redirect(`${process.env.APP_URL}/pages/login-choix.html?error=auth_failed_exception`);
    }
});

/**
 * Route: Déconnexion
 * POST /api/auth/logout
 */
router.post('/auth/logout', (req, res) => {
    // Côté serveur, on ne fait rien de spécial (JWT est stateless)
    // Le frontend supprimera le token du sessionStorage
    res.json({ success: true, message: 'Déconnexion réussie' });
});

module.exports = router;
