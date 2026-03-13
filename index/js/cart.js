import { API_URL, flatProducts, getProductById } from './api.js';
// Usaremos eventos o window para evitar el ciclo con ui.js si es necesario, 
// o bien dejaremos que app.js orqueste llamadas a ui.js, pero para UI directa 
// como showIOSNotification o haptic moveré su ejecución a un event callback
import { syncProductUI, showIOSNotification, haptic, triggerPopAnim, updateProgressBar, renderCartModalItems, openCartModal, closeCartModal } from './ui.js';

export let cart = {};
export let paymentMethod = 'bs';
export const PRICES = { base: 6.00, mid: 4.50, top: 3.50 };

export const ANALYTICS_KEY = 'miniperfumes_user_stats';
export const PROFILE_KEY = 'miniperfumes_user_profile';

export let userStats = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{"product_adds": {}, "searches": []}');

export let userProfile = JSON.parse(localStorage.getItem(PROFILE_KEY));
if (!userProfile) {
    userProfile = {
        id: 'CBO-' + Math.floor(1000 + Math.random() * 9000),
        visits: 0,
        orders: 0,
        level: 'Emprendedor',
        createdAt: new Date().toISOString()
    };
}

export function incrementVisits() {
    userProfile.visits++;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
}

export function updateUserLevelUI() {
    let level = 'Emprendedor';
    let nextMessage = `Faltan ${3 - userProfile.orders} compras para subir`;
    
    if (userProfile.orders >= 3 && userProfile.orders < 7) {
        level = 'Negocio Retail';
        nextMessage = `Faltan ${7 - userProfile.orders} compras para subir`;
    } else if (userProfile.orders >= 7) {
        level = 'Mayorista Premium';
        nextMessage = `¡Nivel Máximo Alcanzado!`;
    }

    userProfile.level = level;
    document.getElementById('user-level').innerText = level;
    document.getElementById('user-next-level').innerHTML = userProfile.orders >= 7 ? `<i class="fas fa-star text-yellow-300"></i> ${nextMessage}` : `<i class="fas fa-arrow-up"></i> ${nextMessage}`;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
}

export function logEvent(eventName, details) {
    console.log(`[ANALYTICS] ${eventName}`, details);
    if(window.clarity) { window.clarity("set", eventName, JSON.stringify(details)); }
}

export function updateCart(productId, change) {
    if (!cart[productId]) cart[productId] = 0;
    cart[productId] += change;
    if (cart[productId] < 0) cart[productId] = 0;
    
    if(change > 0) {
        userStats.product_adds[productId] = (userStats.product_adds[productId] || 0) + 1;
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(userStats));
        
        const p = getProductById(productId);
        if (p && p.isPremium) {
            showIOSNotification('Aroma Premium añadido (+$1.80)', 'success');
        }
    }
    
    syncProductUI(productId, cart[productId]); saveCartToStorage();
    if (change > 0) haptic('light'); else haptic('heavy');
    calculateTotals();
    if(!document.getElementById('cart-modal').classList.contains('hidden')) renderCartModalItems(); 
}

export function addBrandToCart(brand) { 
    haptic('success'); 
    let addedCount = 0; 
    flatProducts.forEach(p => { 
        if(p.brand === brand) { 
            if(!cart[p.id]) cart[p.id] = 0; 
            cart[p.id] += 1; 
            syncProductUI(p.id, cart[p.id]); 
            addedCount++; 
        } 
    }); 
    saveCartToStorage(); 
    calculateTotals(); 
    showIOSNotification(`+${addedCount} perfumes de ${brand} añadidos`, 'success'); 
}

export function addComboToCart(qty, tier) { 
    if (flatProducts.length === 0) return; 
    clearCartSilent(); 
    let shuffled = [...flatProducts].sort(() => 0.5 - Math.random()); 
    let numUnique = Math.min(flatProducts.length, Math.ceil(qty / 2)); 
    if (numUnique === 0) return; 
    let selected = shuffled.slice(0, numUnique); 
    let distribution = {}; 
    selected.forEach(p => distribution[p.id] = 1); 
    let remaining = qty - numUnique; 
    while(remaining > 0) { 
        distribution[selected[Math.floor(Math.random() * selected.length)].id]++; 
        remaining--; 
    } 
    for (let id in distribution) { 
        cart[id] = distribution[id]; 
        syncProductUI(id, cart[id]); 
    } 
    saveCartToStorage(); 
    calculateTotals(); 
    openCartModal(); 
    haptic('success'); 
    if (window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); 
    showIOSNotification(`Surtido x${qty} listo. ¡Edítalo!`, 'success'); 
    logEvent('combo_selected', { qty: qty, tier: tier });
}

