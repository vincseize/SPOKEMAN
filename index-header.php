<?php
// index-header.php

$configFile = 'config/config.json';
$mediaTagsFile = 'config/media_tags.json';
$tagsFile = 'config/tags.json'; // Ajout du fichier des tags

$config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];

$mediaTags = [];
if (file_exists($mediaTagsFile)) {
    $rawTags = json_decode(file_get_contents($mediaTagsFile), true);
    // Normalisation des clés pour éviter les problèmes de slashes \ vs /
    if (is_array($rawTags)) {
        foreach ($rawTags as $key => $value) {
            $mediaTags[str_replace('\\', '/', $key)] = $value;
        }
    }
}

// Charger la liste des tags
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

$searchTerm = isset($_GET['search']) ? strtolower($_GET['search']) : null;
$currentFolder = isset($_GET['folder']) ? basename($_GET['folder']) : null;

$appName = $config['app_name'] ?? 'Galerie Média';
$favicon = !empty($config['favicon_url']) ? $config['favicon_url'] : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🖼️</text></svg>";
$baseDir = 'uploads/';

/**
 * FONCTION DE RENDU DES CARTES
 */
function renderMediaCard($path, $folderName = null) {
    global $mediaTags, $tagColors; // Ajout de $tagColors pour l'affichage des tags en couleur
    $file = basename($path);
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    
    // Normalisation du chemin actuel pour la comparaison
    $normalizedPath = str_replace('\\', '/', $path);
    $tagsArray = $mediaTags[$normalizedPath] ?? [];
    $tagsString = implode(' ', $tagsArray);

    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
    $fullUrl = $protocol . "://" . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['PHP_SELF']), '/\\') . "/" . $path;

    echo '
    <div class="col media-item">
        <div class="card h-100 shadow-sm media-card position-relative cursor-pointer" 
             onclick="initGallery(this)" 
             data-path="'.$path.'" 
             data-url="'.$fullUrl.'" 
             data-ext="'.$ext.'"
             data-tags="'.htmlspecialchars(strtolower($tagsString)).'">';
    
    if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        echo "<img src='$path' class='card-img-top' style='height:160px; object-fit:cover;'>";
    } elseif (in_array($ext, ['mp4', 'webm', 'mov'])) {
        echo "<div style='height:160px; background:#000;' class='position-relative d-flex align-items-center justify-content-center'><video class='w-100 h-100' style='object-fit:cover;'><source src='$path'></video><div class='position-absolute text-white'>▶️</div></div>";
    }

    echo "
            <div class='card-body p-2'>
                <p class='card-text small text-truncate mb-1 fw-bold'>$file</p>
                <div class='tags-preview d-flex flex-wrap gap-1'>";
                foreach($tagsArray as $t) {
                    $tagColor = $tagColors[$t] ?? '#6c757d';
                    echo '<span class="badge" style="background: '.$tagColor.'; color: white; font-size:0.6rem; padding: 3px 8px; border-radius: 12px;">#'.htmlspecialchars($t).'</span>';
                }
    echo "      </div>
            </div>
        </div>
    </div>";
}
?>