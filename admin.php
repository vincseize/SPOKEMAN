<?php
// admin.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$configFile = 'config/config.json';
if (!file_exists('config')) mkdir('config', 0777, true);
$config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
$appName = $config['app_name'] ?? 'Media Admin';
$favicon = !empty($config['favicon_url']) ? $config['favicon_url'] : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚙️</text></svg>";

$baseDir = 'uploads/';
if (!file_exists($baseDir)) mkdir($baseDir, 0777, true);

$tagsFile = 'config/tags.json';
$tagsList = file_exists($tagsFile) ? json_decode(file_get_contents($tagsFile), true) : [];

// Extraire les tags avec leurs couleurs pour un accès facile
$tagColors = [];
$tagNamesList = [];
foreach ($tagsList as $tagId => $tagData) {
    if (is_array($tagData)) {
        $tagName = $tagData['name'] ?? $tagId;
        $tagColor = $tagData['color'] ?? '#0d6efd';
        $tagColors[$tagName] = $tagColor;
        $tagNamesList[] = $tagName;
    } else {
        $tagNamesList[] = $tagData;
        $tagColors[$tagData] = '#0d6efd';
    }
}

$mediaTagsFile = 'config/media_tags.json';
$mediaTags = file_exists($mediaTagsFile) ? json_decode(file_get_contents($mediaTagsFile), true) : [];

function cleanName($name) {
    $search = ['À','Á','Â','Ã','Ä','Å','Ç','È','É','Ê','Ë','Ì','Í','Î','Ï','Ò','Ó','Ô','Õ','Ö','Ù','Ú','Û','Ü','Ý','à','á','â','ã','ä','å','ç','è','é','ê','ë','ì','í','î','ï','ð','ò','ó','ô','õ','ö','ù','ú','û','ü','ý','ÿ'];
    $replace = ['A','A','A','A','A','A','C','E','E','E','E','I','I','I','I','O','O','O','O','O','U','U','U','U','Y','a','a','a','a','a','a','c','e','e','e','e','i','i','i','i','o','o','o','o','o','o','u','u','u','u','y','y'];
    return trim(preg_replace('/[^a-zA-Z0-9._\- ]/', '', str_replace($search, $replace, $name)));
}

// --- LOGIQUE POST ---
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
    header("Location: admin.php"); exit;
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
    header("Location: admin.php"); exit;
}

if (isset($_POST['create_folder']) && !empty($_POST['folder_name'])) {
    $folderName = cleanName($_POST['folder_name']);
    if (!file_exists($baseDir . $folderName)) mkdir($baseDir . $folderName, 0777, true);
    header("Location: admin.php"); exit;
}

if (isset($_POST['upload']) && isset($_POST['target_folder'])) {
    foreach ($_FILES['files']['name'] as $k => $v) {
        if ($_FILES['files']['error'][$k] == 0) {
            move_uploaded_file($_FILES['files']['tmp_name'][$k], $_POST['target_folder'] . '/' . cleanName($v));
        }
    }
    header("Location: admin.php"); exit;
}

if (isset($_POST['update_media_tags'])) {
    $filePath = $_POST['file_path'];
    $selectedTags = $mediaTags[$filePath] ?? [];
    
    if (isset($_POST['add_tag'])) {
        $newTag = $_POST['add_tag'];
        if (!in_array($newTag, $selectedTags)) {
            $selectedTags[] = $newTag;
        }
    }
    
    if (isset($_POST['remove_tag'])) {
        $removeTag = $_POST['remove_tag'];
        $selectedTags = array_values(array_filter($selectedTags, function($t) use ($removeTag) {
            return $t !== $removeTag;
        }));
    }
    
    if (empty($selectedTags)) {
        unset($mediaTags[$filePath]);
    } else {
        $mediaTags[$filePath] = $selectedTags;
    }
    
    file_put_contents($mediaTagsFile, json_encode($mediaTags, JSON_UNESCAPED_UNICODE));
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) exit;
    header("Location: admin.php"); exit;
}

if (isset($_POST['delete_file'])) { 
    if (file_exists($_POST['file_path'])) {
        unlink($_POST['file_path']);
        unset($mediaTags[$_POST['file_path']]);
        file_put_contents($mediaTagsFile, json_encode($mediaTags, JSON_UNESCAPED_UNICODE));
    }
    header("Location: admin.php"); exit;
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
    header("Location: admin.php"); exit;
}

$folders = glob($baseDir . '*', GLOB_ONLYDIR);
$rootUrl = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['PHP_SELF']), '/\\') . "/";
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
            <div class="d-flex gap-2">
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
                            <span class="text-warning" style="font-size: 1.2rem;">📁</span>
                            <span class="fw-bold"><?= htmlspecialchars($fName) ?></span>
                            <span class="badge bg-light text-muted border rounded-pill" style="font-size: 0.65rem; font-weight: normal; padding: 2px 8px;">
                                <?= count($files) ?>
                            </span>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <form method="post" class="d-flex align-items-center m-0">
                                <input type="hidden" name="folder_path" value="<?= htmlspecialchars($folder) ?>">
                                <input type="text" name="new_folder_name" class="form-control form-control-sm" style="width: 120px; font-size: 0.75rem;" value="<?= htmlspecialchars($fName) ?>">
                                <button type="submit" name="rename_folder" class="btn btn-sm btn-link p-0 ms-1 text-secondary" title="Renommer">✏️</button>
                            </form>
                            <button type="button" onclick="confirmFolderDelete('<?= addslashes($folder) ?>', '<?= addslashes($fName) ?>')" class="btn btn-sm btn-link text-danger p-0" title="Supprimer le dossier">🗑️</button>
                        </div>
                    </div>
                    <div class="file-list" style="padding: 0;">
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
                                                📋
                                            </button>
                                            <form method="post" class="delete-file-form m-0" onclick="event.stopPropagation();">
                                                <input type="hidden" name="file_path" value="<?= htmlspecialchars($path) ?>">
                                                <button type="submit" name="delete_file" class="btn btn-sm text-danger border-0" title="Supprimer">🗑️</button>
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

    <!-- Charger d'abord admin-modal.js puis admin.js -->
    <script src="js/admin-modal.js?<?= time() ?>"></script>
    <script src="js/admin.js?<?= time() ?>"></script>

</body>
</html>