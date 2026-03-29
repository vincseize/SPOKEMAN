<?php
/**
 * index-folders-grid.php
 * Affichage des dossiers en grille (vue principale)
 */
?>
<div class="mb-4">
    <h4 class="fw-bold mb-3">Mes Sets</h4>
    <div class="d-flex gap-2">
        <button type="button" id="selectAllFoldersGal" class="btn btn-sm btn-outline-secondary" style="font-size: 0.7rem; padding: 4px 12px;">
            ✅ Tout
        </button>
        <button type="button" id="deselectAllFoldersGal" class="btn btn-sm btn-outline-secondary" style="font-size: 0.7rem; padding: 4px 12px;">
            ❌ Aucun
        </button>
    </div>
</div>
<div class="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-4">
    <?php
    // Récupérer les filtres depuis l'URL
    $currentSearch = isset($_GET['search']) ? $_GET['search'] : '';
    $currentTags = isset($_GET['tags']) ? $_GET['tags'] : '';
    
    // Construire la query string pour le ZIP
    $zipParams = [];
    if (!empty($currentSearch)) {
        $zipParams[] = 'search=' . urlencode($currentSearch);
    }
    if (!empty($currentTags)) {
        $zipParams[] = 'tags=' . urlencode($currentTags);
    }
    $zipQuery = !empty($zipParams) ? '&' . implode('&', $zipParams) : '';
    
    foreach (glob($baseDir . '*', GLOB_ONLYDIR) as $folder) {
        $name = basename($folder);
        $count = count(array_diff(scandir($folder), array('.', '..')));
        echo '<div class="col text-center position-relative folder-card-gal">
                <div class="card h-100 shadow-sm media-card border-0 position-relative">
                    <div class="position-absolute top-0 start-0 p-2" style="z-index: 5;">
                        <input type="checkbox" class="folder-select-checkbox-gal" data-folder="' . htmlspecialchars($folder) . '" checked style="width: 18px; height: 18px; cursor: pointer;">
                    </div>
                    <a href="zip.php?folder='.urlencode($name) . $zipQuery .'" class="download-zip" title="Télécharger ZIP">📥 ZIP</a>
                    <a href="index.php?folder='.urlencode($name).'" class="text-decoration-none text-dark p-3">
                        <div class="folder-icon">📁</div>
                        <div class="card-body p-1">
                            <h6 class="card-title text-capitalize mb-0 small fw-bold">'.htmlspecialchars($name).'</h6>
                            <small class="text-muted" style="font-size:0.7rem">'.$count.' fichiers</small>
                        </div>
                    </a>
                </div>
            </div>';
    }
    ?>
</div>