export function clearCartSilent() { 
    for (let id in cart) { 
        cart[id] = 0; 
        syncProductUI(id, 0); 
    } 
    for (let key in cart) delete cart[key];
    localStorage.removeItem('miniperfumes_cart_cbo'); 
}

export function clearCart() { 
    clearCartSilent(); 
    calculateTotals(); 
    renderCartModalItems(); 
    closeCartModal(); 
    haptic('success'); 
    showIOSNotification('Carrito vaciado', 'error'); 
}

export function saveCartToStorage() { localStorage.setItem('miniperfumes_cart_cbo', JSON.stringify(cart)); }

export function loadCartFromStorage() { 
    const saved = localStorage.getItem('miniperfumes_cart_cbo'); 
    if (saved) { 
        let tempCart = JSON.parse(saved); 
        for (let key in cart) delete cart[key]; 
        for (let id in tempCart) { 
            if(getProductById(id)) {
                cart[id] = tempCart[id];
                syncProductUI(id, cart[id]); 
            }
        }
        saveCartToStorage(); 
        calculateTotals(); 
    } 
}

export function setPaymentMethod(method) { 
    paymentMethod = method; 
    document.getElementById(`radio-${method}`).checked = true; 
    haptic('light'); 
    calculateTotals(); 
}

let confettiFired = false;
export function calculateTotals() {
    let totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
    let currentPrice = (totalQty >= 100) ? PRICES.top : ((totalQty >= 50) ? PRICES.mid : PRICES.base);

    let premiumSurcharge = 0;
    for (let id in cart) {
        if (cart[id] > 0) {
            const prod = getProductById(id);
            if (prod && prod.isPremium) premiumSurcharge += cart[id] * 1.80;
        }
    }

    if (totalQty >= 100 && !confettiFired) { 
        if (window.confetti) window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#1C1C1E', '#007AFF', '#34C759'] }); 
        confettiFired = true; 
    } else if (totalQty < 100) {
        confettiFired = false;
    }

    updateProgressBar(totalQty);
    
    const qtyEl = document.getElementById('sticky-qty');
    const oldQty = qtyEl ? qtyEl.innerText : "0"; 
    
    if(oldQty != totalQty && totalQty > 0) triggerPopAnim('sticky-qty');
    if(qtyEl) qtyEl.innerText = totalQty;
    
    const stickyCart = document.getElementById('sticky-cart');
    if(stickyCart) {
        if (totalQty > 0) stickyCart.classList.remove('translate-y-32'); 
        else stickyCart.classList.add('translate-y-32');
    }

    let subtotalBase = totalQty * currentPrice;
    let subtotal = subtotalBase + premiumSurcharge;
    
    const premiumRow = document.getElementById('cart-premium-row');
    if(premiumRow) {
        if (premiumSurcharge > 0) {
            premiumRow.classList.remove('hidden');
            document.getElementById('cart-modal-premium').innerText = `+$${premiumSurcharge.toFixed(2)}`;
        } else {
            premiumRow.classList.add('hidden');
        }
    }

    let discount = 0; 
    const discountRow = document.getElementById('cart-discount-row');
    if ((paymentMethod === 'zelle' || paymentMethod === 'crypto') && totalQty >= 20) {
        discount = subtotal * 0.05; 
        if(discountRow) { 
            discountRow.classList.remove('hidden'); 
            document.getElementById('cart-modal-discount').innerText = `-$${discount.toFixed(2)}`; 
        }
    } else { 
        if(discountRow) discountRow.classList.add('hidden'); 
    }

    const totalFinal = subtotal - discount;

    const modalQty = document.getElementById('cart-modal-qty');
    if(modalQty) modalQty.innerText = totalQty;
    
    const modalSubtotal = document.getElementById('cart-modal-subtotal');
    if(modalSubtotal) modalSubtotal.innerText = `$${subtotalBase.toFixed(2)}`;
    
    const modalTotal = document.getElementById('cart-modal-total');
    if(modalTotal) modalTotal.innerText = `$${totalFinal.toFixed(2)}`;
    
    const stickyTotal = document.getElementById('sticky-total');
    if(stickyTotal) stickyTotal.innerText = `$${totalFinal.toFixed(2)}`;

    // ROI CALCULATOR MEJORADO DINÁMICO
    const roiContainer = document.getElementById('roi-section');
    if(totalQty >= 20 && roiContainer) {
        const ventaPrecio = 10.00; // Precio de reventa sugerido
        const gananciaNeta = (totalQty * ventaPrecio) - totalFinal;
        document.getElementById('roi-profit').innerText = `$${gananciaNeta.toFixed(2)}`;
        roiContainer.classList.remove('hidden');
    } else if(roiContainer) { roiContainer.classList.add('hidden'); }

    const btnModal = document.getElementById('cart-modal-btn');
    const headerBtn = document.getElementById('cart-header-btn'); 
    
    if(btnModal) {
        if (totalQty >= 20) { 
            btnModal.disabled = false; 
            btnModal.innerHTML = `<div class="flex items-center gap-2 text-lg"><i class="fab fa-whatsapp text-2xl animate-pulse"></i> <span>CONFIRMAR PEDIDO AQUÍ</span></div><span class="text-[11px] font-medium opacity-90 mt-1 tracking-wide">Paso final para cerrar tu importación</span>`; 
            if(headerBtn) headerBtn.classList.remove('hidden'); 
        } 
        else { 
            btnModal.disabled = true; 
            if(totalQty > 0) btnModal.innerHTML = `<span class="text-base py-2">Faltan ${20 - totalQty} uds para mayorista</span>`; 
            else btnModal.innerHTML = `<span class="text-base py-2">Añade productos al surtido</span>`; 
            if(headerBtn) headerBtn.classList.add('hidden'); 
        }
    }
}

