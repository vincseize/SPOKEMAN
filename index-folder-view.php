<?php
/**
 * index-folder-view.php
 * Affichage d'un dossier spécifique en mode grille
 */
?>
<nav aria-label="breadcrumb" class="mb-4">
    <ol class="breadcrumb shadow-sm p-2 bg-white rounded">
        <li class="breadcrumb-item"><a href="index.php" class="text-decoration-none fw-bold">Sets</a></li>
        <li class="breadcrumb-item active text-capitalize"><?= htmlspecialchars($currentFolder); ?></li>
    </ol>
</nav>
<div class="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
    <?php
    $files = array_diff(scandir($baseDir . $currentFolder), array('.', '..'));
    foreach ($files as $file) renderMediaCard($baseDir . $currentFolder . '/' . $file);
    ?>
</div>