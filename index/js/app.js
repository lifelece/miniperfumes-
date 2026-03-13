import { loadCatalog } from './api.js';
import { 
    cart, userProfile, incrementVisits, updateUserLevelUI, loadCartFromStorage, 
    updateCart, addBrandToCart, addComboToCart, clearCart, setPaymentMethod, sendWhatsAppOrder 
} from './cart.js';
import { 
    generateSmartTop5, renderBrandFilters, renderCatalog, personalizeHero, 
    openMenu, closeMenu, toggleClearBtn, clearSearch, filterCatalog, 
    sendWhatsAppInquiry, filterFAQ, filterByBrand, openCartModal, 
    closeCartModal, openFAQ, closeFAQ, showPreview, hidePreview, 
    startTour, nextTourStep, endTour, renderCartSuggestions, triggerPopAnim, updateProgressBar, showWarmOnboarding, togglePabbot, showIOSNotification 
} from './ui.js';

// Exponer funciones al scope global para que los event listeners inline (onclick, onkeyup) en el HTML sigan funcionando.
Object.assign(window, {
    updateCart, addBrandToCart, addComboToCart, clearCart, setPaymentMethod, sendWhatsAppOrder, showIOSNotification, 
    openMenu, closeMenu, toggleClearBtn, clearSearch, filterCatalog, 
    sendWhatsAppInquiry, filterFAQ, filterByBrand, openCartModal, 
    closeCartModal, openFAQ, closeFAQ, showPreview, hidePreview, 
    startTour, nextTourStep, endTour, triggerPopAnim, updateProgressBar, showWarmOnboarding, togglePabbot 
});
window.renderCartSuggestions = renderCartSuggestions;

async function initApp() {
    // Inicializar animaciones AOS antes de renderizar para quitar "display:none" u opacity: 0
    if (window.AOS) {
        AOS.init({ duration: 600, once: true, offset: 30, easing: 'ease-out-cubic' });
    }

    // Inicialización de Animaciones
    AOS.init({ duration: 600, once: true, offset: 30, easing: 'ease-out-cubic' });

    // Restablecer posición de scroll para animaciones limpias
    window.scrollTo(0, 0);

    const success = await loadCatalog();
    if (success) {
        document.getElementById('loading-indicator').classList.add('hidden');
        document.getElementById('catalog-zone').classList.remove('hidden');
        generateSmartTop5();
        renderBrandFilters();
        renderCatalog();
        personalizeHero();
        showWarmOnboarding(); // UI Vibe Coding Intro
    } else {
        document.getElementById('loading-indicator').innerText = "Error cargando catálogo. Por favor recarga la página.";
    }
}


