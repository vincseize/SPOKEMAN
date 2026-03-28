// js/admin-rename.js
console.log("admin-rename.js chargé");

// SOUMISSION RENOMMAGE
function submitRename(form) {
    console.log("Soumission du formulaire de renommage");
    
    const formData = new FormData(form);
    
    const filePath = formData.get('file_path');
    const newName = formData.get('new_name');
    
    if (!filePath) {
        console.error("Chemin du fichier manquant");
        return;
    }
    
    if (!newName || newName.trim() === '') {
        console.error("Nom invalide");
        return;
    }
    
    console.log("Renommage de:", filePath, "vers:", newName);
    
    fetch('admin.php', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => {
        console.log("Réponse reçue, status:", response.status);
        if (response.ok) {
            console.log("Renommage réussi, rechargement...");
            window.location.reload();
        } else {
            console.error("Erreur lors du renommage, status:", response.status);
        }
    })
    .catch(err => console.error('Erreur fetch:', err));
}

// Exposer
window.submitRename = submitRename;