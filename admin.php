<?php
// admin.php

$configFile = 'config/config.json';
if (!file_exists('config')) mkdir('config', 0777, true);

$config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
$appName    = $config['app_name'] ?? 'Media Admin';
$favicon    = !empty($config['favicon_url']) ? $config['favicon_url'] : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚙️</text></svg>";

$baseDir = 'uploads/';
if (!file_exists($baseDir)) mkdir($baseDir, 0777, true);

$tagsFile = 'config/tags.json';
$tagsList = file_exists($tagsFile) ? json_decode(file_get_contents($tagsFile), true) : [];
$mediaTagsFile = 'config/media_tags.json';
$mediaTags = file_exists($mediaTagsFile) ? json_decode(file_get_contents($mediaTagsFile), true) : [];

function cleanName($name) {
    $search = ['À','Á','Â','Ã','Ä','Å','Ç','È','É','Ê','Ë','Ì','Í','Î','Ï','Ò','Ó','Ô','Õ','Ö','Ù','Ú','Û','Ü','Ý','à','á','â','ã','ä','å','ç','è','é','ê','ë','ì','í','î','ï','ð','ò','ó','ô','õ','ö','ù','ú','û','ü','ý','ÿ'];
    $replace = ['A','A','A','A','A','A','C','E','E','E','E','I','I','I','I','O','O','O','O','O','U','U','U','U','Y','a','a','a','a','a','a','c','e','e','e','e','i','i','i','i','o','o','o','o','o','o','u','u','u','u','y','y'];
    return trim(preg_replace('/[^a-zA-Z0-9._\- ]/', '', str_replace($search, $replace, $name)));
}

// --- TRAITEMENTS POST ---
if (isset($_POST['rename_folder']) && !empty($_POST['new_folder_name'])) {
    $newName = cleanName($_POST['new_folder_name']);
    $oldPath = $_POST['folder_path'];
    $newPath = $baseDir . $newName;
    if (is_dir($oldPath) && !file_exists($newPath)) {
        rename($oldPath, $newPath);
        $updatedMediaTags = [];
        foreach($mediaTags as $path => $t) {
            $newK = (strpos($path, $oldPath) === 0) ? str_replace($oldPath, $newPath, $path) : $path;
            $updatedMediaTags[$newK] = $t;
        }
        file_put_contents($mediaTagsFile, json_encode($updatedMediaTags, JSON_UNESCAPED_UNICODE));
    }
}

if (isset($_POST['rename_file']) && !empty($_POST['new_name'])) {
    $oldPath = $_POST['file_path'];
    if (file_exists($oldPath)) {
        $info = pathinfo($oldPath);
        $newPath = $info['dirname'] . '/' . cleanName($_POST['new_name']) . (isset($info['extension']) ? '.' . $info['extension'] : '');
        if (!file_exists($newPath)) {
            rename($oldPath, $newPath);
            if (isset($mediaTags[$oldPath])) {
                $mediaTags[$newPath] = $mediaTags[$oldPath];
                unset($mediaTags[$oldPath]);
                file_put_contents($mediaTagsFile, json_encode($mediaTags, JSON_UNESCAPED_UNICODE));
            }
        }
    }
}

if (isset($_POST['create_folder']) && !empty($_POST['folder_name'])) {
    $folderName = cleanName($_POST['folder_name']);
    if (!file_exists($baseDir . $folderName)) mkdir($baseDir . $folderName, 0777, true);
}

if (isset($_POST['upload']) && isset($_POST['target_folder'])) {
    foreach ($_FILES['files']['name'] as $k => $v) {
        if ($_FILES['files']['error'][$k] == 0) move_uploaded_file($_FILES['files']['tmp_name'][$k], $_POST['target_folder'] . '/' . cleanName($v));
    }
}

if (isset($_POST['update_media_tags'])) {
    $filePath = $_POST['file_path'];
    $selectedTags = $_POST['tags'] ?? [];
    if (empty($selectedTags)) unset($mediaTags[$filePath]);
    else $mediaTags[$filePath] = $selectedTags;
    file_put_contents($mediaTagsFile, json_encode($mediaTags, JSON_UNESCAPED_UNICODE));
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') exit;
    header("Location: admin.php"); exit;
}

