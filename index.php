<?php
// index.php
include_once 'index-header.php';
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
        <form action="index.php" method="GET" class="d-flex flex-grow-1 justify-content-center px-5">
            <input type="text" name="search" class="form-control form-control-sm" style="max-width: 500px;" placeholder="Rechercher nom ou #tag..." value="<?= htmlspecialchars($searchTerm ?? '') ?>">
            <button type="submit" class="btn btn-light btn-sm ms-2">🔍</button>
        </form>
        <a href="admin.php" class="btn btn-light btn-sm fw-bold">⚙️ Administration</a>
    </div>
</nav>

<div class="container-fluid px-5 pb-5 main-content">
    <?php if ($searchTerm): ?>
        <h5 class="mb-4 text-muted">Résultats pour : "<?= htmlspecialchars($searchTerm) ?>"</h5>
        <div class="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
            <?php
            $found = false;
            $allFolders = glob($baseDir . '*', GLOB_ONLYDIR);
            foreach ($allFolders as $folder) {
                $files = array_diff(scandir($folder), array('.', '..'));
                foreach ($files as $file) {
                    $path = $folder . '/' . $file;
                    $tags = implode(' ', $mediaTags[$path] ?? []);
                    if (strpos(strtolower($file), $searchTerm) !== false || strpos(strtolower($tags), $searchTerm) !== false) {
                        $found = true; renderMediaCard($path, basename($folder));
                    }
                }
            }
            if (!$found) echo "<div class='col-12'><p class='alert alert-info'>Aucun résultat.</p></div>";
            ?>
        </div>
    <?php elseif ($currentFolder && is_dir($baseDir . $currentFolder)): ?>
        <nav aria-label="breadcrumb" class="mb-4">
          <ol class="breadcrumb shadow-sm p-2 bg-white rounded">
            <li class="breadcrumb-item"><a href="index.php" class="text-decoration-none fw-bold">Sets</a></li>
            <li class="breadcrumb-item active text-capitalize"><?= htmlspecialchars($currentFolder); ?></li>
          </ol>
        </nav>
        <div class="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
            <?php
            $files = array_diff(scandir($baseDir . $currentFolder), array('.', '..'));
            foreach ($files as $file) renderMediaCard($baseDir . $currentFolder . '/' . $file);
            ?>
        </div>
    <?php else: ?>
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
            foreach (glob($baseDir . '*', GLOB_ONLYDIR) as $folder) {
                $name = basename($folder);
                $count = count(array_diff(scandir($folder), array('.', '..')));
                echo '<div class="col text-center position-relative folder-card-gal">
                        <div class="card h-100 shadow-sm media-card border-0 position-relative">
                            <div class="position-absolute top-0 start-0 p-2" style="z-index: 5;">
                                <input type="checkbox" class="folder-select-checkbox-gal" data-folder="' . htmlspecialchars($folder) . '" checked style="width: 18px; height: 18px; cursor: pointer;">
                            </div>
                            <a href="zip.php?folder='.urlencode($name).'" class="download-zip" title="Télécharger ZIP">📥 ZIP</a>
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
    <?php endif; ?>
</div>
<?php include 'footer.php'; ?>

<?php include 'index-modal.php'; ?>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
    // Injecter les couleurs des tags depuis PHP (comme dans admin)
    window.tagColors = <?= json_encode($tagColors) ?>;
    console.log("Tag colors chargées pour la galerie:", window.tagColors);
</script>

<script src="js/index.js?<?= time() ?>"></script>
</body>
</html>