/**
 * Modèle MongoDB : Teacher Tokens
 * Stockage sécurisé des tokens OAuth par professeur
 */

const mongoose = require('mongoose');

const teacherTokensSchema = new mongoose.Schema({
    // Référence au professeur
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    // Tokens OAuth 2.0
    access_token: {
        type: String,
        required: true
    },

    refresh_token: {
        type: String,
        required: true
    },

    // Date d'expiration de l'access token
    expiry_date: {
        type: Date,
        required: true,
        index: true
    },

    // Configuration Drive
    drive_folder_id: {
        type: String,
        default: null
    },

    drive_folder_url: {
        type: String,
        default: null
    },

    // Webhook configuration
    webhook_channel_id: {
        type: String,
        default: null
    },

    webhook_resource_id: {
        type: String,
        default: null
    },

    webhook_expiration: {
        type: Date,
        default: null
    },

    // Métadonnées
    last_sync: {
        type: Date,
        default: null
    },

    sync_status: {
        type: String,
        enum: ['active', 'paused', 'error'],
        default: 'active'
    },

    error_message: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index composé pour recherches optimisées
teacherTokensSchema.index({ teacherId: 1, sync_status: 1 });

// Méthode pour vérifier si le token est expiré
teacherTokensSchema.methods.isExpired = function() {
    return Date.now() >= this.expiry_date.getTime();
};

// Méthode pour vérifier si le webhook est expiré
teacherTokensSchema.methods.isWebhookExpired = function() {
    if (!this.webhook_expiration) return true;
    return Date.now() >= this.webhook_expiration.getTime();
};

module.exports = mongoose.model('TeacherTokens', teacherTokensSchema);
