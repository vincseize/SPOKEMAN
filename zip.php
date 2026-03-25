<?php
if (isset($_GET['folder'])) {
    $baseDir = 'uploads/';
    $folderName = basename($_GET['folder']); 
    $folderPath = $baseDir . $folderName;

    if (is_dir($folderPath)) {
        $zip = new ZipArchive();
        $zipName = $folderName . ".zip";
        $zipFile = tempnam(sys_get_temp_dir(), 'zip');

        if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
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