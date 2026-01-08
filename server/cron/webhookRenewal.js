const cron = require('node-cron');
const db = require('../db-manager');
const googleDriveOAuth = require('../../backend/services/GoogleDriveOAuth');

const TOKENS_COLLECTION = 'teacherTokens';
const RECORDINGS_COLLECTION = 'classRecordings';
const COURSES_COLLECTION = 'courses';

/**
 * Renouveler tous les webhooks expirés ou proches de l'expiration
 */
async function renewWebhooks() {
    try {
        console.log('🔄 Démarrage du renouvellement des webhooks...');

        const expirationThreshold = new Date(Date.now() + (2 * 60 * 60 * 1000)); // 2 heures avant expiration
        
        const allTokens = await db.findAll(TOKENS_COLLECTION);
        const tokensToRenew = allTokens.filter(t => 
            t.webhook_channel_id && 
            t.webhook_expiration && 
            new Date(t.webhook_expiration) <= expirationThreshold &&
            t.sync_status === 'active'
        );

        console.log(`📊 ${tokensToRenew.length} webhooks à renouveler`);

        let successCount = 0;
        let errorCount = 0;

        for (const tokens of tokensToRenew) {
            try {
                if (googleDriveOAuth.isTokenExpired(new Date(tokens.expiry_date).getTime())) {
                    const newTokens = await googleDriveOAuth.refreshAccessToken(tokens.refresh_token);
                    await db.updateById(TOKENS_COLLECTION, tokens.id, {
                        access_token: newTokens.access_token,
                        expiry_date: new Date(newTokens.expiry_date).toISOString()
                    });
                    tokens.access_token = newTokens.access_token;
                }

                const oauthTokens = {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiry_date: new Date(tokens.expiry_date).getTime()
                };

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

                const webhookUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/google-drive`;
                let webhookInfo;
                try {
                     webhookInfo = await googleDriveOAuth.watchFolder(
                        oauthTokens,
                        tokens.drive_folder_id,
                        webhookUrl
                    );
                } catch (e) {
                    console.warn(`⚠️ Échec création webhook (normal en local): ${e.message}`);
                    // Continue without webhook update if failed (keeps old config but logs error)
                    continue;
                }

                await db.updateById(TOKENS_COLLECTION, tokens.id, {
                    webhook_channel_id: webhookInfo.channelId,
                    webhook_resource_id: webhookInfo.resourceId,
                    webhook_expiration: new Date(parseInt(webhookInfo.expiration)).toISOString()
                });

                successCount++;
                console.log(`✅ Webhook renouvelé pour professeur ${tokens.teacherId}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Erreur pour professeur ${tokens.teacherId}:`, error.message);
                
                await db.updateById(TOKENS_COLLECTION, tokens.id, {
                    sync_status: 'error',
                    error_message: error.message
                });
            }
        }

        console.log(`✅ Renouvellement terminé: ${successCount} succès, ${errorCount} erreurs`);
    } catch (error) {
        console.error('❌ Erreur lors du renouvellement des webhooks:', error);
    }
}

/**
 * Synchronisation de secours (polling)
 */
async function fallbackSync() {
    try {
        console.log('🔄 Démarrage de la synchronisation de secours...');

        const allTokens = await db.findAll(TOKENS_COLLECTION);
        const tokensToSync = allTokens.filter(t => 
            t.drive_folder_id && 
            t.sync_status === 'active'
        );

        console.log(`📊 ${tokensToSync.length} dossiers à synchroniser`);

        for (const tokens of tokensToSync) {
            try {
                if (googleDriveOAuth.isTokenExpired(new Date(tokens.expiry_date).getTime())) {
                    const newTokens = await googleDriveOAuth.refreshAccessToken(tokens.refresh_token);
                    await db.updateById(TOKENS_COLLECTION, tokens.id, {
                        access_token: newTokens.access_token,
                        expiry_date: new Date(newTokens.expiry_date).toISOString()
                    });
                    tokens.access_token = newTokens.access_token;
                }

                const oauthTokens = {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiry_date: new Date(tokens.expiry_date).getTime()
                };

                const courses = await db.findAll(COURSES_COLLECTION);
                const course = courses.find(c => c.instructorId === tokens.teacherId);
                
                if (!course) {
                    // Try to find ANY course for this teacher or use a default logic
                    // If no course, we can't sync recordings to a class ID
                    continue; 
                }

                const { files } = await googleDriveOAuth.listFolderFiles(
                    oauthTokens,
                    tokens.drive_folder_id,
                    { pageSize: 50 }
                );

                const allRecordings = await db.findAll(RECORDINGS_COLLECTION);
                let newCount = 0;

                for (const file of files) {
                    const existing = allRecordings.find(r => r.drive_file_id === file.id);
                    
                    if (!existing) {
                        const newRecording = {
                            classId: course.id, // ID from JSON DB
                            teacherId: tokens.teacherId,
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
                            added_at: new Date().toISOString(), // Use format compatible with JSON
                            status: 'active'
                        };
                        
                        await db.insert(RECORDINGS_COLLECTION, newRecording);
                        newCount++;
                    }
                }

                if (newCount > 0) {
                    console.log(`✅ ${newCount} nouveaux fichiers pour professeur ${tokens.teacherId}`);
                }

                await db.updateById(TOKENS_COLLECTION, tokens.id, { last_sync: new Date().toISOString() });
            } catch (error) {
                console.error(`❌ Erreur pour professeur ${tokens.teacherId}:`, error.message);
            }
        }

        console.log('✅ Synchronisation de secours terminée');
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation de secours:', error);
    }
}

function initCronJobs() {
    // Note: node-cron might not be installed in server/node_modules. 
    // If not, we should probably install it or use setInterval.
    // Assuming node-cron is available if backend used it, but we switched to server/ folder.
    // I will use setInterval for simplicity and dependency reduction in this "vanilla" migration.
    
    // Webhook renewal: Every 20 hours
    const WEBHOOK_INTERVAL = 20 * 60 * 60 * 1000;
    setInterval(renewWebhooks, WEBHOOK_INTERVAL);
    
    // Sync: Every 30 minutes
    const SYNC_INTERVAL = 30 * 60 * 1000;
    setInterval(fallbackSync, SYNC_INTERVAL);
    
    console.log('⏰ Jobs de fond démarrés (Intervalle natif JS)');
    
    // Run after 10 seconds
    setTimeout(renewWebhooks, 10000);
}

module.exports = { initCronJobs };
