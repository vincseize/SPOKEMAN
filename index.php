<?php
/**
 * CONFIGURATION ET CHARGEMENT
 */
$configFile = 'config/config.json';
$tagsDataFile = 'config/tags_data.json'; 

$config = json_decode(file_get_contents($configFile), true);

// Chargement des tags pour le filtrage et l'affichage
$mediaTags = [];
if (file_exists($tagsDataFile)) {
    $mediaTags = json_decode(file_get_contents($tagsDataFile), true);
}

$appName    = $config['app_name'] ?? 'Galerie Média';
$appVersion = $config['version'] ?? '1.0.0';
$favicon    = !empty($config['favicon_url']) ? $config['favicon_url'] : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🖼️</text></svg>";

$baseDir = 'uploads/';
if (!file_exists($baseDir)) mkdir($baseDir, 0777, true);

/**
 * FONCTION DE RENDU DES CARTES
 */
function renderMediaCard($path, $folderName = null) {
    global $mediaTags;
    $file = basename($path);
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
    $rootUrl = $protocol . "://" . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['PHP_SELF']), '/\\') . "/";
    $fullUrl = $rootUrl . $path;

    $currentTags = (isset($mediaTags[$path]) && is_array($mediaTags[$path])) ? implode(' ', $mediaTags[$path]) : '';

    echo '
    <div class="col media-item" data-tags="'.htmlspecialchars(strtolower($currentTags)).'">
        <div class="card h-100 shadow-sm media-card position-relative cursor-pointer" 
             onclick="initGallery(this)" 
             data-path="'.$path.'" 
             data-url="'.$fullUrl.'" 
             data-ext="'.$ext.'">';
    
    if ($folderName) {
        echo '<span class="badge bg-primary badge-folder">'.htmlspecialchars($folderName).'</span>';
    }

    if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        echo "<img src='$path' class='card-img-top' style='height:160px; object-fit:cover;' alt='$file'>";
    } elseif (in_array($ext, ['mp4', 'webm', 'mov'])) {
        echo "<div class='position-relative' style='height:160px; background:#000;'>
                <video class='w-100 h-100' style='object-fit:cover;'><source src='$path'></video>
                <div class='position-absolute top-50 start-50 translate-middle text-white opacity-75'>▶️</div>
              </div>";
    } else {
        echo "<div class='d-flex align-items-center justify-content-center bg-secondary text-white fw-bold text-uppercase' style='height:160px;'>$ext</div>";
    }
    
    echo "
            <div class='card-body p-2'>
                <p class='card-text small text-truncate mb-0' title='".htmlspecialchars($file)."'>$file</p>
            </div>
        </div>
    </div>";
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($appName) ?></title>
    <link rel="icon" href="<?= $favicon ?>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/index.css">
</head>
<body class="bg-light">

<nav class="navbar navbar-dark bg-primary mb-4 shadow-sm sticky-top">
    <div class="container-fluid px-5">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="index.php">
            <img src="<?= $favicon ?>" alt="Logo" width="28" height="28" class="me-2" style="filter: brightness(0) invert(1);">
            <?= strtoupper(htmlspecialchars($appName)) ?>
        </a>
        
        <form action="index.php" method="GET" class="d-flex flex-grow-1 justify-content-center px-5">
            <input type="text" name="search" class="form-control form-control-sm" style="max-width: 500px;" 
                   placeholder="Rechercher par nom ou par tag..." 
                   value="<?= isset($_GET['search']) ? htmlspecialchars($_GET['search']) : ''; ?>">
            <button type="submit" class="btn btn-light btn-sm ms-2">🔍</button>
        </form>

        <a href="admin.php" class="btn btn-light btn-sm fw-bold">⚙️ Administration</a>
    </div>
</nav>

<div class="container-fluid px-5 pb-5 main-content">
    <?php
    $searchTerm = isset($_GET['search']) ? strtolower($_GET['search']) : null;
    $currentFolder = isset($_GET['folder']) ? basename($_GET['folder']) : null;

    if ($searchTerm): ?>
        <h5 class="mb-4 text-muted">Résultats pour : "<?= htmlspecialchars($searchTerm); ?>"</h5>
        <div class="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
            <?php
            $found = false;
            $allFolders = glob($baseDir . '*', GLOB_ONLYDIR);
            foreach ($allFolders as $folder) {
                $files = array_diff(scandir($folder), array('.', '..'));
                foreach ($files as $file) {
                    $path = $folder . '/' . $file;
                    $tags = isset($mediaTags[$path]) ? implode(' ', $mediaTags[$path]) : '';
                    if (strpos(strtolower($file), $searchTerm) !== false || strpos(strtolower($tags), $searchTerm) !== false) {
                        $found = true;
                        renderMediaCard($path, basename($folder));
                    }
                }
            }
            if (!$found) echo "<div class='col-12'><p class='alert alert-info'>Aucun média ne correspond à votre recherche.</p></div>";
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
            foreach ($files as $file) {
                renderMediaCard($baseDir . $currentFolder . '/' . $file);
            }
            ?>
        </div>

    <?php else: ?>
        <h4 class="mb-4 fw-bold">Mes Sets</h4>
        <div class="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-4">
            <?php
            $folders = glob($baseDir . '*', GLOB_ONLYDIR);
            foreach ($folders as $folder) {
                $name = basename($folder);
                $count = count(array_diff(scandir($folder), array('.', '..')));
                echo '
                <div class="col text-center">
                    <div class="card h-100 shadow-sm media-card border-0">
                        <a href="zip.php?folder='.urlencode($name).'" class="download-zip" title="Télécharger le ZIP">📥 ZIP</a>
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

<?php include 'index-modal.php'; ?>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/index.js"></script>

<?php include 'footer.php'; ?>
</body>
</html>