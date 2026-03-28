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