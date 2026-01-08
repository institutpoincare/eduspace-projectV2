const express = require('express');
const router = express.Router();
const googleDriveOAuth = require('../../backend/services/GoogleDriveOAuth');
const db = require('../db-manager');
const { authenticateToken } = require('../middleware/auth');

// Collection names
const TOKENS_COLLECTION = 'teacherTokens';
const RECORDINGS_COLLECTION = 'classRecordings';
const COURSES_COLLECTION = 'courses';

/**
 * @route   GET /api/auth/google-drive
 * @desc    Initier le flow OAuth Google Drive
 * @access  Private (Professeurs uniquement)
 */
router.get('/auth/google-drive', authenticateToken, async (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
             return res.status(500).json({
                success: false,
                message: 'Configuration Google Drive manquante. Vérifiez le fichier .env'
            });
        }
        const teacherId = req.user.id;
        const authUrl = googleDriveOAuth.getAuthUrl(teacherId);

        res.json({
            success: true,
            authUrl: authUrl
        });
    } catch (error) {
        console.error('❌ Erreur lors de la génération de l\'URL OAuth:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion à Google Drive'
        });
    }
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Callback OAuth Google
 * @access  Public (appelé par Google)
 */
// Route /auth/google/callback supprimée pour éviter le conflit avec auth.js
// La gestion des callbacks Drive est maintenant centralisée dans routes/auth.js

/**
 * @route   GET /api/drive/status
 * @desc    Vérifier le statut de connexion
 * @access  Private
 */
