/**
 * Middleware d'Authentification
 * Vérifie le JWT et charge les informations utilisateur
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification principal
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Récupérer le token depuis le header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification manquant'
            });
        }

        const token = authHeader.substring(7); // Enlever "Bearer "

        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Charger l'utilisateur (à adapter selon votre modèle User)
        const User = require('../models/User');
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Attacher l'utilisateur à la requête
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré'
            });
        }

        console.error('❌ Erreur d\'authentification:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

/**
 * Middleware pour vérifier le rôle professeur
 */
const requireTeacher = (req, res, next) => {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Accès réservé aux professeurs'
        });
    }
    next();
};

/**
 * Middleware pour vérifier la propriété d'une classe
 */
const requireClassOwnership = async (req, res, next) => {
    try {
        const classId = req.params.classId || req.body.classId;
        
        if (!classId) {
            return res.status(400).json({
                success: false,
                message: 'ID de classe manquant'
            });
        }

        const Course = require('../models/Course');
        const course = await Course.findById(classId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée'
            });
        }

        // Vérifier que l'utilisateur est le propriétaire
        if (course.instructorId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à modifier cette classe'
            });
        }

        req.course = course;
        next();
    } catch (error) {
        console.error('❌ Erreur de vérification de propriété:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

module.exports = {
    authMiddleware,
    requireTeacher,
    requireClassOwnership
};
