# Script PowerShell pour créer index-dynamic.html
# Remplace le contenu statique par des containers dynamiques

$sourceFile = "d:\files\Eduspace\eduspace-vanilla\index.html"
$targetFile = "d:\files\Eduspace\eduspace-vanilla\index-dynamic.html"

# Lire le fichier source
$content = Get-Content $sourceFile -Raw

# 1. Remplacer la grille des formateurs statique par un container dynamique
$instructorsPattern = '(?s)<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">.*?<!-- Instructor Card 1 -->.*?</div>\s*</div>\s*</section>'
$instructorsReplacement = '<div id="instructorsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <!-- Les formateurs seront chargés dynamiquement depuis data/instructors.json -->
                <div class="col-span-full text-center py-12">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p class="text-gray-500 mt-4">Chargement des formateurs...</p>
                </div>
            </div>
        </section>'

# 2. Remplacer les onglets catégories pour qu'ils soient dynamiques
$tabsPattern = '(?s)<div class="flex justify-center gap-4 mb-10 flex-wrap">.*?</div>'
$tabsReplacement = '<div class="flex justify-center gap-4 mb-10 flex-wrap">
                <button data-category="bestseller" class="category-tab px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition-transform active">Les Plus Vendus 🔥</button>
                <button data-category="renowned" class="category-tab px-6 py-2 bg-white text-gray-600 border border-gray-200 rounded-full font-bold hover:bg-gray-50 hover:text-indigo-600 transition-colors">Les Plus Renommés 🏆</button>
                <button data-category="rated" class="category-tab px-6 py-2 bg-white text-gray-600 border border-gray-200 rounded-full font-bold hover:bg-gray-50 hover:text-indigo-600 transition-colors">Les Mieux Notés ⭐</button>
            </div>'

# 3. Ajouter les scripts avant </body>
$scriptsPattern = '(<script src="js/landing-interactions.js"></script>)'
$scriptsReplacement = '<script src="js/core/data-manager.js"></script>
    <script src="js/pages/home.js"></script>
    $1'

# Appliquer les remplacements
$content = $content -replace $instructorsPattern, $instructorsReplacement
$content = $content -replace $tabsPattern, $tabsReplacement
$content = $content -replace $scriptsPattern, $scriptsReplacement

# Sauvegarder
$content | Out-File $targetFile -Encoding UTF8

Write-Host "✅ index-dynamic.html créé avec succès!"
Write-Host "📝 Remplacez index.html par index-dynamic.html pour activer le système dynamique"
