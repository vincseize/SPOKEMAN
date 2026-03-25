/**
 * GESTION DE LA GALERIE & MODALE
 */
const previewModalElement = document.getElementById('previewModal');
const previewModal = new bootstrap.Modal(previewModalElement);
const modalContent = document.getElementById('modalMediaContent');
const modalFileName = document.getElementById('modalFileName');
const modalDeletePath = document.getElementById('modalDeletePath');
const modalCopyBtn = document.getElementById('modalCopyBtn');

let currentGallery = [];
let currentIndex = 0;

function initGallery(triggerElement) {
    // 1. On trouve le conteneur du dossier (la liste de fichiers)
    const folderContainer = triggerElement.closest('.list-group');
    
    // 2. On récupère UNIQUEMENT les fichiers de CE dossier qui ne sont pas cachés par le filtre
    const visibleTriggersInFolder = Array.from(folderContainer.querySelectorAll('.file-item:not([style*="display: none"]) .preview-trigger'));
    
    // 3. On construit la galerie avec ces fichiers uniquement
    currentGallery = visibleTriggersInFolder.map(el => ({ 
        path: el.dataset.path, 
        url: el.dataset.url, 
        ext: el.dataset.ext 
    }));

    // 4. On trouve l'index de l'image cliquée dans cette nouvelle liste restreinte
    currentIndex = currentGallery.findIndex(item => item.path === triggerElement.dataset.path);
    
    if (currentIndex === -1) return; 
    
    updateModal();
    previewModal.show();
}

function updateModal() {
    const item = currentGallery[currentIndex];
    if(!item) return;

    modalContent.innerHTML = '';
    const specsElem = document.getElementById('modalMediaSpecs');
    specsElem.innerHTML = 'chargement...'; // Reset des specs
    
    // Nom et compteur en haut
    modalFileName.innerHTML = `<span class="badge bg-dark me-2">${currentIndex + 1} / ${currentGallery.length}</span> ${item.path.split('/').pop()}`;
    
    modalDeletePath.value = item.path;
    modalCopyBtn.dataset.copyUrl = item.url;
    modalCopyBtn.innerText = "📋 Copier";

    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExts = ['mp4', 'webm', 'mov'];

    if (imgExts.includes(item.ext)) {
        const img = new Image();
        img.src = item.path;
        img.className = "img-fluid shadow rounded";
        img.style.maxHeight = "65vh";
        img.onload = function() {
            fetch(item.path).then(r => r.blob()).then(blob => {
                const size = (blob.size / 1024).toFixed(1) + ' KB';
                specsElem.innerHTML = `${img.naturalWidth}x${img.naturalHeight} px | ${size}`;
            });
        };
        modalContent.appendChild(img);
    } else if (videoExts.includes(item.ext)) {
        const video = document.createElement('video');
        video.src = item.path;
        video.controls = true;
        video.autoplay = true;
        video.className = "w-100 shadow rounded";
        video.style.maxHeight = "65vh";
        video.onloadedmetadata = function() {
            fetch(item.path).then(r => r.blob()).then(blob => {
                const size = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';
                const duration = Math.floor(video.duration / 60) + ":" + ("0" + Math.floor(video.duration % 60)).slice(-2);
                specsElem.innerHTML = `Vidéo | ${duration} min | ${size}`;
            });
        };
        modalContent.appendChild(video);
    } else {
        modalContent.innerHTML = `<div class="p-5 bg-light rounded border text-center"><h1 class="display-1">📄</h1><h5>.${item.ext.toUpperCase()}</h5></div>`;
        specsElem.innerHTML = "Fichier document";
    }

    syncModalTags(item.path);
}

/**
 * SYNCHRONISATION DES TAGS (MODALE <-> LISTE)
 */
