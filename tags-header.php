<?php
// tags-header.php
$configFile = 'config/config.json';
$config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
$appName    = $config['app_name'] ?? 'Media Admin';
$favicon    = !empty($config['favicon_url']) ? $config['favicon_url'] : "img/favicon.svg";

$tagsFile = 'config/tags.json';
$mediaTagsFile = 'config/media_tags.json';

if (!file_exists('config')) mkdir('config', 0777, true);
if (!file_exists($tagsFile)) file_put_contents($tagsFile, json_encode([]));
if (!file_exists($mediaTagsFile)) file_put_contents($mediaTagsFile, json_encode([]));

// Chargement des tags
$tags = json_decode(file_get_contents($tagsFile), true) ?? [];

// Chargement des tags des médias
$mediaTags = json_decode(file_get_contents($mediaTagsFile), true) ?? [];

// Normalisation des chemins dans mediaTags
$normalizedMediaTags = [];
foreach ($mediaTags as $path => $tagsList) {
    $normalizedMediaTags[str_replace('\\', '/', $path)] = $tagsList;
}

// --- LOGIQUE TRAITEMENT ---

// AJOUTER
if (isset($_POST['add_tag']) && !empty($_POST['tag_name'])) {
    $tagName = trim(htmlspecialchars($_POST['tag_name']));
    $tagColor = $_POST['tag_color'] ?? '#0d6efd';
    $tagId = 'tag_' . substr(md5(uniqid()), 0, 8);

    $tags[$tagId] = [
        'name' => $tagName,
        'color' => $tagColor
    ];
    
    uasort($tags, function($a, $b) { return strcmp($a['name'], $b['name']); });
    file_put_contents($tagsFile, json_encode($tags, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    header("Location: tags.php"); exit;
}

// MODIFIER
if (isset($_POST['edit_tag'])) {
    $tagId = $_POST['tag_id'];
    $newName = trim(htmlspecialchars($_POST['new_name']));
    $newColor = $_POST['new_color'];

    if (isset($tags[$tagId])) {
        $oldName = $tags[$tagId]['name'];
        $tags[$tagId]['name'] = $newName;
        $tags[$tagId]['color'] = $newColor;
        
        if ($oldName !== $newName) {
            foreach ($normalizedMediaTags as $path => $tagList) {
                if (in_array($oldName, $tagList)) {
                    $key = array_search($oldName, $tagList);
                    $tagList[$key] = $newName;
                    $normalizedMediaTags[$path] = $tagList;
                }
            }
            file_put_contents($mediaTagsFile, json_encode($normalizedMediaTags, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        }
        
        file_put_contents($tagsFile, json_encode($tags, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
    header("Location: tags.php"); exit;
}

// SUPPRIMER - AVEC VÉRIFICATION D'UTILISATION
if (isset($_GET['delete'])) {
    $idToDelete = $_GET['delete'];
    
    if (isset($tags[$idToDelete])) {
        $tagName = $tags[$idToDelete]['name'];
        
        $usedInFiles = [];
        foreach ($normalizedMediaTags as $path => $tagList) {
            if (in_array($tagName, $tagList)) {
                $folder = basename(dirname($path));
                $filename = basename($path);
                $usedInFiles[] = [
                    'folder' => $folder,
                    'filename' => $filename,
                    'fullpath' => $path
                ];
            }
        }
        
        // Trier par dossier puis par nom de fichier
        usort($usedInFiles, function($a, $b) {
            if ($a['folder'] === $b['folder']) {
                return strcmp($a['filename'], $b['filename']);
            }
            return strcmp($a['folder'], $b['folder']);
        });
        
        if (!empty($usedInFiles)) {
            session_start();
            $_SESSION['delete_tag_warning'] = [
                'tag_name' => $tagName,
                'files' => $usedInFiles,
                'tag_id' => $idToDelete
            ];
            header("Location: tags.php?warning=1");
            exit;
        } else {
            unset($tags[$idToDelete]);
            file_put_contents($tagsFile, json_encode($tags, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            header("Location: tags.php");
            exit;
        }
    }
    header("Location: tags.php"); exit;
}

// CONFIRMER LA SUPPRESSION (après alerte)
if (isset($_POST['confirm_delete_tag'])) {
    $tagId = $_POST['tag_id'];
    $tagName = $_POST['tag_name'];
    
    if (isset($tags[$tagId])) {
        $modified = false;
        foreach ($normalizedMediaTags as $path => $tagList) {
            if (in_array($tagName, $tagList)) {
                $newTagList = array_values(array_filter($tagList, function($t) use ($tagName) {
                    return $t !== $tagName;
                }));
                $normalizedMediaTags[$path] = $newTagList;
                $modified = true;
            }
        }
        
        if ($modified) {
            file_put_contents($mediaTagsFile, json_encode($normalizedMediaTags, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        }
        
        unset($tags[$tagId]);
        file_put_contents($tagsFile, json_encode($tags, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
    
    header("Location: tags.php");
    exit;
}

// Récupérer les infos de warning si présentes
$warningTag = null;
if (isset($_GET['warning']) && session_status() === PHP_SESSION_NONE) {
    session_start();
    if (isset($_SESSION['delete_tag_warning'])) {
        $warningTag = $_SESSION['delete_tag_warning'];
        unset($_SESSION['delete_tag_warning']);
    }
}
?>