export function generateCryptoHash() {
    return "0x" + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getCustomerTier(qty) {
    if(qty >= 100) return "Mayorista Premium";
    if(qty >= 50) return "Negocio / Retail";
    return "Emprendedor";
}

export function sendWhatsAppOrder() {
    haptic('success');
    let totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
    if (totalQty < 20) return;

    let currentPrice = totalQty >= 100 ? PRICES.top : (totalQty >= 50 ? PRICES.mid : PRICES.base);
    let subtotalBase = totalQty * currentPrice;
    let premiumSurcharge = 0;

    let orderDetails = "";
    for (let id in cart) {
        if (cart[id] > 0) {
            const prod = getProductById(id);
            if (prod) {
                if (prod.isPremium) premiumSurcharge += cart[id] * 1.80;
                let pTag = prod.isPremium ? " 💎 (+1.80$)" : "";
                orderDetails += `- ${cart[id]}x [${prod.id}] ${prod.name} (${prod.cap})${pTag}%0A`;
            }
        }
    }
    
    let subtotal = subtotalBase + premiumSurcharge;
    let discount = (paymentMethod === 'zelle' || paymentMethod === 'crypto') ? (subtotal * 0.05) : 0;
    let total = subtotal - discount;
    
    let payText = "Pago Móvil / Efectivo";
    if (paymentMethod === 'zelle') payText = "Zelle (Dcto Aplicado ✅)";
    if (paymentMethod === 'crypto') payText = "USDT / Binance Pay (Dcto Aplicado ✅)";

    let tier = getCustomerTier(totalQty);
    let hashId = generateCryptoHash();
    let bonusText = (totalQty >= 50) ? "%0A🎁 *BONO DESBLOQUEADO:* Bolsas de entrega" : "";
    let premiumText = premiumSurcharge > 0 ? `%0A- Recargo Aromas Premium: +$${premiumSurcharge.toFixed(2)}` : "";

    logEvent('whatsapp_checkout', { user_id: userProfile.id, total: total, method: paymentMethod, items: totalQty });

    userProfile.orders++;
    updateUserLevelUI();

    try {
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'new_order',
                userId: userProfile.id,
                level: userProfile.level,
                items: totalQty,
                total: total,
                payment: paymentMethod,
                timestamp: new Date().toISOString()
            })
        });
    } catch (e) { console.log('CRM error silencioso', e); }

    let introText = "";
    if (userProfile.level === 'Emprendedor') {
        introText = `Hola equipo CBO! 🚀%0ASoy Socio ${userProfile.level} *${userProfile.id}*. ¡Estoy listo para mi primera caja grande!`;
    } else if (userProfile.level === 'Negocio Retail') {
        introText = `Hola equipo! Socio *${userProfile.id}* - Nivel ${userProfile.level}.%0ANecesito mi pedido recurrente habitual.`;
    } else {
        introText = `¡Importación mayorista! Socio *${userProfile.id}* - Premium.%0AOrden grande lista para confirmar y facturar.`;
    }

    const text = `${introText}%0A%0A🌐 *ORIGEN:* Web App CBO%0A%0A📦 *MI LISTA:*%0A${orderDetails}%0A📊 *RESUMEN:*%0A- Total Piezas: ${totalQty}${premiumText}%0A- Método: ${payText}%0A- Total a Pagar: *$${total.toFixed(2)}*${bonusText}%0A%0A🔐 *HASH:* ${hashId.substring(0,12)}...`;
    
    window.open(`https://wa.me/584141087079?text=${text}`, '_blank');

    setTimeout(clearCartSilent, 2000);
}
