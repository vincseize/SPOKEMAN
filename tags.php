<?php
$configFile = 'config/config.json';
$config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
$appName    = $config['app_name'] ?? 'Media Admin';
$appVersion = $config['version'] ?? '1.0.0';
$favicon    = !empty($config['favicon_url']) ? $config['favicon_url'] : "img/favicon.svg";

$tagsFile = 'config/tags.json';
if (!file_exists('config')) mkdir('config', 0777, true);
if (!file_exists($tagsFile)) file_put_contents($tagsFile, json_encode([]));

$tags = json_decode(file_get_contents($tagsFile), true) ?? [];

// --- LOGIQUE TRAITEMENT ---

if (isset($_POST['add_tag']) && !empty($_POST['tag_name'])) {
    $newTag = trim(htmlspecialchars($_POST['tag_name']));
    if (!in_array($newTag, $tags)) {
        $tags[] = $newTag;
        sort($tags);
        file_put_contents($tagsFile, json_encode($tags, JSON_UNESCAPED_UNICODE));
    }
    header("Location: tags.php"); exit;
}

if (isset($_POST['edit_tag'])) {
    $oldTag = $_POST['old_name'];
    $newName = trim(htmlspecialchars($_POST['new_name']));
    if (($key = array_search($oldTag, $tags)) !== false && !empty($newName)) {
        $tags[$key] = $newName;
        sort($tags);
        file_put_contents($tagsFile, json_encode($tags, JSON_UNESCAPED_UNICODE));
    }
    header("Location: tags.php"); exit;
}

if (isset($_GET['delete'])) {
    $tagToDelete = $_GET['delete'];
    $tags = array_values(array_filter($tags, function($t) use ($tagToDelete) {
        return $t !== $tagToDelete;
    }));
    file_put_contents($tagsFile, json_encode($tags, JSON_UNESCAPED_UNICODE));
    header("Location: tags.php"); exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration des Tags - <?= $appName ?></title>
    <link rel="icon" href="<?= $favicon ?>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        :root { --tag-bg: #ffffff; }
        body { background-color: #f4f7f6; min-height: 100vh; display: flex; flex-direction: column; }
        
        .navbar-brand img { filter: brightness(0) invert(1); }
        
        /* Grille de Tags */
        .tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }

        .tag-item {
            background: var(--tag-bg);
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 5px 12px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            transition: all 0.2s;
            min-width: 180px;
        }

        .tag-item:hover {
            border-color: #0d6efd;
            box-shadow: 0 4px 8px rgba(0,0,0,0.08);
        }

        .tag-input-edit {
            border: none;
            background: transparent;
            font-weight: 500;
            outline: none;
            width: 100%;
            font-size: 0.9rem;
        }

        .btn-save-tag {
            border: none;
            background: none;
            color: #198754;
            padding: 0 5px;
            opacity: 0;
            transition: 0.2s;
        }

        .tag-item:focus-within .btn-save-tag, 
        .tag-item:hover .btn-save-tag { opacity: 1; }

        .btn-del-tag {
            color: #dc3545;
            text-decoration: none;
            font-size: 1.2rem;
            margin-left: 8px;
            line-height: 1;
        }
        
        .search-bar { max-width: 400px; }
    </style>
</head>
<body>

<nav class="navbar navbar-dark bg-dark sticky-top shadow-sm mb-4">
    <div class="container-fluid px-5">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="admin.php">
            <img src="<?= $favicon ?>" width="24" height="24" class="me-2">
            <?= strtoupper($appName) ?> <span class="ms-2 badge bg-warning text-dark" style="font-size: 0.6rem;">TAGS</span>
        </a>
        
        <div class="search-bar flex-grow-1 mx-4">
            <input type="text" id="tagSearch" class="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Filtrer les tags..." onkeyup="filterTags()">
        </div>

        <div class="d-flex gap-2">
            <a href="admin.php" class="btn btn-outline-light btn-sm">Retour Admin</a>
        </div>
    </div>
</nav>

<div class="container-fluid px-5 mb-5">
    <div class="row g-4">
        <div class="col-lg-3">
            <div class="card border-0 shadow-sm sticky-top" style="top: 80px;">
                <div class="card-body p-4">
                    <h6 class="fw-bold text-muted mb-3 small text-uppercase">Nouveau Tag</h6>
                    <form method="post">
                        <div class="mb-3">
                            <input type="text" name="tag_name" class="form-control form-control-sm" placeholder="Nom du tag..." required autofocus>
                        </div>
                        <button name="add_tag" class="btn btn-primary btn-sm w-100 fw-bold">Ajouter au dictionnaire</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-9">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3">
                    <h6 class="m-0 fw-bold text-dark">Dictionnaire des Tags (<?= count($tags) ?>)</h6>
                </div>
                <div class="card-body p-4">
                    <div class="tags-container" id="tagsWrapper">
                        <?php foreach($tags as $tag): ?>
                            <div class="tag-item" data-name="<?= strtolower($tag) ?>">
                                <form method="post" class="d-flex align-items-center flex-grow-1 m-0">
                                    <input type="hidden" name="old_name" value="<?= $tag ?>">
                                    <input type="text" name="new_name" class="tag-input-edit" value="<?= $tag ?>">
                                    <button name="edit_tag" class="btn-save-tag" title="Sauvegarder">💾</button>
                                </form>
                                <a href="tags.php?delete=<?= urlencode($tag) ?>" 
                                   class="btn-del-tag" 
                                   onclick="return confirm('Supprimer définitivement ce tag ?')" 
                                   title="Supprimer">×</a>
                            </div>
                        <?php endforeach; ?>

                        <?php if(empty($tags)): ?>
                            <div class="text-center w-100 py-5">
                                <span class="display-1 opacity-10">🏷️</span>
                                <p class="text-muted mt-3">Aucun tag pour le moment.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include 'footer.php'; ?>

<script>
    // Filtre de recherche en temps réel
    function filterTags() {
        const input = document.getElementById('tagSearch');
        const filter = input.value.toLowerCase();
        const wrapper = document.getElementById('tagsWrapper');
        const items = wrapper.getElementsByClassName('tag-item');

        for (let i = 0; i < items.length; i++) {
            const tagName = items[i].getAttribute('data-name');
            if (tagName.includes(filter)) {
                items[i].style.display = "";
            } else {
                items[i].style.display = "none";
            }
        }
    }
</script>

</body>
</html>