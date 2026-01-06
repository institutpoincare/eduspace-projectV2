/**
 * Routes API : Google Drive OAuth & Synchronisation
 * Gestion complète de l'authentification et synchronisation Drive
 */

const express = require('express');
const router = express.Router();
const googleDriveOAuth = require('../services/GoogleDriveOAuth');
const TeacherTokens = require('../models/TeacherTokens');
const ClassRecordings = require('../models/ClassRecordings');

// Middleware d'authentification (à adapter selon votre système)
const authMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/auth/google-drive
 * @desc    Initier le flow OAuth Google Drive
 * @access  Private (Professeurs uniquement)
 */
router.get('/auth/google-drive', authMiddleware, async (req, res) => {
    try {
        const teacherId = req.user.id;

        // Générer l'URL d'autorisation
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
router.get('/auth/google/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        // Vérifier les erreurs OAuth
        if (error) {
            return res.redirect(`/pages/formateur/dashboard.html?error=oauth_denied`);
        }

        if (!code || !state) {
            return res.redirect(`/pages/formateur/dashboard.html?error=invalid_callback`);
        }

        // Décoder le state pour récupérer teacherId
        const stateData = googleDriveOAuth.decodeState(state);
        if (!stateData || !stateData.teacherId) {
            return res.redirect(`/pages/formateur/dashboard.html?error=invalid_state`);
        }

        const teacherId = stateData.teacherId;

        // Échanger le code contre des tokens
        const tokens = await googleDriveOAuth.getTokens(code);

        // Sauvegarder les tokens en base de données
        await TeacherTokens.findOneAndUpdate(
            { teacherId },
            {
                teacherId,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: new Date(tokens.expiry_date),
                sync_status: 'active'
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Tokens OAuth sauvegardés pour le professeur ${teacherId}`);

        // Rediriger vers le dashboard avec succès
        res.redirect(`/pages/formateur/dashboard.html?drive_connected=true`);
    } catch (error) {
        console.error('❌ Erreur lors du callback OAuth:', error);
        res.redirect(`/pages/formateur/dashboard.html?error=oauth_failed`);
    }
});

/**
 * @route   POST /api/drive/configure-folder
 * @desc    Configurer le dossier Drive à synchroniser
 * @access  Private (Professeurs uniquement)
 */
router.post('/drive/configure-folder', authMiddleware, async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { folderUrl, classId } = req.body;

        // Validation
        if (!folderUrl) {
            return res.status(400).json({
                success: false,
                message: 'URL du dossier Drive requise'
            });
        }

        // Extraire l'ID du dossier
        const folderId = googleDriveOAuth.extractFolderId(folderUrl);
        if (!folderId) {
            return res.status(400).json({
                success: false,
                message: 'URL du dossier Drive invalide'
            });
        }

        // Récupérer les tokens du professeur
        const teacherTokens = await TeacherTokens.findOne({ teacherId });
        if (!teacherTokens) {
            return res.status(404).json({
                success: false,
                message: 'Veuillez d\'abord connecter votre compte Google Drive'
            });
        }

        // Vérifier si le token est expiré et le rafraîchir si nécessaire
        if (teacherTokens.isExpired()) {
            const newTokens = await googleDriveOAuth.refreshAccessToken(teacherTokens.refresh_token);
            teacherTokens.access_token = newTokens.access_token;
            teacherTokens.expiry_date = new Date(newTokens.expiry_date);
            await teacherTokens.save();
        }

        // Tester l'accès au dossier
        const tokens = {
            access_token: teacherTokens.access_token,
            refresh_token: teacherTokens.refresh_token,
            expiry_date: teacherTokens.expiry_date.getTime()
        };

        const { files } = await googleDriveOAuth.listFolderFiles(tokens, folderId, { pageSize: 1 });

        // Configurer le webhook
        const webhookUrl = `${process.env.APP_URL}/api/webhooks/google-drive`;
        const webhookInfo = await googleDriveOAuth.watchFolder(tokens, folderId, webhookUrl);

        // Mettre à jour la configuration
        teacherTokens.drive_folder_id = folderId;
        teacherTokens.drive_folder_url = folderUrl;
        teacherTokens.webhook_channel_id = webhookInfo.channelId;
        teacherTokens.webhook_resource_id = webhookInfo.resourceId;
        teacherTokens.webhook_expiration = new Date(parseInt(webhookInfo.expiration));
        await teacherTokens.save();

        // Synchronisation initiale
        await syncFolderFiles(teacherId, classId, tokens, folderId);

        res.json({
            success: true,
            message: 'Dossier configuré avec succès',
            folderId,
            webhookExpiration: webhookInfo.expiration
        });
    } catch (error) {
        console.error('❌ Erreur lors de la configuration du dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la configuration du dossier'
        });
    }
});

/**
 * @route   GET /api/drive/recordings/:classId
 * @desc    Récupérer les enregistrements d'une classe
 * @access  Private (Professeurs et Étudiants)
 */
router.get('/drive/recordings/:classId', authMiddleware, async (req, res) => {
    try {
        const { classId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const recordings = await ClassRecordings.find({
            classId,
            status: 'active'
        })
        .sort({ added_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

        const total = await ClassRecordings.countDocuments({
            classId,
            status: 'active'
        });

        res.json({
            success: true,
            recordings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des enregistrements:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des enregistrements'
        });
    }
});

/**
 * @route   POST /api/webhooks/google-drive
 * @desc    Webhook pour notifications Google Drive
 * @access  Public (appelé par Google)
 */
router.post('/webhooks/google-drive', async (req, res) => {
    try {
        const channelId = req.headers['x-goog-channel-id'];
        const resourceId = req.headers['x-goog-resource-id'];
        const resourceState = req.headers['x-goog-resource-state'];

        console.log(`📥 Webhook reçu: ${resourceState} pour channel ${channelId}`);

        // Ignorer les notifications de synchronisation
        if (resourceState === 'sync') {
            return res.status(200).send('OK');
        }

        // Trouver le professeur associé à ce webhook
        const teacherTokens = await TeacherTokens.findOne({
            webhook_channel_id: channelId,
            webhook_resource_id: resourceId
        });

        if (!teacherTokens) {
            console.warn('⚠️ Webhook reçu pour un channel inconnu');
            return res.status(404).send('Channel not found');
        }

        // Vérifier si le token est expiré
        if (teacherTokens.isExpired()) {
            const newTokens = await googleDriveOAuth.refreshAccessToken(teacherTokens.refresh_token);
            teacherTokens.access_token = newTokens.access_token;
            teacherTokens.expiry_date = new Date(newTokens.expiry_date);
            await teacherTokens.save();
        }

        // Synchroniser les fichiers
        const tokens = {
            access_token: teacherTokens.access_token,
            refresh_token: teacherTokens.refresh_token,
            expiry_date: teacherTokens.expiry_date.getTime()
        };

        // Trouver la classe associée (simplification: on prend la première classe du prof)
        // À améliorer: stocker classId dans TeacherTokens
        const Course = require('../models/Course');
        const course = await Course.findOne({ instructorId: teacherTokens.teacherId });
        
        if (course) {
            await syncFolderFiles(teacherTokens.teacherId, course._id, tokens, teacherTokens.drive_folder_id);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Erreur lors du traitement du webhook:', error);
        res.status(500).send('Error');
    }
});

/**
 * @route   POST /api/drive/sync-now/:classId
 * @desc    Forcer une synchronisation manuelle
 * @access  Private (Professeurs uniquement)
 */
router.post('/drive/sync-now/:classId', authMiddleware, async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId } = req.params;

        const teacherTokens = await TeacherTokens.findOne({ teacherId });
        if (!teacherTokens || !teacherTokens.drive_folder_id) {
            return res.status(404).json({
                success: false,
                message: 'Aucun dossier Drive configuré'
            });
        }

        // Rafraîchir le token si nécessaire
        if (teacherTokens.isExpired()) {
            const newTokens = await googleDriveOAuth.refreshAccessToken(teacherTokens.refresh_token);
            teacherTokens.access_token = newTokens.access_token;
            teacherTokens.expiry_date = new Date(newTokens.expiry_date);
            await teacherTokens.save();
        }

        const tokens = {
            access_token: teacherTokens.access_token,
            refresh_token: teacherTokens.refresh_token,
            expiry_date: teacherTokens.expiry_date.getTime()
        };

        const result = await syncFolderFiles(teacherId, classId, tokens, teacherTokens.drive_folder_id);

        res.json({
            success: true,
            message: 'Synchronisation terminée',
            ...result
        });
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la synchronisation'
        });
    }
});

/**
 * Fonction helper: Synchroniser les fichiers d'un dossier
 */
async function syncFolderFiles(teacherId, classId, tokens, folderId) {
    try {
        const { files } = await googleDriveOAuth.listFolderFiles(tokens, folderId);

        let newCount = 0;
        let updatedCount = 0;

        for (const file of files) {
            // Vérifier si le fichier existe déjà
            const existing = await ClassRecordings.findOne({ drive_file_id: file.id });

            if (existing) {
                // Mettre à jour si modifié
                if (new Date(file.modifiedTime) > existing.file_modified_at) {
                    existing.title = file.name;
                    existing.size = parseInt(file.size) || 0;
                    existing.file_modified_at = new Date(file.modifiedTime);
                    existing.synced_at = new Date();
                    existing.thumbnail = file.thumbnailLink;
                    existing.webViewLink = file.webViewLink;
                    existing.webContentLink = file.webContentLink;
                    await existing.save();
                    updatedCount++;
                }
            } else {
                // Créer un nouvel enregistrement
                await ClassRecordings.create({
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
                    file_created_at: new Date(file.createdTime),
                    file_modified_at: new Date(file.modifiedTime)
                });
                newCount++;
            }
        }

        // Mettre à jour la date de dernière synchronisation
        await TeacherTokens.findOneAndUpdate(
            { teacherId },
            { last_sync: new Date() }
        );

        console.log(`✅ Synchronisation terminée: ${newCount} nouveaux, ${updatedCount} mis à jour`);

        return { newCount, updatedCount, totalFiles: files.length };
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation des fichiers:', error);
        throw error;
    }
}

module.exports = router;
