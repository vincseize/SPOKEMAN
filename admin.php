<?php
// admin.php
include_once 'admin-header.php';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="<?= $favicon ?>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/admin.css?<?= time() ?>">
    <link rel="stylesheet" href="css/admin-modal.css?<?= time() ?>">
    <title><?= $appName ?> - Admin</title>
</head>
<body class="bg-light">

<nav class="navbar navbar-dark bg-dark sticky-top shadow-sm mb-4">
    <div class="container-fluid px-5">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="admin.php">
            <img src="<?= $favicon ?>" width="24" height="24" class="me-2" style="filter: brightness(0) invert(1);">
            <?= strtoupper($appName) ?> - Admin
        </a>
        <div class="d-flex gap-3 align-items-center">
            <div class="position-relative">
                <input type="text" id="searchInput" class="form-control form-control-sm" 
                       placeholder="Rechercher par nom..." 
                       style="width: 250px; padding-left: 30px; padding-right: 30px;"
                       onkeyup="filterFiles()">
                <span class="position-absolute start-0 top-50 translate-middle-y ms-2 text-muted" style="font-size: 0.8rem;">🔍</span>
                <button type="button" id="clearSearchBtn" class="btn btn-sm position-absolute end-0 top-50 translate-middle-y me-1 p-0" 
                        style="display: none; background: none; border: none; color: #aaa; font-size: 0.8rem; cursor: pointer;"
                        onclick="clearSearch()">
                    ✕
                </button>
            </div>
            <a href="tags.php" class="btn btn-warning btn-sm fw-bold">🏷️ Tags</a>
            <a href="index.php" class="btn btn-outline-light btn-sm">Galerie</a>
        </div>
    </div>
</nav>

<div class="container-fluid px-5 pb-5">
    <div class="row g-4">
        <!-- Sidebar gauche -->
        <div class="col-lg-3">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body p-3">
                    <h6 class="fw-bold small text-uppercase text-muted mb-3">Nouveau Dossier</h6>
                    <form method="post" class="d-flex gap-2">
                        <input type="text" name="folder_name" class="form-control form-control-sm" required placeholder="Nom...">
                        <button type="submit" name="create_folder" class="btn btn-sm btn-primary">Ok</button>
                    </form>
                </div>
            </div>
            <div class="card border-0 shadow-sm">
                <div class="card-body p-3">
                    <h6 class="fw-bold small text-uppercase text-muted mb-3">Upload</h6>
                    <form method="post" enctype="multipart/form-data">
                        <select name="target_folder" class="form-select form-select-sm mb-2" required>
                            <?php foreach($folders as $f): ?>
                                <option value="<?= htmlspecialchars($f) ?>"><?= htmlspecialchars(basename($f)) ?></option>
                            <?php endforeach; ?>
                        </select>
                        <input type="file" name="files[]" multiple class="form-control form-control-sm mb-3">
                        <button type="submit" name="upload" class="btn btn-sm btn-success w-100 fw-bold">🚀 Envoyer</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Zone principale -->
        <div class="col-lg-9">
            <!-- Barre des tags sélectionnés -->
            <div id="selectedTagsContainer" class="d-flex flex-wrap gap-2 mb-2"></div>
            
            <!-- Barre de tags cliquables -->
            <?php if (!empty($tagNamesList)): ?>
            <div class="tags-cloud mb-3 p-2 bg-white rounded border d-flex flex-wrap gap-2 align-items-center">
                <span class="text-muted small fw-bold">🏷️ Filtres :</span>
                <?php foreach ($tagNamesList as $tagName): 
                    $tagColor = $tagColors[$tagName] ?? '#6c757d';
                ?>
                    <button type="button" class="tag-filter-btn" data-tag="<?= htmlspecialchars($tagName) ?>" 
                            style="background: <?= $tagColor ?>; color: white; border: none; border-radius: 20px; padding: 4px 12px; font-size: 0.7rem; cursor: pointer; transition: all 0.2s;">
                        #<?= htmlspecialchars($tagName) ?>
                    </button>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