function syncModalTags(filePath) {
    // 1. Trouver l'élément parent dans la liste principale qui correspond au fichier
    // On cherche l'input qui contient le chemin du fichier
    const mainForm = document.querySelector(`form.tag-auto-form input[value="${filePath}"]`)?.closest('.tag-auto-form');
    if (!mainForm) return;

    const mainFileItem = mainForm.closest('.file-item');

    // 2. Récupérer les tags cochés dans la liste
    const activeTags = Array.from(mainForm.querySelectorAll('.tag-input-checkbox:checked')).map(cb => cb.value);

    // 3. Mettre à jour les checkbox de la modale
    document.querySelectorAll('.modal-tag-sync').forEach(modalCb => {
        // Cocher si présent dans la liste
        modalCb.checked = activeTags.includes(modalCb.value);
        
        // Au clic sur un tag de la modale
        modalCb.onchange = function() {
            // Trouver la checkbox correspondante dans la liste principale
            const mainCb = mainForm.querySelector(`.tag-input-checkbox[value="${this.value}"]`);
            if (mainCb) {
                mainCb.checked = this.checked;
                // Déclencher l'événement 'change' sur la checkbox principale pour activer l'auto-save AJAX
                mainCb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };
    });
}

function changeMedia(direction, event) {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    if (currentGallery.length <= 1) return;
    
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = currentGallery.length - 1;
    if (currentIndex >= currentGallery.length) currentIndex = 0;
    
    updateModal();
}

function modalCopyAction() {
    const url = modalCopyBtn.dataset.copyUrl;
    navigator.clipboard.writeText(url).then(() => {
        modalCopyBtn.innerText = "✅ Copié !";
        setTimeout(() => modalCopyBtn.innerText = "📋 Copier l'URL", 2000);
    });
}

/**
 * RECHERCHE & FILTRAGE
 */
function filterFiles() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    
    document.querySelectorAll('.folder-card').forEach(card => {
        const folderName = card.getAttribute('data-folder-name') || "";
        const files = card.querySelectorAll('.file-item');
        let folderHasMatch = false;

        files.forEach(file => {
            const fileName = file.getAttribute('data-file-name') || "";
            const fileTags = file.getAttribute('data-tags') || "";
            const isMatch = fileName.includes(input) || fileTags.includes(input);
            
            file.style.display = isMatch ? "flex" : "none";
            if (isMatch) folderHasMatch = true;
        });

        const showFolder = folderName.includes(input) || folderHasMatch;
        card.style.display = showFolder ? "block" : "none";

        // Auto-expand des dossiers si on recherche activement
        const collapseEl = card.querySelector('.accordion-collapse');
        const bsCollapse = bootstrap.Collapse.getInstance(collapseEl) || new bootstrap.Collapse(collapseEl, {toggle: false});
        
        if (input.length > 1 && folderHasMatch) bsCollapse.show();
        else if (input.length === 0) bsCollapse.hide();
    });
}

/**
 * AUTO-SAVE DES TAGS (AJAX) 
 */
document.addEventListener('submit', function(e) {
    if (e.target.classList.contains('tag-auto-form')) { 
        e.preventDefault(); 
        return false; 
    }
});

document.addEventListener('change', function(e) {
    if (e.target.classList.contains('tag-input-checkbox')) {
        const checkbox = e.target;
        const label = checkbox.nextElementSibling;
        const form = checkbox.closest('form');
        const formData = new FormData(form);

        // Feedback visuel (opacité réduite pendant l'envoi)
        label.style.opacity = "0.4";

        fetch(window.location.href, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => {
            if (response.ok) {
                label.style.opacity = "1";
                updateFileTagsAttribute(checkbox);
            }
        })
        .catch(err => { 
            console.error("Erreur de sauvegarde:", err); 
            label.style.opacity = "1"; 
        });
    }
});

function updateFileTagsAttribute(checkbox) {
    const fileItem = checkbox.closest('.file-item');
    const checkedBoxes = fileItem.querySelectorAll('.tag-input-checkbox:checked');
    const tagsArray = Array.from(checkedBoxes).map(cb => cb.value);
    // On met à jour l'attribut data-tags pour que le filtre de recherche reste précis
    fileItem.setAttribute('data-tags', tagsArray.join(' ').toLowerCase());
}

/**
 * UTILITAIRES & EVENTS
 */
function copyLink(url, btn) {
    navigator.clipboard.writeText(url).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = "OK";
        btn.classList.add('text-success');
        setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('text-success');
        }, 1500);
    });
}

function confirmFolderDelete(id, name) {
    if (confirm(`Supprimer le dossier "${name}" et tout son contenu ?`) && confirm("⚠️ Cette action est irréversible !")) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.innerHTML = `<input type="hidden" name="folder_path" value="uploads/${name}"><input type="hidden" name="force_delete_folder" value="1">`;
        document.body.appendChild(form);
        form.submit();
    }
}

// Raccourcis clavier
document.addEventListener('keydown', (e) => {
    if (!previewModalElement.classList.contains('show')) return;
    
    if (e.key === "ArrowRight") changeMedia(1);
    if (e.key === "ArrowLeft") changeMedia(-1);
    if (e.key === "Escape") previewModal.hide();
});

// Arrêter la vidéo si on ferme la modale
previewModalElement.addEventListener('hidden.bs.modal', () => {
    modalContent.innerHTML = '';
});