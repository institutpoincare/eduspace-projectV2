# Script PowerShell pour ajouter les scripts dynamiques à toutes les pages HTML
# Ajoute data-manager.js à toutes les pages qui ne l'ont pas déjà

$pagesDir = "d:\files\Eduspace\eduspace-vanilla\pages"
$htmlFiles = Get-ChildItem -Path $pagesDir -Recurse -Filter "*.html"

$scriptToAdd = @"
    <!-- Dynamic System Scripts -->
    <script src="../../js/core/data-manager.js"></script>
"@

$count = 0
$updated = 0

foreach ($file in $htmlFiles) {
    $count++
    $content = Get-Content $file.FullName -Raw
    
    # Vérifier si le script n'est pas déjà présent
    if ($content -notmatch "data-manager\.js") {
        # Trouver la position avant </body>
        if ($content -match "</body>") {
            # Calculer le bon chemin relatif selon la profondeur
            $depth = ($file.DirectoryName -replace [regex]::Escape($pagesDir), "").Split('\').Where({ $_ }).Count
            $relativePath = if ($depth -eq 0) { "./js/core/data-manager.js" } 
            elseif ($depth -eq 1) { "../js/core/data-manager.js" }
            else { "../../js/core/data-manager.js" }
            
            $scriptLine = "    <!-- Dynamic System Scripts -->`r`n    <script src=`"$relativePath`"></script>`r`n"
            
            # Insérer avant </body>
            $content = $content -replace "</body>", "$scriptLine</body>"
            
            # Sauvegarder
            $content | Out-File $file.FullName -Encoding UTF8 -NoNewline
            $updated++
            Write-Host "✅ Updated: $($file.Name)" -ForegroundColor Green
        }
    }
    else {
        Write-Host "⏭️  Skipped (already has script): $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "Total files: $count" -ForegroundColor White
Write-Host "Updated: $updated" -ForegroundColor Green
Write-Host "Skipped: $($count - $updated)" -ForegroundColor Yellow
