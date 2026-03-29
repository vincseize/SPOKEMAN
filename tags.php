<?php
// tags.php - Page de gestion des tags
include 'tags-header.php';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration des Tags - <?= $appName ?></title>
    <link rel="icon" href="<?= $favicon ?>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/tags/tags.css?<?= time() ?>">
</head>
<body>

<nav class="navbar navbar-dark bg-dark sticky-top mb-4">
    <div class="container-fluid px-5">
        <a class="navbar-brand fw-bold" href="admin.php">🏷️ <?= strtoupper($appName) ?> <span class="badge bg-primary">🏷️ TAGS</span></a>
        <input type="text" id="tagSearch" class="form-control form-control-sm w-25 bg-dark text-white border-secondary" placeholder="Rechercher..." onkeyup="filterTags()">
        <a href="admin.php" class="btn btn-outline-light btn-sm">Retour</a>
    </div>
</nav>

<div class="container-fluid px-5">
    <div class="row g-4">
        <div class="col-lg-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body p-4">
                    <h6 class="fw-bold mb-3 text-uppercase small">Nouveau Tag</h6>
                    <form method="post">
                        <div class="mb-3">
                            <label class="small fw-bold">Nom</label>
                            <input type="text" name="tag_name" class="form-control form-control-sm" required placeholder="Ex: Menottes">
                        </div>
                        <div class="mb-3">
                            <label class="small fw-bold">Couleur</label>
                            <input type="color" name="tag_color" class="form-control form-control-color w-100" value="#0d6efd">
                        </div>
                        <button name="add_tag" class="btn btn-primary btn-sm w-100 fw-bold">Ajouter</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-9">
            <div class="tags-container row g-3" id="tagsWrapper">
                <?php foreach($tags as $id => $data): ?>
                    <div class="col-md-4 tag-item-container" data-name="<?= strtolower($data['name']) ?>">
                        <div class="tag-item" style="border-left-color: <?= $data['color'] ?>;">
                            <form method="post" class="d-flex align-items-center flex-grow-1 m-0">
                                <input type="hidden" name="tag_id" value="<?= $id ?>">
                                <input type="color" name="new_color" class="input-color-inline me-2" value="<?= $data['color'] ?>" onchange="this.form.submit()">
                                <input type="text" name="new_name" class="tag-input-edit" value="<?= htmlspecialchars($data['name']) ?>">
                                <button name="edit_tag" class="btn-save-tag">💾</button>
                            </form>
                            <a href="tags.php?delete=<?= $id ?>" class="btn-del-tag" onclick="return confirm('Supprimer le tag ?')">×</a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>

<!-- Modal d'alerte pour suppression de tag utilisé -->
<?php if ($warningTag): ?>
<div class="modal-confirm-overlay" id="confirmModal">
    <div class="modal-confirm">
        <div class="modal-header">
            <h5 class="modal-title text-danger">⚠️ Tag utilisé !</h5>
            <button type="button" class="btn-close" onclick="closeModal()"></button>
        </div>
        <div class="modal-body">
            <p>Le tag <strong class="text-danger">#<?= htmlspecialchars($warningTag['tag_name']) ?></strong> est utilisé dans <strong><?= count($warningTag['files']) ?></strong> fichier(s) :</p>
            <div class="file-list">
                <?php 
                $currentFolder = '';
                foreach ($warningTag['files'] as $file): 
                    if ($currentFolder !== $file['folder']): 
                        if ($currentFolder !== ''): ?>
                            </div> <!-- fermeture du dossier précédent -->
                        <?php endif; 
                        $currentFolder = $file['folder'];
                ?>
                    <div class="folder-group">
                        <div class="folder-title">
                            <span class="folder-icon">📁</span> <?= htmlspecialchars($currentFolder) ?>
                        </div>
                <?php endif; ?>
                        <div class="file-item">
                            📄 <?= htmlspecialchars($file['filename']) ?>
                        </div>
                <?php endforeach; ?>
                    </div> <!-- fermeture du dernier dossier -->
            </div>
            <p class="mt-3 text-muted small">⚠️ Si vous supprimez ce tag, il sera retiré de tous ces fichiers.</p>
        </div>
        <div class="modal-footer">
            <form method="post" style="display: inline;">
                <input type="hidden" name="tag_id" value="<?= $warningTag['tag_id'] ?>">
                <input type="hidden" name="tag_name" value="<?= htmlspecialchars($warningTag['tag_name']) ?>">
                <button type="submit" name="confirm_delete_tag" class="btn btn-danger">🗑️ Supprimer quand même</button>
            </form>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
    </div>
</div>
<script>
    function closeModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.remove();
        window.location.href = 'tags.php';
    }
</script>
<?php endif; ?>

<script>
    function filterTags() {
        const filter = document.getElementById('tagSearch').value.toLowerCase();
        document.querySelectorAll('.tag-item-container').forEach(item => {
            item.style.display = item.getAttribute('data-name').includes(filter) ? "" : "none";
        });
    }
</script>

</body>
</html>