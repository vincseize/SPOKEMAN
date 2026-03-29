<?php
/**
 * index-search-result.php
 * Affichage des résultats de recherche/filtrage en mode ligne
 * Utilisé par index.php lors des recherches ou filtrages
 */

// S'assurer que $rootUrl est défini
if (!isset($rootUrl)) {
    $rootUrl = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['PHP_SELF']), '/\\') . "/";
}

// Récupérer les tags sélectionnés
$searchTags = isset($selectedTagsFromJS) ? $selectedTagsFromJS : [];
$searchName = isset($searchTerm) ? $searchTerm : '';

// Compter le nombre de résultats
$totalResults = 0;
$resultsByFolder = [];

// Parcourir tous les dossiers pour collecter les résultats
foreach (glob($baseDir . '*', GLOB_ONLYDIR) as $folder) {
    $fName = basename($folder);
    $files = @scandir($folder);
    if ($files === false) $files = [];
    $files = array_diff($files, array('.', '..'));
    
    $folderResults = [];
    
    foreach ($files as $file) {
        $path = $folder . '/' . $file;
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $fullUrl = $rootUrl . $path;
        $currentFileTags = $mediaTags[$path] ?? [];
        if (!is_array($currentFileTags)) $currentFileTags = [];
        
        // Appliquer les filtres
        $isMatch = true;
        
        // Filtre par tags (tous les tags sélectionnés doivent être présents)
        if (!empty($searchTags)) {
            $isMatch = empty(array_diff($searchTags, $currentFileTags));
        }
        
        // Filtre par nom de fichier
        if ($isMatch && !empty($searchName)) {
            $isMatch = stripos($file, $searchName) !== false;
        }
        
        if ($isMatch) {
            $folderResults[] = [
                'path' => $path,
                'file' => $file,
                'ext' => $ext,
                'fullUrl' => $fullUrl,
                'tags' => $currentFileTags
            ];
            $totalResults++;
        }
    }
    
    if (!empty($folderResults)) {
        $resultsByFolder[$fName] = [
            'folder' => $folder,
            'name' => $fName,
            'files' => $folderResults
        ];
    }
}
?>

<?php if ($totalResults === 0): ?>
    <div class="alert alert-info text-center py-4">
        <h5 class="mb-0">Aucun résultat</h5>
        <?php if (!empty($searchTags)): ?>
            <p class="small text-muted mt-2">Aucun fichier ne correspond aux tags : <?= implode(', ', array_map(function($t) { return "#$t"; }, $searchTags)) ?></p>
        <?php elseif (!empty($searchName)): ?>
            <p class="small text-muted mt-2">Aucun fichier ne contient "<?= htmlspecialchars($searchName) ?>"</p>
        <?php endif; ?>
    </div>
