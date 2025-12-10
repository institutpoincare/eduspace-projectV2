# Script PowerShell pour créer index-complete.html avec 12 formateurs et 6 centres

$sourceFile = "d:\files\Eduspace\eduspace-vanilla\index.html"
$targetFile = "d:\files\Eduspace\eduspace-vanilla\index-complete.html"
$additionalInstructorsFile = "d:\files\Eduspace\eduspace-vanilla\additional-instructors.html"
$additionalCentersFile = "d:\files\Eduspace\eduspace-vanilla\additional-centers.html"

# Lire le fichier source
$content = Get-Content $sourceFile -Raw

# Trouver la position où insérer les nouveaux formateurs (après la carte de Karim, avant </div></section>)
$instructorsInsertPoint = $content.IndexOf("</div>`r`n            </div>`r`n        </section>`r`n`r`n        <!-- TOP CENTERS -->")

# Trouver la position où insérer les nouveaux centres (après 3W Academy, avant </div></section>)
$centersInsertPoint = $content.IndexOf("</div>`r`n            </div>`r`n        </section>`r`n    </main>")

# Lire les fichiers additionnels
$additionalInstructors = Get-Content $additionalInstructorsFile -Raw
$additionalCenters = Get-Content $additionalCentersFile -Raw

# Insérer les nouveaux formateurs
$part1 = $content.Substring(0, $instructorsInsertPoint)
$part2 = $content.Substring($instructorsInsertPoint)
$contentWithInstructors = $part1 + $additionalInstructors + "`r`n" + $part2

# Insérer les nouveaux centres
$centersInsertPoint = $contentWithInstructors.IndexOf("</div>`r`n            </div>`r`n        </section>`r`n    </main>")
$part1 = $contentWithInstructors.Substring(0, $centersInsertPoint)
$part2 = $contentWithInstructors.Substring($centersInsertPoint)
$finalContent = $part1 + $additionalCenters + "`r`n" + $part2

# Écrire le fichier final
$finalContent | Out-File $targetFile -Encoding UTF8

Write-Host "✅ Fichier index-complete.html créé avec succès!"
Write-Host "📊 12 formateurs et 6 centres intégrés"
