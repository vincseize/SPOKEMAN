// js/admin-delete.js
console.log("admin-delete.js chargé");

// SUPPRESSION DOSSIER - DOUBLE CONFIRMATION
function confirmFolderDelete(path, name) {
    if (confirm(`Supprimer le dossier "${name}" et tout son contenu ?`)) {
        if (confirm(`⚠️ DERNIÈRE CONFIRMATION ⚠️\n\nSupprimer définitivement "${name}" et tous ses fichiers ?\n\nCette action est irréversible !`)) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.innerHTML = `<input type="hidden" name="folder_path" value="${path}"><input type="hidden" name="force_delete_folder" value="1">`;
            document.body.appendChild(form);
            form.submit();
        }
    }
}

// Exposer
window.confirmFolderDelete = confirmFolderDelete;