router.get('/drive/status', authenticateToken, async (req, res) => {
    try {
        const teacherId = req.user.id;
        const allTokens = await db.findAll(TOKENS_COLLECTION);
        const token = allTokens.find(t => t.teacherId === teacherId);

        if (token) {
            res.json({
                connected: true,
                folderId: token.drive_folder_id
            });
        } else {
            res.json({
                connected: false,
                folderId: null
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/drive/configure-folder
 * @desc    Configurer le dossier Drive à synchroniser
 * @access  Private (Professeurs uniquement)
 */
router.post('/drive/configure-folder', authenticateToken, async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { folderUrl, classId } = req.body;

        if (!folderUrl) {
            return res.status(400).json({ success: false, message: 'URL du dossier Drive requise' });
        }

        const folderId = googleDriveOAuth.extractFolderId(folderUrl);
        if (!folderId) {
            return res.status(400).json({ success: false, message: 'URL du dossier Drive invalide' });
        }

        const allTokens = await db.findAll(TOKENS_COLLECTION);
        let teacherTokens = allTokens.find(t => t.teacherId === teacherId);

        if (!teacherTokens) {
            return res.status(404).json({ success: false, message: 'Veuillez d\'abord connecter votre compte Google Drive' });
        }

        // Refresh token if needed
        if (googleDriveOAuth.isTokenExpired(new Date(teacherTokens.expiry_date).getTime())) {
            const newTokens = await googleDriveOAuth.refreshAccessToken(teacherTokens.refresh_token);
            teacherTokens = await db.updateById(TOKENS_COLLECTION, teacherTokens.id, {
                access_token: newTokens.access_token,
                expiry_date: new Date(newTokens.expiry_date).toISOString()
            });
        }

        const tokens = {
            access_token: teacherTokens.access_token,
            refresh_token: teacherTokens.refresh_token,
            expiry_date: new Date(teacherTokens.expiry_date).getTime()
        };

        // Test access
        await googleDriveOAuth.listFolderFiles(tokens, folderId, { pageSize: 1 });

        // Configure webhook
        // IMPORTANT: Use public URL in production. Localhost won't work for Google Webhooks.
        // We will assume a placeholder or ngrok url is set in process.env.APP_URL
        const webhookUrl = `${process.env.APP_URL || 'https://your-domain.com'}/api/webhooks/google-drive`;
        
        // Note: keeping webhook logic but it might fail on localhost without ngrok/tunnel
        let webhookInfo = { channelId: null, resourceId: null, expiration: null };
        try {
            webhookInfo = await googleDriveOAuth.watchFolder(tokens, folderId, webhookUrl);
        } catch (e) {
            console.warn("⚠️ Webhook setup failed (expected on localhost):", e.message);
        }

        // Update config
        await db.updateById(TOKENS_COLLECTION, teacherTokens.id, {
            drive_folder_id: folderId,
            drive_folder_url: folderUrl,
            webhook_channel_id: webhookInfo.channelId,
            webhook_resource_id: webhookInfo.resourceId,
            webhook_expiration: webhookInfo.expiration ? new Date(parseInt(webhookInfo.expiration)).toISOString() : null
        });

        // Initial Sync
        await syncFolderFiles(teacherId, classId, tokens, folderId);

        res.json({
            success: true,
            message: 'Dossier configuré avec succès',
            folderId,
            webhookExpiration: webhookInfo.expiration
        });
    } catch (error) {
        console.error('❌ Erreur lors de la configuration du dossier:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la configuration du dossier' });
    }
});

/**
 * @route   GET /api/drive/recordings/:classId
 * @desc    Récupérer les enregistrements d'une classe
 * @access  Private
 */
router.get('/drive/recordings/:classId', authenticateToken, async (req, res) => {
    try {
        const { classId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const allRecordings = await db.findAll(RECORDINGS_COLLECTION);
        
        let recordings = allRecordings.filter(r => r.classId === classId && r.status !== 'deleted');
        
        // Sort by added_at desc
        recordings.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));

        const total = recordings.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedRecordings = recordings.slice(startIndex, endIndex);

        res.json({
            success: true,
            recordings: paginatedRecordings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération enregistrements:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

/**
 * @route   POST /api/drive/sync-now/:classId
 * @desc    Forcer une synchronisation manuelle
 * @access  Private
 */
router.post('/drive/sync-now/:classId', authenticateToken, async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId } = req.params;

        const allTokens = await db.findAll(TOKENS_COLLECTION);
        let teacherTokens = allTokens.find(t => t.teacherId === teacherId);

        if (!teacherTokens || !teacherTokens.drive_folder_id) {
            return res.status(404).json({ success: false, message: 'Aucun dossier Drive configuré' });
        }

        if (googleDriveOAuth.isTokenExpired(new Date(teacherTokens.expiry_date).getTime())) {
            const newTokens = await googleDriveOAuth.refreshAccessToken(teacherTokens.refresh_token);
            teacherTokens = await db.updateById(TOKENS_COLLECTION, teacherTokens.id, {
                access_token: newTokens.access_token,
                expiry_date: new Date(newTokens.expiry_date).toISOString()
            });
        }

        const tokens = {
            access_token: teacherTokens.access_token,
            refresh_token: teacherTokens.refresh_token,
            expiry_date: new Date(teacherTokens.expiry_date).getTime()
        };

        const result = await syncFolderFiles(teacherId, classId, tokens, teacherTokens.drive_folder_id);

        res.json({
            success: true,
            message: 'Synchronisation terminée',
            ...result
        });
    } catch (error) {
        console.error('❌ Erreur synchro:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la synchronisation' });
    }
});

// Helper function to sync files
async function syncFolderFiles(teacherId, classId, tokens, folderId) {
    try {
        const { files } = await googleDriveOAuth.listFolderFiles(tokens, folderId);
        const allRecordings = await db.findAll(RECORDINGS_COLLECTION);
        
        let newCount = 0;
        let updatedCount = 0;

        for (const file of files) {
            const existing = allRecordings.find(r => r.drive_file_id === file.id);

            const fileData = {
                classId,
                teacherId,
                drive_file_id: file.id,
                title: file.name,
                url: file.webViewLink,
                webViewLink: file.webViewLink,
                webContentLink: file.webContentLink,
                thumbnail: file.thumbnailLink,
                size: parseInt(file.size) || 0,
                mimeType: file.mimeType,
                file_created_at: file.createdTime,
                file_modified_at: file.modifiedTime,
                added_at: new Date().toISOString(),
                status: 'active'
            };

            if (existing) {
                if (new Date(file.modifiedTime) > new Date(existing.file_modified_at)) {
                    await db.updateById(RECORDINGS_COLLECTION, existing.id, {
                        ...fileData,
                        synced_at: new Date().toISOString()
                    });
                    updatedCount++;
                }
            } else {
                await db.insert(RECORDINGS_COLLECTION, fileData);
                newCount++;
            }
        }

        // Update last sync on teacher tokens
        const allTokens = await db.findAll(TOKENS_COLLECTION);
        const token = allTokens.find(t => t.teacherId === teacherId);
        if (token) {
            await db.updateById(TOKENS_COLLECTION, token.id, { last_sync: new Date().toISOString() });
        }

        return { newCount, updatedCount, totalFiles: files.length };
    } catch (error) {
        console.error('❌ Erreur syncFolderFiles:', error);
        throw error;
    }
}

/**
 * @route   POST /api/drive/disconnect
 * @desc    Déconnecter Google Drive
 * @access  Private
 */
router.post('/drive/disconnect', authenticateToken, async (req, res) => {
    try {
        const teacherId = req.user.id;
        const allTokens = await db.findAll(TOKENS_COLLECTION);
        const token = allTokens.find(t => t.teacherId === teacherId);

        if (token) {
            // Optionnel: Révoquer le token Google côté serveur si nécessaire
            await db.deleteById(TOKENS_COLLECTION, token.id);
        }
        res.json({ success: true, message: 'Déconnecté avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