<!-- Boutons de sélection/déselection -->
    <div class="d-flex gap-2">
        <button type="button" id="selectAllTags" class="btn btn-sm btn-outline-secondary" style="font-size: 0.65rem; padding: 2px 8px;">
            ✅ Tout
        </button>
        <button type="button" id="deselectAllTags" class="btn btn-sm btn-outline-secondary" style="font-size: 0.65rem; padding: 2px 8px;">
            ❌ Aucun
        </button>
    </div>


            <?php if (empty($folders)): ?>
                <div class="alert alert-info">Aucun dossier. Créez-en un pour commencer.</div>
            <?php endif; ?>

            <?php foreach ($folders as $folder): 
                $fName = basename($folder);
                $files = @scandir($folder);
                if ($files === false) $files = [];
                $files = array_diff($files, array('.', '..'));
            ?>
            <div class="folder-block mb-4">
                <div class="folder-title">
    <div class="d-flex align-items-center gap-2">
        <input type="checkbox" class="folder-select-checkbox" data-folder="<?= htmlspecialchars($folder) ?>" checked style="width: 16px; height: 16px; cursor: pointer;">
        <span class="text-warning" style="font-size: 1.2rem;">📁</span>
        <span class="fw-bold"><?= htmlspecialchars($fName) ?></span>
        <span class="badge bg-white text-muted border border-secondary-subtle rounded-pill" style="font-size: 0.7rem; font-weight: normal; padding: 2px 8px;">
            <?= count($files) ?>
        </span>
    </div>
    <div class="d-flex align-items-center gap-2">
        <form method="post" class="d-flex align-items-center m-0">
            <input type="hidden" name="folder_path" value="<?= htmlspecialchars($folder) ?>">
            <input type="text" name="new_folder_name" class="form-control form-control-sm" style="width: 120px; font-size: 0.75rem;" value="<?= htmlspecialchars($fName) ?>">
            <button type="submit" name="rename_folder" class="btn btn-sm btn-link p-0 ms-1 text-secondary" title="Renommer">✏️</button>
        </form>
        <button type="button" class="btn-delete-folder" onclick="confirmFolderDelete('<?= addslashes($folder) ?>', '<?= addslashes($fName) ?>')" title="Supprimer le dossier">🗑️</button>
    </div>
