// js/admin-copy.js
console.log("admin-copy.js chargé");

// COPIER LIEN
function copyLink(url, btn) {
    navigator.clipboard.writeText(url).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = "OK";
        setTimeout(() => btn.innerHTML = original, 1500);
    });
}

// Exposer
window.copyLink = copyLink;