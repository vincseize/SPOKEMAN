<?php
$configFile = 'config/config.json';
$config = json_decode(file_get_contents($configFile), true);

$appName    = $config['app_name'] ?? 'Galerie Média';
$appVersion = $config['version'] ?? '1.0.0';
$favicon    = !empty($config['favicon_url']) ? $config['favicon_url'] : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🖼️</text></svg>";

$baseDir = 'uploads/';
if (!file_exists($baseDir)) mkdir($baseDir, 0777, true);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title><?= $appName ?></title>
    <link rel="icon" href="<?= $favicon ?>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/index.css">
</head>
<body class="bg-light">

<nav class="navbar navbar-dark bg-primary mb-4 shadow-sm sticky-top">
    <div class="container-fluid px-5">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="index.php">
            <img src="<?= $favicon ?>" alt="Logo" width="28" height="28" class="me-2" style="filter: brightness(0) invert(1);">
            <?= strtoupper($appName) ?>
        </a>
        
        <form action="index.php" method="GET" class="d-flex flex-grow-1 justify-content-center px-5">
            <input type="text" name="search" class="form-control form-control-sm" style="max-width: 500px;" 
                   placeholder="Rechercher un média..." 
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
        <div class="row row-cols-5 g-4">
            <?php
            $found = false;
            $allFolders = glob($baseDir . '*', GLOB_ONLYDIR);
            foreach ($allFolders as $folder) {
                $files = array_diff(scandir($folder), array('.', '..'));
                foreach ($files as $file) {
                    if (strpos(strtolower($file), $searchTerm) !== false) {
                        $found = true;
                        renderMediaCard($folder . '/' . $file, basename($folder));
                    }
                }
            }
            if (!$found) echo "<div class='col-12'><p>Aucun résultat.</p></div>";
            ?>
        </div>

    <?php elseif ($currentFolder && is_dir($baseDir . $currentFolder)): ?>
        <nav aria-label="breadcrumb" class="mb-4">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php" class="text-decoration-none">Sets</a></li>
            <li class="breadcrumb-item active text-capitalize"><?= $currentFolder; ?></li>
          </ol>
        </nav>
        <div class="row row-cols-5 g-4">
            <?php
            $files = array_diff(scandir($baseDir . $currentFolder), array('.', '..'));
            foreach ($files as $file) renderMediaCard($baseDir . $currentFolder . '/' . $file);
            ?>
        </div>

    <?php else: ?>
        <h4 class="mb-4 fw-bold">Mes Sets</h4>
        <div class="row row-cols-6 g-4">
            <?php
            $folders = glob($baseDir . '*', GLOB_ONLYDIR);
            foreach ($folders as $folder) {
                $name = basename($folder);
                $count = count(array_diff(scandir($folder), array('.', '..')));
                echo '
                <div class="col text-center">
                    <div class="card h-100 shadow-sm media-card">
                        <a href="zip.php?folder='.urlencode($name).'" class="download-zip" title="Télécharger le set complet">
                           📥 ZIP
                        </a>

                        <a href="index.php?folder='.urlencode($name).'" class="text-decoration-none text-dark p-3">
                            <div class="folder-icon">📁</div>
                            <div class="card-body p-1">
                                <h6 class="card-title text-capitalize mb-0 small fw-bold">'.$name.'</h6>
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

<?php
function renderMediaCard($path, $folderName = null) {
    $file = basename($path);
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    echo '<div class="col"><div class="card h-100 shadow-sm media-card position-relative">';
    if ($folderName) echo '<span class="badge bg-primary badge-folder">'.$folderName.'</span>';

    if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        echo "<img src='$path' class='card-img-top' style='height:160px; object-fit:cover;'>";
    } elseif (in_array($ext, ['mp4', 'webm'])) {
        echo "<video class='card-img-top' style='height:160px; background:#000;'><source src='$path'></video>";
    } else {
        echo "<div class='d-flex align-items-center justify-content-center bg-secondary text-white fw-bold' style='height:160px;'>$ext</div>";
    }
    echo "<div class='card-body p-2'><p class='card-text small text-truncate mb-0' title='$file'>$file</p></div>";
    echo '</div></div>';
}
?>

<?php include 'footer.php'; ?>
</body>
</html>