# Script PowerShell pour ajouter data-manager.js à toutes les pages HTML
# Encodage UTF-8 sans BOM

$pagesDir = "d:\files\Eduspace\eduspace-vanilla\pages"
$total = 0
$updated = 0
$skipped = 0

# Récupérer tous les fichiers HTML
$htmlFiles = Get-ChildItem -Path $pagesDir -Recurse -Filter "*.html"

foreach ($file in $htmlFiles) {
    $total++
    
    try {
        # Lire le contenu
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        
        # Vérifier si déjà présent
        if ($content -match "data-manager\.js") {
            Write-Host "Skip: $($file.Name) - deja present" -ForegroundColor Yellow
            $skipped++
            continue
        }
        
        # Calculer la profondeur
        $relativePath = $file.DirectoryName.Replace($pagesDir, "")
        $depth = ($relativePath.Split('\') | Where-Object { $_ -ne "" }).Count
        
        # Déterminer le chemin du script
        if ($depth -eq 0) {
            $scriptPath = "../js/core/data-manager.js"
        }
        else {
            $scriptPath = "../../js/core/data-manager.js"
        }
        
        # Créer la ligne de script
        $scriptLine = "    <!-- Dynamic System Scripts -->`r`n    <script src=`"$scriptPath`"></script>`r`n"
        
        # Remplacer avant </body>
        if ($content -match "</body>") {
            $newContent = $content -replace "</body>", "$scriptLine</body>"
            
            # Sauvegarder
            [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
            Write-Host "OK: $($file.Name)" -ForegroundColor Green
            $updated++
        }
        else {
            Write-Host "Warn: $($file.Name) - pas de balise body" -ForegroundColor Magenta
        }
    }
    catch {
        Write-Host "Error: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Résumé
Write-Host "`n=== RESUME ===" -ForegroundColor Cyan
Write-Host "Total fichiers: $total" -ForegroundColor White
Write-Host "Mis a jour: $updated" -ForegroundColor Green
Write-Host "Deja present: $skipped" -ForegroundColor Yellow
Write-Host "Non traites: $($total - $updated - $skipped)" -ForegroundColor Red
