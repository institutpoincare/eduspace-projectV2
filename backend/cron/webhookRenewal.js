/**
 * Cron Job : Renouvellement Automatique des Webhooks
 * Les webhooks Google Drive expirent après 24h
 */

const cron = require('node-cron');
const TeacherTokens = require('../models/TeacherTokens');
const googleDriveOAuth = require('../services/GoogleDriveOAuth');

/**
 * Renouveler tous les webhooks expirés ou proches de l'expiration
 */
async function renewWebhooks() {
    try {
        console.log('🔄 Démarrage du renouvellement des webhooks...');

        // Trouver tous les tokens avec webhooks actifs
        const expirationThreshold = new Date(Date.now() + (2 * 60 * 60 * 1000)); // 2 heures avant expiration
        
        const teacherTokens = await TeacherTokens.find({
            webhook_channel_id: { $ne: null },
            webhook_expiration: { $lte: expirationThreshold },
            sync_status: 'active'
        });

        console.log(`📊 ${teacherTokens.length} webhooks à renouveler`);

        let successCount = 0;
        let errorCount = 0;

        for (const tokens of teacherTokens) {
            try {
                // Vérifier si le token est expiré
                if (tokens.isExpired()) {
                    const newTokens = await googleDriveOAuth.refreshAccessToken(tokens.refresh_token);
                    tokens.access_token = newTokens.access_token;
                    tokens.expiry_date = new Date(newTokens.expiry_date);
                }

                const oauthTokens = {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiry_date: tokens.expiry_date.getTime()
                };

                // Arrêter l'ancien webhook
                if (tokens.webhook_channel_id && tokens.webhook_resource_id) {
                    try {
                        await googleDriveOAuth.stopWatch(
                            oauthTokens,
                            tokens.webhook_channel_id,
                            tokens.webhook_resource_id
                        );
                    } catch (error) {
                        console.warn(`⚠️ Impossible d'arrêter l'ancien webhook: ${error.message}`);
                    }
                }

                // Créer un nouveau webhook
                const webhookUrl = `${process.env.APP_URL}/api/webhooks/google-drive`;
                const webhookInfo = await googleDriveOAuth.watchFolder(
                    oauthTokens,
                    tokens.drive_folder_id,
                    webhookUrl
                );

                // Mettre à jour les informations
                tokens.webhook_channel_id = webhookInfo.channelId;
                tokens.webhook_resource_id = webhookInfo.resourceId;
                tokens.webhook_expiration = new Date(parseInt(webhookInfo.expiration));
                await tokens.save();

                successCount++;
                console.log(`✅ Webhook renouvelé pour professeur ${tokens.teacherId}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Erreur pour professeur ${tokens.teacherId}:`, error.message);
                
                // Marquer comme erreur
                tokens.sync_status = 'error';
                tokens.error_message = error.message;
                await tokens.save();
            }
        }

        console.log(`✅ Renouvellement terminé: ${successCount} succès, ${errorCount} erreurs`);
    } catch (error) {
        console.error('❌ Erreur lors du renouvellement des webhooks:', error);
    }
}

/**
 * Synchronisation de secours (polling)
 * En cas d'échec des webhooks
 */
async function fallbackSync() {
    try {
        console.log('🔄 Démarrage de la synchronisation de secours...');

        const teacherTokens = await TeacherTokens.find({
            drive_folder_id: { $ne: null },
            sync_status: 'active'
        });

        console.log(`📊 ${teacherTokens.length} dossiers à synchroniser`);

        for (const tokens of teacherTokens) {
            try {
                // Vérifier si le token est expiré
                if (tokens.isExpired()) {
                    const newTokens = await googleDriveOAuth.refreshAccessToken(tokens.refresh_token);
                    tokens.access_token = newTokens.access_token;
                    tokens.expiry_date = new Date(newTokens.expiry_date);
                    await tokens.save();
                }

                const oauthTokens = {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiry_date: tokens.expiry_date.getTime()
                };

                // Synchroniser les fichiers
                const ClassRecordings = require('../models/ClassRecordings');
                const Course = require('../models/Course');
                
                const course = await Course.findOne({ instructorId: tokens.teacherId });
                if (!course) continue;

                const { files } = await googleDriveOAuth.listFolderFiles(
                    oauthTokens,
                    tokens.drive_folder_id,
                    { pageSize: 50 }
                );

                let newCount = 0;

                for (const file of files) {
                    const existing = await ClassRecordings.findOne({ drive_file_id: file.id });
                    
                    if (!existing) {
                        await ClassRecordings.create({
                            classId: course._id,
                            teacherId: tokens.teacherId,
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

                if (newCount > 0) {
                    console.log(`✅ ${newCount} nouveaux fichiers pour professeur ${tokens.teacherId}`);
                }

                tokens.last_sync = new Date();
                await tokens.save();
            } catch (error) {
                console.error(`❌ Erreur pour professeur ${tokens.teacherId}:`, error.message);
            }
        }

        console.log('✅ Synchronisation de secours terminée');
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation de secours:', error);
    }
}

/**
 * Initialiser les cron jobs
 */
function initCronJobs() {
    // Renouvellement des webhooks toutes les 20 heures
    const webhookInterval = process.env.WEBHOOK_RENEWAL_INTERVAL || 20;
    cron.schedule(`0 */${webhookInterval} * * *`, renewWebhooks);
    console.log(`⏰ Cron job de renouvellement des webhooks configuré (toutes les ${webhookInterval}h)`);

    // Synchronisation de secours toutes les 30 minutes
    const syncInterval = process.env.FALLBACK_SYNC_INTERVAL || 30;
    cron.schedule(`*/${syncInterval} * * * *`, fallbackSync);
    console.log(`⏰ Cron job de synchronisation de secours configuré (toutes les ${syncInterval}min)`);

    // Exécuter immédiatement au démarrage
    setTimeout(renewWebhooks, 5000); // 5 secondes après le démarrage
}

module.exports = { initCronJobs, renewWebhooks, fallbackSync };
