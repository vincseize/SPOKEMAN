<?php
// index.php
include_once 'index-header.php';

// Définir $rootUrl (comme dans admin.php)
$rootUrl = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['PHP_SELF']), '/\\') . "/";

// Récupérer les tags depuis l'URL
$tagsParam = isset($_GET['tags']) ? explode(',', $_GET['tags']) : [];
$searchTerm = isset($_GET['search']) ? $_GET['search'] : null;
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($appName) ?></title>
    <link rel="icon" href="<?= $favicon ?>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/index.css?<?= time() ?>">
</head>
<body class="bg-light">

<nav class="navbar navbar-dark bg-primary mb-4 shadow-sm sticky-top">
    <div class="container-fluid px-5">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="index.php">
            <img src="<?= $favicon ?>" alt="Logo" width="28" height="28" class="me-2" style="filter: brightness(0) invert(1);">
            <?= strtoupper(htmlspecialchars($appName)) ?>
        </a>
        <div class="d-flex gap-3 align-items-center">
            <div class="position-relative">
                <input type="text" id="searchInput" class="form-control form-control-sm" 
                       placeholder="Rechercher par nom..." 
                       style="width: 250px; padding-left: 30px; padding-right: 30px;"
                       value="<?= htmlspecialchars($searchTerm ?? '') ?>"
                       onkeyup="filterFiles()">
                <span class="position-absolute start-0 top-50 translate-middle-y ms-2 text-muted" style="font-size: 0.8rem;">🔍</span>
                <button type="button" id="clearSearchBtn" class="btn btn-sm position-absolute end-0 top-50 translate-middle-y me-1 p-0" 
                        style="display: none; background: none; border: none; color: #aaa; font-size: 0.8rem; cursor: pointer;"
                        onclick="clearSearch()">
                    ✕
                </button>
            </div>
            <a href="admin.php" class="btn btn-light btn-sm fw-bold">⚙️ Administration</a>
        </div>
    </div>
</nav>

<div class="container-fluid px-5 pb-5 main-content">
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

    <?php if (!empty($tagsParam) || !empty($searchTerm)): ?>
        <!-- Affichage des résultats de recherche/filtrage -->
        <?php 
        $selectedTagsFromJS = $tagsParam;
        include 'index-search-result.php'; 
        ?>
    <?php elseif ($currentFolder && is_dir($baseDir . $currentFolder)): ?>
        <!-- Affichage d'un dossier spécifique (mode grille) -->
        <?php include 'index-folder-view.php'; ?>
    <?php else: ?>
        <!-- Affichage des dossiers en grille -->
        <?php include 'index-folders-grid.php'; ?>
    <?php endif; ?>
</div>

<?php include 'footer.php'; ?>
<?php include 'index-modal.php'; ?>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
    window.tagColors = <?= json_encode($tagColors) ?>;
    window.selectedTagsFromUrl = <?= json_encode($tagsParam) ?>;
    console.log("Tag colors chargées:", window.tagColors);
    console.log("Tags depuis l'URL:", window.selectedTagsFromUrl);
</script>

<script src="js/index/index-core.js?<?= time() ?>"></script>
<script src="js/index/index-copy.js?<?= time() ?>"></script>
<script src="js/index/index-gallery.js?<?= time() ?>"></script>
<script src="js/index/index-folders.js?<?= time() ?>"></script>
<script src="js/index/index-filters.js?<?= time() ?>"></script>
<script src="js/index/index.js?<?= time() ?>"></script>

</body>
</html>