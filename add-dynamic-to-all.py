#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour ajouter les scripts dynamiques à toutes les pages HTML
"""

import os
import re
from pathlib import Path

# Dossier des pages
pages_dir = Path(r"d:\files\Eduspace\eduspace-vanilla\pages")

# Compteurs
total = 0
updated = 0
skipped = 0

# Parcourir tous les fichiers HTML
for html_file in pages_dir.rglob("*.html"):
    total += 1
    
    # Lire le contenu
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        print(f"❌ Erreur lecture: {html_file.name}")
        continue
    
    # Vérifier si le script n'est pas déjà présent
    if 'data-manager.js' in content:
        print(f"⏭️  Déjà présent: {html_file.name}")
        skipped += 1
        continue
    
    # Calculer le chemin relatif
    depth = len(html_file.relative_to(pages_dir).parts) - 1
    if depth == 0:
        script_path = "../js/core/data-manager.js"
    else:
        script_path = "../../js/core/data-manager.js"
    
    # Créer la ligne de script
    script_line = f'    <!-- Dynamic System Scripts -->\n    <script src="{script_path}"></script>\n'
    
    # Remplacer avant </body>
    if '</body>' in content:
        new_content = content.replace('</body>', f'{script_line}</body>')
        
        # Sauvegarder
        try:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Mis à jour: {html_file.name}")
            updated += 1
        except Exception as e:
            print(f"❌ Erreur écriture: {html_file.name} - {e}")
    else:
        print(f"⚠️  Pas de </body>: {html_file.name}")

# Résumé
print(f"\n📊 Résumé:")
print(f"Total: {total}")
print(f"Mis à jour: {updated}")
print(f"Déjà présent: {skipped}")
print(f"Non traités: {total - updated - skipped}")
