/**
 * Modèle MongoDB : Class Recordings
 * Stockage des enregistrements synchronisés depuis Google Drive
 */

const mongoose = require('mongoose');

const classRecordingsSchema = new mongoose.Schema({
    // Référence à la classe
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },

    // Référence au professeur
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Informations Google Drive
    drive_file_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Métadonnées du fichier
    title: {
        type: String,
        required: true
    },

    url: {
        type: String,
        required: true
    },

    webViewLink: {
        type: String,
        required: true
    },

    webContentLink: {
        type: String,
        default: null
    },

    thumbnail: {
        type: String,
        default: null
    },

    // Détails techniques
    size: {
        type: Number,
        default: 0
    },

    mimeType: {
        type: String,
        required: true
    },

    duration: {
        type: Number, // en secondes
        default: null
    },

    // Dates importantes
    file_created_at: {
        type: Date,
        required: true
    },

    file_modified_at: {
        type: Date,
        required: true
    },

    added_at: {
        type: Date,
        default: Date.now,
        index: true
    },

    synced_at: {
        type: Date,
        default: Date.now
    },

    // Statut
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active',
        index: true
    },

    // Statistiques (optionnel)
    views_count: {
        type: Number,
        default: 0
    },

    last_viewed_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index composés pour recherches optimisées
classRecordingsSchema.index({ classId: 1, status: 1, added_at: -1 });
classRecordingsSchema.index({ teacherId: 1, added_at: -1 });

// Méthode pour formater la taille du fichier
classRecordingsSchema.methods.getFormattedSize = function() {
    const bytes = this.size;
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Méthode pour formater la durée
classRecordingsSchema.methods.getFormattedDuration = function() {
    if (!this.duration) return 'N/A';
    
    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = this.duration % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
};

// Méthode pour incrémenter les vues
classRecordingsSchema.methods.incrementViews = async function() {
    this.views_count += 1;
    this.last_viewed_at = new Date();
    await this.save();
};

module.exports = mongoose.model('ClassRecordings', classRecordingsSchema);
