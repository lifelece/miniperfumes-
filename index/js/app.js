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
    startTour, nextTourStep, endTour, renderCartSuggestions, triggerPopAnim, updateProgressBar, showWarmOnboarding, togglePabbot, showIOSNotification, openReceiptModal, closeReceiptModal
} from './ui.js';

// Exponer funciones al scope global para que los event listeners inline (onclick, onkeyup) en el HTML sigan funcionando.
window.updateCart = updateCart;
window.addBrandToCart = addBrandToCart;
window.addComboToCart = addComboToCart;
window.addBrandToCart = addBrandToCart;
window.addComboToCart = addComboToCart;
window.clearCart = clearCart;
window.setPaymentMethod = setPaymentMethod;
window.confirmWhatsApp = confirmWhatsApp;
window.showIOSNotification = showIOSNotification;
window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.toggleClearBtn = toggleClearBtn;
window.clearSearch = clearSearch;
window.filterCatalog = filterCatalog;
window.sendWhatsAppInquiry = sendWhatsAppInquiry;
window.filterFAQ = filterFAQ;
window.filterByBrand = filterByBrand;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.openFAQ = openFAQ;
window.closeFAQ = closeFAQ;
window.showPreview = showPreview;
window.hidePreview = hidePreview;
window.startTour = startTour;
window.nextTourStep = nextTourStep;
window.endTour = endTour;
window.triggerPopAnim = triggerPopAnim;
window.updateProgressBar = updateProgressBar;
window.showWarmOnboarding = showWarmOnboarding;
window.togglePabbot = togglePabbot;
window.renderCartSuggestions = renderCartSuggestions;
window.openReceiptModal = openReceiptModal;
window.closeReceiptModal = closeReceiptModal;

// Custom Event Listener desde cart.js para evitar dependencias circulares extra
document.addEventListener('cbo-receipt-close', closeReceiptModal);

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

    // REGISTRO DE SERVICE WORKER PARA PWA (OFFLINE FIRST)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => console.log('✅ [PWA] ServiceWorker registrado con éxito', registration.scope))
                .catch(err => console.log('❌ [PWA] Falló el registro del ServiceWorker', err));
        });
    }

    // Inicializar Social Proof de Ventas Simuladas (FOMO)
    import('./ui.js').then(ui => ui.initSocialProofFOMO());
}


