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

    if (is_dir($folderPath)) {
        // Récupérer les tags depuis le paramètre GET
        $selectedTags = isset($_GET['tags']) ? explode(',', $_GET['tags']) : [];
        
        $zip = new ZipArchive();
        $zipName = $folderName . ".zip";
        $zipFile = tempnam(sys_get_temp_dir(), 'zip');

        if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            // Ajouter tous les fichiers du dossier
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($folderPath, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $file) {
                if (!$file->isDir()) {
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen(realpath($folderPath)) + 1);
                    $zip->addFile($filePath, $relativePath);
                }
            }
            
            // ===== CRÉATION DU FICHIER TAGS.TXT =====
            $tagsContent = "Tags pour le dossier : " . $folderName . "\n";
            $tagsContent .= "================================\n\n";
            
            if (!empty($selectedTags)) {
                // Cas 1: Tags sélectionnés par l'utilisateur (filtrage actif)
                $tagsContent .= "Tags utilisés pour le filtrage :\n";
                foreach ($selectedTags as $tag) {
                    $tagsContent .= "- #" . $tag . "\n";
                }
                $tagsContent .= "\nTotal : " . count($selectedTags) . " tag(s) de filtrage\n";
            } else {
                // Cas 2: Aucun tag sélectionné → récupérer tous les tags présents dans le dossier
                $tagsContent .= "Tous les tags présents dans ce dossier :\n";
                
                // Parcourir tous les fichiers du dossier pour collecter les tags uniques
                $allTagsInFolder = [];
                $filesList = array_diff(scandir($folderPath), array('.', '..'));
                
                foreach ($filesList as $file) {
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
                
                // Trier les tags alphabétiquement
                sort($allTagsInFolder);
                
                if (!empty($allTagsInFolder)) {
                    foreach ($allTagsInFolder as $tag) {
                        $tagsContent .= "- #" . $tag . "\n";
                    }
                    $tagsContent .= "\nTotal : " . count($allTagsInFolder) . " tag(s) distinct(s)\n";
                    
                    // Ajouter un comptage par fichier
                    $tagsContent .= "\n--- Détail par fichier ---\n";
                    foreach ($filesList as $file) {
                        $filePath = $folderPath . '/' . $file;
                        $normalizedPath = str_replace('\\', '/', $filePath);
                        $fileTags = isset($mediaTags[$normalizedPath]) ? $mediaTags[$normalizedPath] : [];
                        
                        if (!empty($fileTags)) {
                            $tagsContent .= "\n" . $file . " :\n";
                            foreach ($fileTags as $tag) {
                                $tagsContent .= "  - #" . $tag . "\n";
                            }
                        }
                    }
                } else {
                    $tagsContent .= "Aucun tag trouvé dans ce dossier.\n";
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