if (isset($_POST['delete_file'])) { 
    if (file_exists($_POST['file_path'])) {
        unlink($_POST['file_path']);
        unset($mediaTags[$_POST['file_path']]);
        file_put_contents($mediaTagsFile, json_encode($mediaTags, JSON_UNESCAPED_UNICODE));
    }
}

if (isset($_POST['force_delete_folder'])) {
    $path = $_POST['folder_path'];
    if (is_dir($path)) {
        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
        foreach($files as $f) { $f->isDir() ? rmdir($f->getRealPath()) : unlink($f->getRealPath()); }
        rmdir($path);
        $mediaTags = array_filter($mediaTags, function($k) { return file_exists($k); }, ARRAY_FILTER_USE_KEY);
        file_put_contents($mediaTagsFile, json_encode($mediaTags, JSON_UNESCAPED_UNICODE));
    }
}

$folders = glob($baseDir . '*', GLOB_ONLYDIR);
$rootUrl = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['PHP_SELF']), '/\\') . "/";
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <link rel="icon" href="<?= $favicon ?>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/admin.css">
    <title><?= $appName ?> - Admin</title>
</head>
<body class="bg-light d-flex flex-column min-vh-100">

    <div class="content-wrapper flex-grow-1">
        <nav class="navbar navbar-dark bg-dark sticky-top shadow-sm mb-4">
            <div class="container-fluid px-5">
                <a class="navbar-brand fw-bold d-flex align-items-center" href="admin.php">
                    <img src="<?= $favicon ?>" width="24" height="24" class="me-2" style="filter: brightness(0) invert(1);">
                    <?= strtoupper($appName) ?>
                </a>
                <input type="text" id="searchInput" class="form-control form-control-sm w-25" placeholder="Rechercher..." onkeyup="filterFiles()">
                <div class="d-flex gap-2">
                    <a href="tags.php" class="btn btn-warning btn-sm fw-bold">🏷️ Tags</a>
                    <a href="index.php" class="btn btn-outline-light btn-sm">Galerie</a>
                </div>
            </div>
        </nav>

        <div class="container-fluid px-5 pb-5">
            <div class="row g-4">
                <div class="col-lg-3">
                    <div class="card border-0 shadow-sm mb-3">
                        <div class="card-body p-3">
                            <h6 class="fw-bold small text-uppercase text-muted mb-3">Nouveau Dossier</h6>
                            <form method="post" class="d-flex gap-2">
                                <input type="text" name="folder_name" class="form-control form-control-sm" required placeholder="Nom...">
                                <button name="create_folder" class="btn btn-sm btn-primary">Ok</button>
                            </form>
                        </div>
                    </div>
                    <div class="card border-0 shadow-sm sticky-top" style="top: 80px;">
                        <div class="card-body p-3">
                            <h6 class="fw-bold small text-uppercase text-muted mb-3">Upload</h6>
                            <form method="post" enctype="multipart/form-data">
                                <select name="target_folder" class="form-select form-select-sm mb-2" required>
                                    <?php foreach($folders as $f) echo "<option value='$f'>".basename($f)."</option>"; ?>
                                </select>
                                <input type="file" name="files[]" multiple class="form-control form-control-sm mb-3">
                                <button name="upload" class="btn btn-sm btn-success w-100 fw-bold">🚀 Envoyer</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="col-lg-9">
                    <div class="accordion shadow-sm" id="folderAccordion">
                        <?php foreach ($folders as $folder): 
                            $fId = md5($folder); $fName = basename($folder);
                            $files = array_diff(scandir($folder), array('.', '..'));
                        ?>
                        <div class="accordion-item border-0 mb-2 folder-card" data-folder-name="<?= strtolower($fName) ?>">
                            <div class="accordion-header d-flex align-items-center bg-white rounded border shadow-sm px-3 py-2">
                                
                                <span class="me-2 text-warning cursor-pointer" 
                                      data-bs-toggle="collapse" 
                                      data-bs-target="#collapse-<?= $fId ?>" 
                                      style="font-size: 1.2rem; user-select: none;" 
                                      title="Ouvrir/Fermer">📂</span>
                                
                                <div class="flex-grow-1 d-flex align-items-center">
                                    <form method="post" class="d-flex align-items-center m-0">
                                        <input type="hidden" name="folder_path" value="<?= $folder ?>">
                                        <input type="text" name="new_folder_name" class="folder-rename-input" value="<?= $fName ?>">
                                        <button name="rename_folder" class="btn-save ms-1">💾</button>
                                    </form>
                                    <span class="ms-3 badge bg-light text-muted border rounded-pill" style="font-size: 0.7rem;"><?= count($files) ?></span>
                                </div>
                                
                                <div class="d-flex align-items-center gap-2">
                                    <button type="button" onclick="confirmFolderDelete('<?= $fId ?>', '<?= $fName ?>')" class="btn btn-link text-danger p-0 text-decoration-none fw-bold" style="font-size: 1.2rem; line-height: 1;">✕</button>
                                </div>
                            </div>

                            <div id="collapse-<?= $fId ?>" class="accordion-collapse collapse" data-bs-parent="#folderAccordion">
                                <div class="accordion-body p-0 border-top bg-white">
                                    <div class="list-group list-group-flush">
                                        <?php foreach ($files as $file): 
                                            $path = $folder . '/' . $file;
                                            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                                            $fullUrl = $rootUrl . $path;
                                            $currentFileTags = $mediaTags[$path] ?? [];
                                        ?>
                                        <div class="list-group-item d-flex align-items-center gap-3 py-2 file-item" data-file-name="<?= strtolower($file) ?>" data-tags="<?= strtolower(implode(' ', $currentFileTags)) ?>">
                                            
                                            <div class="preview-trigger" onclick="initGallery(this)" data-path="<?= $path ?>" data-url="<?= $fullUrl ?>" data-ext="<?= $ext ?>">
                                                <?php if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])): ?>
                                                    <img src="<?= $path ?>" class="thumb-preview border">
                                                <?php else: ?>
                                                    <div class="icon-preview"><?= strtoupper($ext) ?></div>
                                                <?php endif; ?>
                                            </div>

                                            <div class="flex-grow-1 min-width-0">
                                                <div class="d-flex align-items-center gap-2 mb-1">
                                                    <form method="post" class="d-flex align-items-center gap-2 m-0 flex-grow-1">
                                                        <input type="hidden" name="file_path" value="<?= $path ?>">
                                                        <input type="text" name="new_name" class="rename-input" value="<?= pathinfo($file, PATHINFO_FILENAME) ?>">
                                                        <button name="rename_file" class="btn-save">💾</button>
                                                    </form>
                                                    <button type="button" class="btn-copy-minimal" onclick="copyLink('<?= $fullUrl ?>', this)" title="Copier le lien">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div class="tag-checkbox-container d-flex flex-wrap gap-2 align-items-center mt-1 p-1 border-start">
                                                    <form method="post" class="m-0 d-flex flex-wrap gap-2 tag-auto-form">
                                                        <input type="hidden" name="file_path" value="<?= $path ?>">
                                                        <input type="hidden" name="update_media_tags" value="1">
                                                        <?php foreach ($tagsList as $t): ?>
                                                            <div class="tag-check-item">
                                                                <input type="checkbox" name="tags[]" value="<?= $t ?>" id="tag-<?= md5($path.$t) ?>" class="tag-input-checkbox" <?= in_array($t, $currentFileTags) ? 'checked' : '' ?>>
                                                                <label for="tag-<?= md5($path.$t) ?>" class="tag-label-checkbox" style="font-size: 0.65rem; padding: 1px 6px;"><?= $t ?></label>
                                                            </div>
                                                        <?php endforeach; ?>
                                                    </form>
                                                </div>
                                            </div>

                                            <form method="post" onsubmit="return confirm('Supprimer ?');">
                                                <input type="hidden" name="file_path" value="<?= $path ?>">
                                                <button name="delete_file" class="btn btn-sm text-danger border-0 opacity-50">✕</button>
                                            </form>
                                        </div>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include 'admin-modal.php'; ?>

    <?php include 'footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/admin.js"></script>
</body>
</html>