<?php
$configFile = 'config/config.json';
$config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
$appName    = $config['app_name'] ?? 'Media Admin';
$favicon    = !empty($config['favicon_url']) ? $config['favicon_url'] : "img/favicon.svg";

$tagsFile = 'config/tags.json';
if (!file_exists('config')) mkdir('config', 0777, true);
if (!file_exists($tagsFile)) file_put_contents($tagsFile, json_encode([]));

// Chargement des tags (on s'assure que c'est un tableau associatif)
$tags = json_decode(file_get_contents($tagsFile), true) ?? [];

// --- LOGIQUE TRAITEMENT ---

// AJOUTER
if (isset($_POST['add_tag']) && !empty($_POST['tag_name'])) {
    $tagName = trim(htmlspecialchars($_POST['tag_name']));
    $tagColor = $_POST['tag_color'] ?? '#0d6efd';
    $tagId = 'tag_' . substr(md5(uniqid()), 0, 8); // Génère un ID unique court

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
        $tags[$tagId]['name'] = $newName;
        $tags[$tagId]['color'] = $newColor;
        file_put_contents($tagsFile, json_encode($tags, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
    header("Location: tags.php"); exit;
}

// SUPPRIMER
if (isset($_GET['delete'])) {
    $idToDelete = $_GET['delete'];
    if (isset($tags[$idToDelete])) {
        unset($tags[$idToDelete]);
        file_put_contents($tagsFile, json_encode($tags, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
    header("Location: tags.php"); exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration des Tags - <?= $appName ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f4f7f6; }
        .tag-item {
            background: #fff;
            border-left: 5px solid transparent;
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            transition: 0.2s;
        }
        .tag-item:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        
        .color-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 10px; }
        
        .tag-input-edit {
            border: none; background: transparent; font-weight: 500; outline: none; width: 100%;
        }
        
        /* Style discret pour l'input couleur dans la liste */
        .input-color-inline {
            border: none; width: 30px; height: 30px; cursor: pointer; background: none; padding: 0;
        }
        
        .btn-save-tag { border: none; background: none; opacity: 0; transition: 0.2s; cursor: pointer; }
        .tag-item:hover .btn-save-tag { opacity: 1; }
        .btn-del-tag { color: #dc3545; text-decoration: none; font-size: 1.4rem; margin-left: 10px; }
    </style>
</head>
<body>

<nav class="navbar navbar-dark bg-dark sticky-top mb-4">
    <div class="container-fluid px-5">
        <a class="navbar-brand fw-bold" href="admin.php">🏷️ <?= strtoupper($appName) ?> <span class="badge bg-primary">DICTIONNAIRE</span></a>
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
                                <input type="text" name="new_name" class="tag-input-edit" value="<?= $data['name'] ?>">
                                <button name="edit_tag" class="btn-save-tag">💾</button>
                            </form>
                            <a href="tags.php?delete=<?= $id ?>" class="btn-del-tag" onclick="return confirm('Supprimer ?')">×</a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>

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