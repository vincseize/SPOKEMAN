// js/admin-core.js
console.log("admin-core.js chargé");

// ESCAPE HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Exposer
window.escapeHtml = escapeHtml;