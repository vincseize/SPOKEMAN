<?php
// zip.php

// Configuration
$configFile = 'config/config.json';
$mediaTagsFile = 'config/media_tags.json';
$baseDir = 'uploads/';

// Charger la configuration
$config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
$appName = $config['app_name'] ?? 'Media Gallery';

// Charger les tags des fichiers
$mediaTags = [];
if (file_exists($mediaTagsFile)) {
    $rawTags = json_decode(file_get_contents($mediaTagsFile), true);
    if (is_array($rawTags)) {
        foreach ($rawTags as $key => $value) {
            $mediaTags[str_replace('\\', '/', $key)] = $value;
        }
    }
}

if (isset($_GET['folder'])) {
    $folderName = basename($_GET['folder']); 
    $folderPath = $baseDir . $folderName;
    
    // Récupérer les paramètres de filtrage
    $searchTerm = isset($_GET['search']) ? strtolower($_GET['search']) : '';
    $selectedTags = isset($_GET['tags']) ? explode(',', $_GET['tags']) : [];
    
    // Filtrer les tags vides
    $selectedTags = array_filter($selectedTags, function($tag) { return !empty($tag); });
    
    if (is_dir($folderPath)) {
        $zip = new ZipArchive();
        $zipName = $folderName . ".zip";
        $zipFile = tempnam(sys_get_temp_dir(), 'zip');

        if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            
            // Récupérer tous les fichiers du dossier
            $allFiles = array_diff(scandir($folderPath), array('.', '..'));
            $filesToZip = [];
            
            // Filtrer les fichiers selon les critères
            foreach ($allFiles as $file) {
                $filePath = $folderPath . '/' . $file;
                $normalizedPath = str_replace('\\', '/', $filePath);
                $fileTags = isset($mediaTags[$normalizedPath]) ? $mediaTags[$normalizedPath] : [];
                if (!is_array($fileTags)) $fileTags = [];
                
                $isMatch = true;
                
                // Filtre par tags (tous les tags sélectionnés doivent être présents)
                if (!empty($selectedTags)) {
                    $isMatch = empty(array_diff($selectedTags, $fileTags));
                }
                
                // Filtre par nom de fichier
                if ($isMatch && !empty($searchTerm)) {
                    $isMatch = stripos($file, $searchTerm) !== false;
                }
                
                if ($isMatch) {
                    $filesToZip[] = [
                        'path' => $filePath,
                        'name' => $file,
                        'tags' => $fileTags
                    ];
                }
            }
            
            // Ajouter les fichiers filtrés au ZIP
            foreach ($filesToZip as $file) {
                $zip->addFile($file['path'], $file['name']);
            }
            
            // ===== CRÉATION DU FICHIER TAGS.TXT =====
            $tagsContent = "Tags pour le dossier : " . $folderName . "\n";
            $tagsContent .= "================================\n\n";
            
            // Informations sur le filtrage
            if (!empty($selectedTags) || !empty($searchTerm)) {
                $tagsContent .= "Filtres appliqués :\n";
                if (!empty($searchTerm)) {
                    $tagsContent .= "- Recherche par nom : \"" . $searchTerm . "\"\n";
                }
                if (!empty($selectedTags)) {
                    $tagsContent .= "- Tags sélectionnés :\n";
                    foreach ($selectedTags as $tag) {
                        $tagsContent .= "  * #" . $tag . "\n";
                    }
                }
                $tagsContent .= "\n";
            }
            
            $tagsContent .= "Fichiers inclus dans ce ZIP : " . count($filesToZip) . " fichier(s)\n\n";
            
            if (!empty($filesToZip)) {
                // Liste des fichiers avec leurs tags
                $tagsContent .= "--- Détail des fichiers ---\n";
                foreach ($filesToZip as $file) {
                    $tagsContent .= "\n" . $file['name'] . " :\n";
                    if (!empty($file['tags'])) {
                        foreach ($file['tags'] as $tag) {
                            $tagsContent .= "  - #" . $tag . "\n";
                        }
                    } else {
                        $tagsContent .= "  - Aucun tag\n";
                    }
                }
            } else {
                $tagsContent .= "Aucun fichier ne correspond aux critères.\n";
            }
            
            // Ajouter tous les tags distincts du dossier (optionnel)
            if (empty($selectedTags)) {
                $allTagsInFolder = [];
                foreach ($allFiles as $file) {
                    $filePath = $folderPath . '/' . $file;
                    $normalizedPath = str_replace('\\', '/', $filePath);
                    if (isset($mediaTags[$normalizedPath])) {
                        $fileTags = $mediaTags[$normalizedPath];
                        if (is_array($fileTags)) {
                            foreach ($fileTags as $tag) {
                                if (!in_array($tag, $allTagsInFolder)) {
                                    $allTagsInFolder[] = $tag;
                                }
                            }
                        }
                    }
                }
                
                if (!empty($allTagsInFolder)) {
                    sort($allTagsInFolder);
                    $tagsContent .= "\n--- Tous les tags présents dans le dossier ---\n";
                    foreach ($allTagsInFolder as $tag) {
                        $tagsContent .= "- #" . $tag . "\n";
                    }
                }
            }
            
            $tagsContent .= "\n---\n";
            $tagsContent .= "Généré le : " . date('Y-m-d H:i:s') . "\n";
            $tagsContent .= "Application : " . $appName . "\n";
            
            // Ajouter le fichier tags.txt dans le zip
            $zip->addFromString('tags.txt', $tagsContent);
            
            $zip->close();

            header('Content-Type: application/zip');
            header('Content-disposition: attachment; filename="' . $zipName . '"');
            header('Content-Length: ' . filesize($zipFile));
            readfile($zipFile);
            unlink($zipFile);
            exit;
        }
    }
}
die("Erreur lors de la génération du ZIP.");