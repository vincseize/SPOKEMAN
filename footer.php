<?php
/**
 * FOOTER GÉNÉRAL AVEC INFOS DISQUE
 * footer.php
 * Utilisé par : index.php, admin.php, tags.php
 */

// 1. Sécurité pour les variables de configuration
// Charger la configuration pour la version
$configFile = 'config/config.json';
$config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];

// 1. Sécurité pour les variables de configuration
$appName    = isset($appName) ? $appName : ($config['app_name'] ?? 'Media Admin');
$appVersion = isset($appVersion) ? $appVersion : ($config['version'] ?? '1.0.0');
$maxUploadSize = $config['settings']['max_upload_size'] ?? '20M';

// 2. Logique Disk Info (Protection contre les redéfinitions de fonction)
if (!function_exists('getDiskInfo')) {
    function getDiskInfo($path) {
        // @ évite les warnings si les droits d'accès sont restreints
        $free  = @disk_free_space($path) ?: 0;
        $total = @disk_total_space($path) ?: 1; 
        $percent = round((($total - $free) / $total) * 100);
        
        return [
            'free'    => round($free / (1024 ** 3), 2), // Conversion en Go
            'total'   => round($total / (1024 ** 3), 2), // Conversion en Go
            'percent' => $percent,
            'os'      => (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') ? 'Windows' : 'Linux'
        ];
    }
}

// Analyse du disque sur le répertoire courant
$disk = getDiskInfo(__DIR__);
?>

<footer class="mt-auto py-3 border-top bg-white shadow-sm mt-5">
    <div class="container-fluid px-5">
        <div class="row align-items-center justify-content-between" style="font-size: 0.85rem;">
            
            <div class="col-md-4 text-muted">
                <span class="fw-bold text-dark"><?= strtoupper(htmlspecialchars($appName)) ?></span> 
                <span class="ms-1 opacity-75 text-secondary">v<?= htmlspecialchars($appVersion) ?></span>
            </div>
            
            <div class="col-md-4 d-flex justify-content-center align-items-center gap-2">
                <span class="text-muted small">Serveur <strong><?= $disk['os'] ?></strong></span>
                <div class="progress" style="height: 4px; width: 70px; background: #eee; border-radius: 10px;">
                    <div class="progress-bar bg-<?= ($disk['percent'] > 85) ? 'danger' : 'success' ?>" 
                         role="progressbar" 
                         style="width: <?= $disk['percent'] ?>%" 
                         aria-valuenow="<?= $disk['percent'] ?>" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
                <span class="fw-bold text-muted" style="font-size: 0.7rem;">
                    <?= $disk['free'] ?> Go / <?= $disk['total'] ?> Go
                </span>
                <span class="text-secondary" style="font-size: 0.7rem;">
                    max: <?= htmlspecialchars($maxUploadSize) ?>
                </span>
            </div>
            
            <div class="col-md-4 text-end text-muted opacity-75">
                &copy; 2025-<?= date('Y'); ?> | LRDS
            </div>

        </div>
    </div>
</footer>

<style>
/* S'assure que le footer reste en bas si la page est peu remplie */
html, body {
    height: 100%;
}
body {
    display: flex;
    flex-direction: column;
}
.main-wrapper, main, .container-fluid {
    flex: 1 0 auto;
}
footer {
    flex-shrink: 0;
}
/* Style pour la barre de progression */
.progress-bar {
    transition: width 0.6s ease;
}
/* Responsive footer */
@media (max-width: 768px) {
    footer .row {
        flex-direction: column;
        text-align: center;
        gap: 8px;
    }
    footer .col-md-4 {
        text-align: center !important;
        justify-content: center !important;
    }
}
</style>