</div>
                <div class="file-list" style="padding: 0;padding-left: 34px;">
                    <?php foreach ($files as $file): 
                        $path = $folder . '/' . $file;
                        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                        $fullUrl = $rootUrl . $path;
                        $currentFileTags = $mediaTags[$path] ?? [];
                        if (!is_array($currentFileTags)) $currentFileTags = [];
                    ?>
                    <div class="file-item-row border-bottom p-2 hover-bg-light" 
                         data-path="<?= htmlspecialchars($path) ?>"
                         data-url="<?= htmlspecialchars($fullUrl) ?>"
                         data-ext="<?= $ext ?>"
                         data-filename="<?= htmlspecialchars($file) ?>"
                         data-folder="<?= htmlspecialchars($folder) ?>"
                         data-tags="<?= htmlspecialchars(implode(' ', $currentFileTags)) ?>">
                        
                        <div class="d-flex align-items-center gap-3">
                            <!-- Aperçu miniature -->
                            <div class="preview-trigger" style="width: 40px; height: 40px; flex-shrink: 0;">
                                <?php if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])): ?>
                                    <img src="<?= htmlspecialchars($path) ?>" class="rounded border" style="width: 40px; height: 40px; object-fit: cover;">
                                <?php elseif (in_array($ext, ['mp4', 'webm', 'mov'])): ?>
                                    <div class="bg-dark rounded d-flex align-items-center justify-content-center text-white" style="width: 40px; height: 40px;">🎬</div>
                                <?php else: ?>
                                    <div class="bg-light rounded d-flex align-items-center justify-content-center border" style="width: 40px; height: 40px;">📄</div>
                                <?php endif; ?>
                            </div>
                            
                            <!-- Infos fichier + tags -->
                            <div class="flex-grow-1 min-width-0">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="rename-wrapper" style="flex-grow: 1;">
                                        <form method="post" class="m-0 rename-form">
                                            <input type="hidden" name="file_path" value="<?= htmlspecialchars($path) ?>">
                                            <input type="hidden" name="rename_file" value="1">
                                            <input type="text" name="new_name" class="rename-input form-control form-control-sm" 
                                                   style="width: 100%; min-width: 200px;" 
                                                   value="<?= htmlspecialchars(pathinfo($file, PATHINFO_FILENAME)) ?>">
                                        </form>
                                    </div>
                                    
                                    <div class="d-flex align-items-center gap-1">
                                        <button type="button" class="btn-copy-minimal btn btn-sm" 
                                                data-url="<?= htmlspecialchars($fullUrl) ?>" 
                                                title="Copier le lien">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect x="8" y="8" width="16" height="16" rx="1" ry="1"></rect>
                                                <rect x="4" y="4" width="16" height="16" rx="1" ry="1"></rect>
                                            </svg>
                                        </button>
                                        <form method="post" class="delete-file-form m-0" onclick="event.stopPropagation();">
                                            <input type="hidden" name="file_path" value="<?= htmlspecialchars($path) ?>">
                                            <button type="submit" name="delete_file" class="btn btn-sm text-danger border-0" title="Supprimer">✕</button>
                                        </form>
                                    </div>
                                </div>
                                
                                <!-- Tags -->
                                <div class="d-flex flex-wrap gap-1 mt-1">
                                    <?php if (!empty($currentFileTags)): ?>
                                        <?php foreach ($currentFileTags as $tagName): 
                                            $tagColor = $tagColors[$tagName] ?? '#6c757d';
                                        ?>
                                            <div class="tag-item" style="background: <?= $tagColor ?>; color: white; font-size: 0.65rem; padding: 2px 6px 2px 8px;">
                                                <span>#<?= htmlspecialchars($tagName) ?></span>
                                                <button type="button" class="btn-remove-tag-row" data-path="<?= htmlspecialchars($path) ?>" data-tag="<?= htmlspecialchars($tagName) ?>" 
                                                        style="background: none; border: none; color: white; cursor: pointer; font-size: 0.7rem; padding: 0 2px; margin-left: 2px;">
                                                    ✕
                                                </button>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php else: ?>
                                        <span class="text-muted small">Aucun tag</span>
                                    <?php endif; ?>
                                    
                                    <button type="button" class="btn-add-tag-row btn btn-sm btn-outline-primary" data-path="<?= htmlspecialchars($path) ?>" 
                                            style="font-size: 0.6rem; padding: 2px 6px;">
                                        + Ajouter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                    
                    <?php if (empty($files)): ?>
                        <div class="text-muted text-center py-3">Dossier vide</div>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<!-- Modale -->
<?php if(file_exists('admin-modal.php')) include 'admin-modal.php'; ?>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
    // Injecter les couleurs des tags depuis PHP
    window.tagColors = <?= json_encode($tagColors) ?>;
    console.log("Tag colors chargées:", window.tagColors);
</script>

<!-- Charger les modules JS dans l'ordre -->
<script src="js/admin-core.js?<?= time() ?>"></script>
<script src="js/admin-copy.js?<?= time() ?>"></script>
<script src="js/admin-delete.js?<?= time() ?>"></script>
<script src="js/admin-rename.js?<?= time() ?>"></script>
<script src="js/admin-tags.js?<?= time() ?>"></script>
<script src="js/admin-filters.js?<?= time() ?>"></script>
<script src="js/admin-modal.js?<?= time() ?>"></script>
<script src="js/admin.js?<?= time() ?>"></script>

</body>
</html>