<?php else: ?>
    <div class="search-results">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h5 class="fw-bold mb-0">
                    <?= $totalResults ?> résultat<?= $totalResults > 1 ? 's' : '' ?>
                </h5>
                <?php if (!empty($searchTags)): ?>
                    <div class="d-flex flex-wrap gap-2 mt-2">
                        <?php foreach ($searchTags as $tag): 
                            $tagColor = $tagColors[$tag] ?? '#6c757d';
                        ?>
                            <span class="badge" style="background: <?= $tagColor ?>; color: white; font-size: 0.7rem; padding: 4px 10px; border-radius: 20px;">
                                #<?= htmlspecialchars($tag) ?>
                                <button type="button" class="btn-remove-filter-tag" data-tag="<?= htmlspecialchars($tag) ?>" 
                                        style="background: none; border: none; color: white; cursor: pointer; margin-left: 6px; font-size: 0.8rem;">✕</button>
                            </span>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
                <?php if (!empty($searchName)): ?>
                    <span class="badge bg-secondary mt-2">Nom: "<?= htmlspecialchars($searchName) ?>"</span>
                <?php endif; ?>
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="clearAllFilters()">
                ✕ Effacer tout
            </button>
        </div>
        
        <?php foreach ($resultsByFolder as $folderName => $folderData): ?>
            <?php 
            // Construire la query string pour le ZIP avec TOUS les filtres actuels
            $zipParams = [];
            if (!empty($searchName)) {
                $zipParams[] = 'search=' . urlencode($searchName);
            }
            if (!empty($searchTags)) {
                $zipParams[] = 'tags=' . implode(',', $searchTags);
            }
            $zipQuery = !empty($zipParams) ? '&' . implode('&', $zipParams) : '';
            ?>
            <div class="folder-block mb-4 border rounded">
                <div class="folder-title bg-light p-2 px-3 border-bottom">
                    <div class="d-flex align-items-center gap-2">
                        <span class="text-warning">📁</span>
                        <span class="fw-bold"><?= htmlspecialchars($folderName) ?></span>
                        <span class="badge bg-white text-muted border rounded-pill"><?= count($folderData['files']) ?></span>
                        <a href="zip.php?folder=<?= urlencode($folderName) . $zipQuery ?>" class="btn btn-sm btn-outline-secondary ms-auto" title="Télécharger ZIP avec les filtres actuels" style="font-size: 0.7rem; padding: 2px 8px;">
                            📥 ZIP
                        </a>
                    </div>
                </div>
                <div class="file-list" style="padding: 0;">
                    <?php foreach ($folderData['files'] as $file): ?>
                        <div class="file-item-row border-bottom p-2 hover-bg-light" 
                             data-path="<?= htmlspecialchars($file['path']) ?>"
                             data-url="<?= htmlspecialchars($file['fullUrl']) ?>"
                             data-ext="<?= $file['ext'] ?>"
                             data-filename="<?= htmlspecialchars($file['file']) ?>"
                             data-folder="<?= htmlspecialchars($folderData['folder']) ?>"
                             data-tags="<?= htmlspecialchars(implode(' ', $file['tags'])) ?>"
                             style="cursor: pointer; transition: background 0.2s;">
                            
                            <div class="d-flex align-items-center gap-3">
                                <!-- Aperçu miniature -->
                                <div class="preview-trigger" style="width: 40px; height: 40px; flex-shrink: 0;">
                                    <?php if (in_array($file['ext'], ['jpg', 'jpeg', 'png', 'gif', 'webp'])): ?>
                                        <img src="<?= htmlspecialchars($file['path']) ?>" class="rounded border" style="width: 40px; height: 40px; object-fit: cover;">
                                    <?php elseif (in_array($file['ext'], ['mp4', 'webm', 'mov'])): ?>
                                        <div class="bg-dark rounded d-flex align-items-center justify-content-center text-white" style="width: 40px; height: 40px;">🎬</div>
                                    <?php else: ?>
                                        <div class="bg-light rounded d-flex align-items-center justify-content-center border" style="width: 40px; height: 40px;">📄</div>
                                    <?php endif; ?>
                                </div>
                                
                                <!-- Infos fichier -->
                                <div class="flex-grow-1 min-width-0">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="fw-bold small"><?= htmlspecialchars($file['file']) ?></span>
                                    </div>
                                    
                                    <!-- Tags -->
                                    <div class="d-flex flex-wrap gap-1 mt-1">
                                        <?php if (!empty($file['tags'])): ?>
                                            <?php foreach ($file['tags'] as $tagName): 
                                                $tagColor = $tagColors[$tagName] ?? '#6c757d';
                                            ?>
                                                <span class="tag-badge" style="background: <?= $tagColor ?>; color: white; font-size: 0.65rem; padding: 2px 8px; border-radius: 12px;">
                                                    #<?= htmlspecialchars($tagName) ?>
                                                </span>
                                            <?php endforeach; ?>
                                        <?php else: ?>
                                            <span class="text-muted small">Aucun tag</span>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>