/**
 * Service Google Drive OAuth 2.0
 * Gestion complète de l'authentification OAuth pour EduSpace
 * Compatible avec la restriction "iam.disableServiceAccountKeyCreation"
 */

const { google } = require('googleapis');
const crypto = require('crypto');

class GoogleDriveOAuth {
    constructor() {
        // Configuration OAuth 2.0 depuis variables d'environnement
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
        
        // Scopes nécessaires pour Drive
        this.scopes = [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.metadata.readonly'
        ];

        // Initialiser le client OAuth2
        this.oauth2Client = new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
            this.redirectUri
        );
    }

    /**
     * Générer l'URL d'autorisation Google OAuth
     * @param {string} teacherId - ID du professeur
     * @returns {string} URL d'autorisation
     */
    getAuthUrl(teacherId) {
        // Générer un state token sécurisé pour CSRF protection
        const state = crypto.randomBytes(32).toString('hex');
        
        // Stocker temporairement le state avec teacherId (à implémenter en session/Redis)
        // Pour simplification, on encode teacherId dans le state
        const stateData = Buffer.from(JSON.stringify({
            teacherId,
            timestamp: Date.now(),
            random: state
        })).toString('base64');

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // Pour obtenir refresh_token
            scope: this.scopes,
            state: stateData,
            prompt: 'consent' // Force l'affichage du consentement pour refresh_token
        });
    }

    /**
     * Échanger le code d'autorisation contre des tokens
     * @param {string} code - Code d'autorisation de Google
     * @returns {Promise<Object>} Tokens (access_token, refresh_token, expiry_date)
     */
    async getTokens(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            return tokens;
        } catch (error) {
            console.error('❌ Erreur lors de l\'échange du code:', error);
            throw new Error('Impossible d\'obtenir les tokens Google');
        }
    }

    /**
     * Rafraîchir l'access token avec le refresh token
     * @param {string} refreshToken - Refresh token stocké
     * @returns {Promise<Object>} Nouveaux tokens
     */
    async refreshAccessToken(refreshToken) {
        try {
            this.oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            const { credentials } = await this.oauth2Client.refreshAccessToken();
            return credentials;
        } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement du token:', error);
            throw new Error('Impossible de rafraîchir le token');
        }
    }

    /**
     * Obtenir un client Drive authentifié
     * @param {Object} tokens - Tokens OAuth
     * @returns {Object} Client Google Drive API
     */
    getDriveClient(tokens) {
        this.oauth2Client.setCredentials(tokens);
        return google.drive({ version: 'v3', auth: this.oauth2Client });
    }

    /**
     * Lister les fichiers d'un dossier Drive
     * @param {Object} tokens - Tokens OAuth
     * @param {string} folderId - ID du dossier Drive
     * @param {Object} options - Options de pagination
     * @returns {Promise<Array>} Liste des fichiers
     */
    async listFolderFiles(tokens, folderId, options = {}) {
        try {
            const drive = this.getDriveClient(tokens);
            
            const response = await drive.files.list({
                q: `'${folderId}' in parents and trashed=false`,
                fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webViewLink, webContentLink)',
                orderBy: 'createdTime desc',
                pageSize: options.pageSize || 100,
                pageToken: options.pageToken || null
            });

            return {
                files: response.data.files,
                nextPageToken: response.data.nextPageToken
            };
        } catch (error) {
            console.error('❌ Erreur lors de la liste des fichiers:', error);
            throw new Error('Impossible de lister les fichiers du dossier');
        }
    }

    /**
     * Obtenir les métadonnées d'un fichier
     * @param {Object} tokens - Tokens OAuth
     * @param {string} fileId - ID du fichier
     * @returns {Promise<Object>} Métadonnées du fichier
     */
    async getFileMetadata(tokens, fileId) {
        try {
            const drive = this.getDriveClient(tokens);
            
            const response = await drive.files.get({
                fileId: fileId,
                fields: 'id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webViewLink, webContentLink'
            });

            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des métadonnées:', error);
            throw new Error('Impossible de récupérer les métadonnées du fichier');
        }
    }

    /**
     * Configurer un webhook pour surveiller un dossier
     * @param {Object} tokens - Tokens OAuth
     * @param {string} folderId - ID du dossier à surveiller
     * @param {string} webhookUrl - URL du webhook
     * @returns {Promise<Object>} Informations du webhook
     */
    async watchFolder(tokens, folderId, webhookUrl) {
        try {
            const drive = this.getDriveClient(tokens);
            
            // Générer un ID unique pour le channel
            const channelId = crypto.randomUUID();
            
            const response = await drive.files.watch({
                fileId: folderId,
                requestBody: {
                    id: channelId,
                    type: 'web_hook',
                    address: webhookUrl,
                    expiration: Date.now() + (24 * 60 * 60 * 1000) // 24 heures
                }
            });

            return {
                channelId: response.data.id,
                resourceId: response.data.resourceId,
                expiration: response.data.expiration
            };
        } catch (error) {
            console.error('❌ Erreur lors de la configuration du webhook:', error);
            throw new Error('Impossible de configurer le webhook Drive');
        }
    }

    /**
     * Arrêter un webhook
     * @param {Object} tokens - Tokens OAuth
     * @param {string} channelId - ID du channel
     * @param {string} resourceId - ID de la ressource
     * @returns {Promise<void>}
     */
    async stopWatch(tokens, channelId, resourceId) {
        try {
            const drive = this.getDriveClient(tokens);
            
            await drive.channels.stop({
                requestBody: {
                    id: channelId,
                    resourceId: resourceId
                }
            });

            console.log('✅ Webhook arrêté avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt du webhook:', error);
            throw new Error('Impossible d\'arrêter le webhook');
        }
    }

    /**
     * Extraire l'ID d'un dossier depuis une URL Drive
     * @param {string} url - URL du dossier Drive
     * @returns {string|null} ID du dossier
     */
    extractFolderId(url) {
        // Formats supportés:
        // https://drive.google.com/drive/folders/FOLDER_ID
        // https://drive.google.com/drive/u/0/folders/FOLDER_ID
        const patterns = [
            /\/folders\/([a-zA-Z0-9_-]+)/,
            /id=([a-zA-Z0-9_-]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Vérifier si un token est expiré
     * @param {number} expiryDate - Date d'expiration (timestamp)
     * @returns {boolean} True si expiré
     */
    isTokenExpired(expiryDate) {
        return Date.now() >= expiryDate;
    }

    /**
     * Décoder le state token
     * @param {string} state - State encodé
     * @returns {Object} Données décodées
     */
    decodeState(state) {
        try {
            const decoded = Buffer.from(state, 'base64').toString('utf-8');
            return JSON.parse(decoded);
        } catch (error) {
            console.error('❌ Erreur lors du décodage du state:', error);
            return null;
        }
    }
}

module.exports = new GoogleDriveOAuth();
