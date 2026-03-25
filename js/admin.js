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
    const allVisibleTriggers = Array.from(document.querySelectorAll('.file-item:not([style*="display: none"]) .preview-trigger'));
    currentGallery = allVisibleTriggers.map(el => ({ 
        path: el.dataset.path, 
        url: el.dataset.url, 
        ext: el.dataset.ext 
    }));
    currentIndex = currentGallery.findIndex(item => item.path === triggerElement.dataset.path);
    if (currentIndex === -1) return; 
    updateModal();
    previewModal.show();
}

function updateModal() {
    const item = currentGallery[currentIndex];
    if(!item) return;
    modalContent.innerHTML = '';
    modalFileName.innerText = `${currentIndex + 1} / ${currentGallery.length} - ${item.path.split('/').pop()}`;
    modalDeletePath.value = item.path;
    modalCopyBtn.dataset.copyUrl = item.url;
    modalCopyBtn.innerText = "📋 Copier l'URL";

    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExts = ['mp4', 'webm', 'mov'];

    if (imgExts.includes(item.ext)) {
        modalContent.innerHTML = `<img src="${item.path}" class="img-fluid shadow rounded" style="max-height: 70vh;">`;
    } else if (videoExts.includes(item.ext)) {
        modalContent.innerHTML = `<video src="${item.path}" controls autoplay class="w-100 shadow rounded" style="max-height: 70vh;"></video>`;
    } else {
        modalContent.innerHTML = `<div class="p-5 bg-light rounded border text-center"><h1 class="display-1">📄</h1><h5>Fichier .${item.ext.toUpperCase()}</h5><p class="text-muted small">${item.path}</p><a href="${item.path}" download class="btn btn-primary mt-3">Télécharger</a></div>`;
    }
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
    if (e.target.classList.contains('tag-auto-form')) { e.preventDefault(); return false; }
});

document.addEventListener('change', function(e) {
    if (e.target.classList.contains('tag-input-checkbox')) {
        const checkbox = e.target;
        const label = checkbox.nextElementSibling;
        const form = checkbox.closest('form');
        const formData = new FormData(form);
        e.preventDefault();
        e.stopPropagation();
        label.style.opacity = "0.5";
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
        .catch(err => { console.error("Erreur:", err); label.style.opacity = "1"; });
    }
});

function updateFileTagsAttribute(checkbox) {
    const fileItem = checkbox.closest('.file-item');
    const checkedBoxes = fileItem.querySelectorAll('.tag-input-checkbox:checked');
    const tagsArray = Array.from(checkedBoxes).map(cb => cb.value);
    fileItem.setAttribute('data-tags', tagsArray.join(' ').toLowerCase());
}

/**
 * UTILITAIRES
 */
function copyLink(url, btn) {
    navigator.clipboard.writeText(url).then(() => {
        const original = btn.innerText;
        btn.innerText = "OK !";
        btn.classList.replace('btn-outline-secondary', 'btn-success');
        setTimeout(() => {
            btn.innerText = original;
            btn.classList.replace('btn-success', 'btn-outline-secondary');
        }, 1500);
    });
}

function confirmFolderDelete(id, name) {
    if (confirm(`Supprimer le dossier "${name}" ?`) && confirm("⚠️ ATTENTION : Définitif !")) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.innerHTML = `<input type="hidden" name="folder_path" value="uploads/${name}"><input type="hidden" name="force_delete_folder" value="1">`;
        document.body.appendChild(form);
        form.submit();
    }
}

document.addEventListener('keydown', (e) => {
    if (!previewModalElement.classList.contains('show')) return;
    if (e.key === "ArrowRight") changeMedia(1);
    if (e.key === "ArrowLeft") changeMedia(-1);
    if (e.key === "Escape") previewModal.hide();
});