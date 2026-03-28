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

// --- LOGIQUE POST (inchangée) ---
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
    
    // Ajout d'un tag
    if (isset($_POST['add_tag'])) {
        $newTag = $_POST['add_tag'];
        if (!in_array($newTag, $selectedTags)) {
            $selectedTags[] = $newTag;
        }
    }
    
    // Suppression d'un tag
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
            <span>📁 <?= htmlspecialchars($fName) ?></span>
            <span class="badge bg-secondary"><?= count($files) ?> fichier(s)</span>
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
                 data-tags="<?= htmlspecialchars(implode(' ', $currentFileTags)) ?>"
                 style="cursor: pointer; transition: background 0.2s;">
                
                <div class="d-flex align-items-center gap-3">
                    <!-- Aperçu miniature -->
                    <div class="preview-trigger" style="width: 50px; height: 50px; flex-shrink: 0;">
                        <?php if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])): ?>
                            <img src="<?= htmlspecialchars($path) ?>" class="rounded border" style="width: 50px; height: 50px; object-fit: cover;">
                        <?php elseif (in_array($ext, ['mp4', 'webm', 'mov'])): ?>
                            <div class="bg-dark rounded d-flex align-items-center justify-content-center text-white" style="width: 50px; height: 50px;">🎬</div>
                        <?php else: ?>
                            <div class="bg-light rounded d-flex align-items-center justify-content-center border" style="width: 50px; height: 50px;">📄</div>
                        <?php endif; ?>
                    </div>
                    
                    <!-- Infos fichier + tags -->
<div class="flex-grow-1 min-width-0">
    <div class="d-flex align-items-center gap-2 mb-1">
        <div class="rename-container d-flex align-items-center flex-grow-1">
            <form method="post" class="d-flex align-items-center gap-1 m-0 flex-grow-1" id="rename-form-<?= md5($path) ?>" onsubmit="event.stopPropagation();">
                <input type="hidden" name="file_path" value="<?= htmlspecialchars($path) ?>">
                <input type="text" name="new_name" class="rename-input form-control form-control-sm" 
                       style="width: auto; min-width: 150px;" 
                       value="<?= htmlspecialchars(pathinfo($file, PATHINFO_FILENAME)) ?>"
                       onfocus="event.stopPropagation();"
                       onclick="event.stopPropagation();"
                       onkeydown="if(event.key === 'Enter') { this.form.submit(); return false; }">
                <button type="submit" name="rename_file" class="btn-validate" title="Valider" 
                        onclick="event.stopPropagation();"
                        style="background: none; border: none; cursor: pointer; padding: 4px 8px;">
                    ✅
                </button>
            </form>
            <button type="button" class="btn-rename" onclick="event.stopPropagation(); this.previousElementSibling.querySelector('.rename-input').focus();" title="Renommer">
                ✏️
            </button>
        </div>
        
        <button type="button" class="btn-copy-minimal btn btn-sm btn-outline-secondary border-0" 
                onclick="event.stopPropagation(); copyLink('<?= htmlspecialchars($fullUrl) ?>', this)" 
                title="Copier le lien">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        </button>
        
        <form method="post" onsubmit="return confirm('Supprimer ?');" onclick="event.stopPropagation();">
            <input type="hidden" name="file_path" value="<?= htmlspecialchars($path) ?>">
            <button type="submit" name="delete_file" class="btn btn-sm text-danger border-0 opacity-50" title="Supprimer">✕</button>
        </form>
    </div>
    
    <!-- Tags (inchangé) -->
    <div class="tag-checkbox-container d-flex flex-wrap gap-2 align-items-center mt-1">
        <form method="post" class="m-0 d-flex flex-wrap gap-2 tag-auto-form" onclick="event.stopPropagation();">
            <input type="hidden" name="file_path" value="<?= htmlspecialchars($path) ?>">
            <input type="hidden" name="update_media_tags" value="1">
            <?php foreach ($tagNamesList as $tagName): 
                $tagColor = $tagColors[$tagName] ?? '#0d6efd';
                $uniqueId = md5($path . $tagName);
            ?>
                <div class="tag-check-item">
                    <input type="checkbox" name="tags[]" value="<?= htmlspecialchars($tagName) ?>" 
                           id="tag-<?= $uniqueId ?>" class="tag-input-checkbox" 
                           <?= in_array($tagName, $currentFileTags) ? 'checked' : '' ?>>
                    <label for="tag-<?= $uniqueId ?>" class="tag-label-checkbox" style="font-size: 0.65rem; padding: 2px 8px; background: <?= $tagColor ?>; color: white; border-color: <?= $tagColor ?>;">
                        <?= htmlspecialchars($tagName) ?>
                    </label>
                </div>
            <?php endforeach; ?>
        </form>
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
    </div>

    <!-- Modale -->
    <?php if(file_exists('admin-modal.php')) include 'admin-modal.php'; ?>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // Injecter les couleurs des tags depuis PHP
        window.tagColors = <?= json_encode($tagColors) ?>;
        console.log("Tag colors chargées:", window.tagColors);
    </script>
    <script src="js/admin.js?<?= time() ?>"></script>

</body>
</html>