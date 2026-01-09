const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

/**
 * Script de Migration des Données
 * Copie les fichiers JSON de /data/ vers /server/data/
 * Conserve les données existantes et fusionne intelligemment
 */

const OLD_DATA_DIR = path.join(__dirname, 'data');
const NEW_DATA_DIR = path.join(__dirname, 'server', 'data');

async function migrateData() {
    console.log('🔄 Début de la migration des données...\n');

    // Créer le dossier de destination s'il n'existe pas
    if (!fsSync.existsSync(NEW_DATA_DIR)) {
        fsSync.mkdirSync(NEW_DATA_DIR, { recursive: true });
    }

    // Vérifier que le dossier source existe
    if (!fsSync.existsSync(OLD_DATA_DIR)) {
        console.log('⚠️  Le dossier /data/ n\'existe pas encore.');
        console.log('   Aucune migration nécessaire.');
        return;
    }

    // Lister tous les fichiers JSON dans l'ancien dossier
    const files = await fs.readdir(OLD_DATA_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    console.log(`📁 ${jsonFiles.length} fichiers JSON trouvés dans /data/\n`);

    for (const file of jsonFiles) {
        const oldPath = path.join(OLD_DATA_DIR, file);
        const newPath = path.join(NEW_DATA_DIR, file);

        try {
            // Lire les anciennes données
            const oldContent = await fs.readFile(oldPath, 'utf8');
            const oldData = JSON.parse(oldContent);
            
            // Vérifier si le fichier existe déjà dans le nouveau dossier
            let newData = [];
            if (fsSync.existsSync(newPath)) {
                const newContent = await fs.readFile(newPath, 'utf8');
                newData = JSON.parse(newContent);
                console.log(`⚠️  ${file} existe déjà dans /server/data/`);
                
                // Fusionner intelligemment (éviter les doublons par ID)
                if (Array.isArray(oldData) && Array.isArray(newData)) {
                    const existingIds = new Set(newData.map(item => item.id));
                    const newItems = oldData.filter(item => !existingIds.has(item.id));
                    
                    if (newItems.length > 0) {
                        newData = [...newData, ...newItems];
                        console.log(`   ➕ ${newItems.length} nouveaux éléments ajoutés`);
                    } else {
                        console.log(`   ✅ Aucune nouvelle donnée à ajouter`);
                        continue;
                    }
                }
            } else {
                // Nouveau fichier, copie directe
                newData = oldData;
                console.log(`📋 ${file} - Copie complète`);
            }

            // Écrire les données fusionnées
            await fs.writeFile(newPath, JSON.stringify(newData, null, 2), 'utf8');
            console.log(`   ✅ ${file} migré avec succès\n`);

        } catch (error) {
            console.error(`❌ Erreur lors de la migration de ${file}:`, error.message);
        }
    }

    console.log('\n✨ Migration terminée !');
    console.log(`📂 Données disponibles dans: ${NEW_DATA_DIR}`);
    console.log('\n💡 Vous pouvez maintenant démarrer le serveur avec: start_server.bat');
}

// Exécuter la migration
migrateData().catch(console.error);
