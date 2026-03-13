import { catalogData, flatProducts, getProductById } from './api.js';
import { cart, userStats, userProfile, logEvent, updateCart } from './cart.js';

export function haptic(type = 'light') { 
    if (!navigator.vibrate) return; 
    if (type === 'light') navigator.vibrate(10); 
    if (type === 'success') navigator.vibrate([20, 30, 20]); 
    if (type === 'heavy') navigator.vibrate(40); 
}

export function showIOSNotification(text, type = 'success') { 
    const bg = type === 'error' ? 'rgba(255, 59, 48, 0.9)' : 'rgba(28, 28, 30, 0.85)'; 
    if (window.Toastify) {
        window.Toastify({ text: text, duration: 2500, gravity: "top", position: "center", style: { background: bg, backdropFilter: "blur(12px)", borderRadius: "100px", padding: "12px 24px", fontSize: "13px", fontWeight: "600", color: "#fff" } }).showToast(); 
    }
}

export function showWarmOnboarding() {
    if (userProfile.visits === 1) {
        setTimeout(() => {
            const onboardingHtml = `
                <div id="warm-onboarding" class="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[90] bg-white rounded-[2rem] p-5 shadow-2xl border border-gray-100 transform translate-y-10 opacity-0 transition-all duration-700 cubic-bezier(0.32, 0.72, 0, 1)">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-full bg-iosBlue/10 flex items-center justify-center text-iosBlue text-xl flex-shrink-0 animate-bounce">
                            👋
                        </div>
                        <div>
                            <h3 class="font-bold text-textMain text-sm mb-1 tracking-tight">¡Hola, Emprendedora!</h3>
                            <p class="text-xs text-textLight leading-relaxed mb-3">Aquí tienes el surtido perfecto para tu negocio. ¿Te enseño cómo ganar dinero con nosotros?</p>
                            <div class="flex gap-2">
                                <button onclick="document.getElementById('warm-onboarding').remove(); startTour(); haptic('medium');" class="bg-iosBlue text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm">Sí, enséñame 🚀</button>
                                <button onclick="document.getElementById('warm-onboarding').remove();" class="bg-[#F2F2F7] text-textMain text-xs font-semibold px-4 py-2 rounded-xl active:scale-95 transition-all hover:bg-gray-200">Explorar sola</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', onboardingHtml);
            requestAnimationFrame(() => {
                const toast = document.getElementById('warm-onboarding');
                toast.classList.remove('translate-y-10', 'opacity-0');
            });
        }, 1500);
    }
}

export function personalizeHero() {
    if (Object.keys(userStats.product_adds).length > 0 && flatProducts.length > 0) {
        let brandCounts = {};
        for (let prodId in userStats.product_adds) {
            let product = getProductById(prodId);
            if(product) {
                brandCounts[product.brand] = (brandCounts[product.brand] || 0) + userStats.product_adds[prodId];
            }
        }
        
        let favoriteBrand = Object.keys(brandCounts).reduce((a, b) => brandCounts[a] > brandCounts[b] ? a : b, "");

        if (favoriteBrand && userProfile.visits > 1) {
            document.getElementById('hero-greeting').innerText = `SOCIO ${userProfile.id} · TU MARCA TOP`;
            document.getElementById('hero-title').innerHTML = `Llegó lo nuevo<br>de <span class="text-iosOrange">${favoriteBrand}</span>.`;
        } else if (userProfile.visits > 1) {
            document.getElementById('hero-greeting').innerText = `HOLA DE NUEVO, SOCIO ${userProfile.id}`;
            document.getElementById('hero-title').innerHTML = `Qué bueno verte,<br>aquí está tu surtido.`;
        }
    } else if (userProfile.visits > 1) {
        document.getElementById('hero-greeting').innerText = `HOLA DE NUEVO, SOCIO ${userProfile.id}`;
    }
}

export function generateSmartTop5() {
    const container = document.getElementById('top5-container');
    const section = document.getElementById('top5-section');
    if (!container || flatProducts.length < 5) return; 

    let sortedProducts = [...flatProducts].sort((a, b) => {
        let scoreA = userStats.product_adds[a.id] || Math.random();
        let scoreB = userStats.product_adds[b.id] || Math.random();
        return scoreB - scoreA;
    });
    
    let top5 = sortedProducts.slice(0, 5);
    let html = '';
    top5.forEach((prod) => {
        let premiumBadge = prod.isPremium ? `<span class="inline-block bg-[#8A2BE2] text-white text-[8px] px-1.5 py-0.5 rounded shadow-sm mb-1 w-max"><i class="fas fa-gem"></i> +$1.8</span>` : '';
        html += `
        <div class="min-w-[130px] bg-iosCard p-3 rounded-3xl shadow-ios snap-center flex flex-col relative group">
            <div class="w-full aspect-square relative mb-2 cursor-pointer" onclick="showPreview('${prod.img}')">
                <img src="${prod.img}" referrerpolicy="no-referrer" loading="lazy" class="w-full h-full object-cover rounded-2xl bg-[#F2F2F7]">
            </div>
            ${premiumBadge}
            <p class="font-bold text-[13px] text-textMain leading-snug line-clamp-2 min-h-[38px] w-full mb-1">${prod.name}</p>
            <div class="mt-auto w-full">
                <button onclick="updateCart('${prod.id}', 1)" class="w-full bg-[#F2F2F7] text-iosBlue hover:bg-iosBlue hover:text-white font-bold py-2 rounded-xl transition-colors text-xs active:scale-95">Agregar</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
    section.classList.remove('hidden');
}

export function renderBrandFilters() {
    const container = document.getElementById('brand-filters-container');
    if(!container) return;
    let html = `<button onclick="filterByBrand('All')" class="brand-filter-btn active whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold bg-textMain text-white transition-colors">Todos</button>`;
    catalogData.forEach(cat => { html += `<button onclick="filterByBrand('${cat.brand}')" class="brand-filter-btn whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold bg-white text-gray-500 border border-gray-200 hover:text-textMain transition-colors">${cat.brand}</button>`; });
    container.innerHTML = html;
}

export function renderCatalog() {
    const container = document.getElementById('catalog-container');
    if(!container) return;
    let htmlFragments = [];
    catalogData.forEach((category) => {
        htmlFragments.push(`<div class="category-block mb-10" data-brand="${category.brand}"> <div class="flex justify-between items-end mb-4 px-2"> <h3 class="text-xl font-bold tracking-tight text-textMain">${category.brand}</h3> <button onclick="addBrandToCart('${category.brand}')" class="text-[11px] font-semibold text-iosBlue bg-blue-50 px-3 py-1.5 rounded-full active:scale-95 shadow-sm"> <i class="fas fa-magic"></i> Surtir Marca </button> </div> <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">`);
        category.products.forEach((prod) => {
            let searchTerms = `${category.brand} ${prod.name} ${prod.id}`.toLowerCase();
            
            let badgeHtml = '';
            if (prod.stock <= 3) {
                badgeHtml = `<div class="absolute top-2 left-2 z-10 bg-[#FF3B30] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">¡Quedan ${prod.stock}!</div>`;
            } else if (prod.stock <= 8) {
                badgeHtml = `<div class="absolute top-2 left-2 z-10 bg-[#FF9500] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm"><i class="fas fa-fire"></i> Alta Demanda</div>`;
            }

            let premiumBadge = prod.isPremium ? `<span class="inline-block bg-[#8A2BE2] text-white text-[8px] px-1.5 py-0.5 rounded shadow-sm mb-1 w-max"><i class="fas fa-gem"></i> 15ml (+$1.8)</span>` : '';

            htmlFragments.push(`
            <div class="product-card flex flex-col items-center bg-iosCard p-3 rounded-[1.75rem] shadow-ios transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl relative group" data-search="${searchTerms}"> 
                    ${badgeHtml} 
                    <div class="w-full aspect-square relative mb-3 cursor-pointer overflow-hidden rounded-2xl bg-[#F2F2F7]" onclick="showPreview('${prod.img}')"> 
                        <img src="${prod.img}" referrerpolicy="no-referrer" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"> 
                        <div class="absolute bottom-2 right-2 bg-[#F2F2F7]/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-black text-iosGreen border border-white shadow-sm ring-1 ring-iosGreen/20">
                            $${prod.cap} <span class="text-[8px] text-textLight font-medium block leading-none">Mayorista</span>
                        </div>
                        <div class="absolute top-2 right-2 bg-white/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold text-textMain border border-white/40 shadow-sm opacity-80">
                            $${prod.base} <span class="text-[7px] text-textLight font-normal">Emp.</span>
                        </div>
                    </div> 
                    <div class="flex-1 w-full flex flex-col px-1"> 
                        ${premiumBadge} 
                        <p class="font-bold text-[13px] md:text-sm text-textMain leading-snug mb-3 line-clamp-2 min-h-[38px]">${prod.name}</p> 
                        <div class="mt-auto w-full"> 
                            <button id="add-btn-${prod.id}" onclick="updateCart('${prod.id}', 1)" class="w-full bg-[#F2F2F7] text-iosBlue hover:bg-iosBlue hover:text-white font-bold py-2.5 rounded-xl transition-all text-xs active:scale-95 shadow-sm"> Agregar </button> 
                            <div id="ctrls-${prod.id}" class="hidden flex items-center justify-between bg-[#F2F2F7] rounded-xl p-1.5 w-full shadow-inner"> 
                                <button onclick="updateCart('${prod.id}', -1)" class="w-10 h-10 flex items-center justify-center text-textMain bg-white rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 transition-all"><i class="fas fa-minus text-[12px]"></i></button> 
                                <span id="qty-${prod.id}" class="text-base font-bold w-8 text-center text-textMain">0</span> 
                                <button onclick="updateCart('${prod.id}', 1)" class="w-10 h-10 flex items-center justify-center text-textMain bg-white rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 transition-all"><i class="fas fa-plus text-[12px]"></i></button> 
                            </div> 
                        </div> 
                    </div> 
                </div>`);
        });
        htmlFragments.push(`</div></div>`);
    });
    container.innerHTML = htmlFragments.join('');
}

export function triggerPopAnim(elementId) { 
    const el = document.getElementById(elementId); 
    if(el) { 
        el.classList.remove('pop-anim'); 
        void el.offsetWidth; 
        el.classList.add('pop-anim'); 
    } 
}

function fireMicroConfetti(element) {
    if (window.confetti) {
        const rect = element.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({
            particleCount: 15,
            spread: 40,
            origin: { x, y },
            colors: ['#007AFF', '#34C759', '#FF9500'],
            disableForReducedMotion: true,
            zIndex: 200,
            ticks: 50
        });
    }
}

export function syncProductUI(productId, qty) {
    const btn = document.getElementById(`add-btn-${productId}`); 
    const ctrls = document.getElementById(`ctrls-${productId}`); 
    const qtyLabel = document.getElementById(`qty-${productId}`);
    if(qtyLabel) { qtyLabel.innerText = qty; triggerPopAnim(`qty-${productId}`); }
    
    if(btn && ctrls) { 
        if(qty > 0 && !btn.classList.contains('hidden')) { 
            // Feedback táctil: Botón a On Success
            let originalText = btn.innerHTML;
            btn.innerHTML = `<i class="fas fa-check"></i> Listo`;
            btn.classList.remove('bg-[#F2F2F7]', 'text-iosBlue');
            btn.classList.add('bg-[#34C759]', 'text-white');
            fireMicroConfetti(btn);
            
            setTimeout(() => {
                btn.classList.add('hidden'); 
                btn.innerHTML = originalText;
                btn.classList.add('bg-[#F2F2F7]', 'text-iosBlue');
                btn.classList.remove('bg-[#34C759]', 'text-white');
                ctrls.classList.remove('hidden'); 
                ctrls.classList.add('flex'); 
                triggerPopAnim(`ctrls-${productId}`);
            }, 1000);
        } else if (qty > 0) {
            btn.classList.add('hidden'); 
            ctrls.classList.remove('hidden'); 
            ctrls.classList.add('flex');
        } else { 
            btn.classList.remove('hidden'); 
            ctrls.classList.add('hidden'); 
            ctrls.classList.remove('flex'); 
        } 
    }
}

export function updateProgressBar(totalQty) {
    const bar = document.getElementById('progress-bar'); const msg = document.getElementById('progress-msg'); const title = document.getElementById('progress-title'); const price = document.getElementById('progress-price');
    if(!bar) return;
    if (totalQty < 20) { bar.style.width = `${(totalQty / 20) * 100}%`; bar.className = "h-full rounded-full progress-bar-fill bg-textLight"; msg.innerHTML = `Faltan <strong>${20 - totalQty} uds</strong> para desbloquear precio mayorista ($6.00).`; title.innerText = "Iniciando"; price.innerText = "---"; } 
    else if (totalQty >= 20 && totalQty < 50) { bar.style.width = `${((totalQty - 20) / 30) * 100}%`; bar.className = "h-full rounded-full progress-bar-fill bg-iosBlue"; msg.innerHTML = `🔥 Nivel Emprendedor. Suma <strong class="text-iosBlue">${50 - totalQty} uds</strong> y bajan a $4.50.`; title.innerText = "Emprendedor"; price.innerText = "$6.00 c/u"; } 
    else if (totalQty >= 50 && totalQty < 100) { bar.style.width = `${((totalQty - 50) / 50) * 100}%`; bar.className = "h-full rounded-full progress-bar-fill bg-iosOrange"; msg.innerHTML = `🚀 Nivel Negocio. Precio bajó a $4.50 c/u. <br><span class="text-[#FF9500]"><i class="fas fa-gift"></i> + Bolsas de regalo.</span>`; title.innerText = "Negocio"; price.innerText = "$4.50 c/u"; } 
    else { bar.style.width = '100%'; bar.className = "h-full rounded-full progress-bar-fill bg-iosGreen"; msg.innerHTML = `🏆 Nivel Máximo alcanzado. Mejor precio garantizado.`; title.innerText = "Mayorista"; price.innerText = "$3.50 c/u"; }
}

export function renderCartSuggestions() {
    const container = document.getElementById('cart-suggestions-container'); const list = document.getElementById('cart-suggestions-list');
    let totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
    if(totalQty === 0 || flatProducts.length < 3) { container.classList.add('hidden'); return; }
    let available = flatProducts.filter(p => !cart[p.id] || cart[p.id] === 0);
    
    let suggestions = available.sort((a,b) => (userStats.product_adds[b.id]||0) - (userStats.product_adds[a.id]||0)).slice(0, 3);

    if(suggestions.length > 0) {
        let html = '';
        suggestions.forEach(prod => { html += `<div class="min-w-[100px] bg-iosCard border border-gray-100 p-2 rounded-2xl shadow-sm snap-center flex flex-col items-center text-center"> <img src="${prod.img}" referrerpolicy="no-referrer" class="w-12 h-12 object-cover rounded-xl mb-1 bg-[#F2F2F7]"> <p class="text-[9px] font-semibold text-textMain leading-tight line-clamp-2 w-full mb-1 h-[24px]">${prod.name}</p> <button onclick="updateCart('${prod.id}', 1); renderCartSuggestions();" class="w-full bg-[#F2F2F7] text-iosBlue text-[10px] font-bold py-1.5 rounded-lg active:scale-95 transition-transform"> Añadir </button> </div>`; });
        list.innerHTML = html; container.classList.remove('hidden');
    } else { container.classList.add('hidden'); }
}

export function renderCartModalItems() {
    const container = document.getElementById('cart-items-container'); 
    if(!container) return;
    let totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
    if (totalQty === 0) { container.innerHTML = `<div class="text-center text-textLight mt-12"><i class="fas fa-shopping-bag text-5xl mb-3 opacity-50"></i><p class="text-sm font-medium">Tu pedido está vacío</p></div>`; document.getElementById('cart-suggestions-container').classList.add('hidden'); return; }
    let html = '';
    for (let id in cart) {
        if (cart[id] > 0) {
            const prod = getProductById(id);
            if(prod) { 
                let pBadge = prod.isPremium ? `<span class="bg-[#8A2BE2] text-white text-[8px] px-1 rounded ml-1"><i class="fas fa-gem"></i> +$1.8</span>` : '';
                html += `<div class="flex items-center gap-3 bg-iosCard p-2 rounded-2xl mb-2"> <img src="${prod.img}" referrerpolicy="no-referrer" class="w-12 h-12 object-cover rounded-xl bg-[#F2F2F7]"> <div class="flex-1"> <p class="text-[13px] font-semibold text-textMain leading-tight mb-0.5">${prod.name} ${pBadge}</p> <p class="text-[10px] text-textLight">Cod: #${prod.id}</p> </div> <div class="flex flex-col items-end gap-1"> <div class="flex items-center gap-2 bg-[#F2F2F7] rounded-lg p-1"> <button onclick="updateCart('${prod.id}', -1)" class="w-8 h-8 flex items-center justify-center text-textMain bg-white rounded shadow-sm active:scale-95"><i class="fas fa-minus text-[10px]"></i></button> <span class="text-xs font-bold w-5 text-center text-textMain">${cart[id]}</span> <button onclick="updateCart('${prod.id}', 1)" class="w-8 h-8 flex items-center justify-center text-textMain bg-white rounded shadow-sm active:scale-95"><i class="fas fa-plus text-[10px]"></i></button> </div> </div> </div>`; 
            }
        }
    }
    container.innerHTML = html; renderCartSuggestions();
}

// UI HANDLERS

export function openMenu() {
    haptic('light');
    logEvent('menu_hub_opened', {});
    const menu = document.getElementById('main-menu');
    const backdrop = document.getElementById('menu-backdrop');
    const sheet = document.getElementById('menu-sheet');
    
    menu.classList.remove('hidden');
    void menu.offsetWidth;
    backdrop.classList.remove('opacity-0');
    sheet.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
}

export function closeMenu() {
    const backdrop = document.getElementById('menu-backdrop');
    const sheet = document.getElementById('menu-sheet');
    
    backdrop.classList.add('opacity-0');
    sheet.classList.add('translate-x-full');
    
    setTimeout(() => {
        document.getElementById('main-menu').classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

export function toggleClearBtn() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if(input.value.length > 0) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
}

export function clearSearch() {
    const input = document.getElementById('searchInput');
    input.value = ''; input.focus();
    document.getElementById('clearSearchBtn').classList.add('hidden');
    filterCatalog();
}

export function filterCatalog() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let totalCardsFound = 0;
    
    document.querySelectorAll('.category-block').forEach(cat => {
        let cards = cat.querySelectorAll('.product-card');
        let hasVisible = false;
        cards.forEach(card => {
            if (card.getAttribute('data-search').indexOf(input) > -1) { card.style.display = "flex"; hasVisible = true; totalCardsFound++; } 
            else card.style.display = "none";
        });
        cat.style.display = hasVisible ? "block" : "none";
    });

    const emptyState = document.getElementById('empty-search-state');
    if (totalCardsFound === 0 && input.length > 1) {
        emptyState.classList.remove('hidden');
        logEvent('failed_search', { query: input });
    } else {
        emptyState.classList.add('hidden');
    }
}

export function sendWhatsAppInquiry() {
    let input = document.getElementById('searchInput').value;
    window.open(`https://wa.me/584141087079?text=Hola%20equipo.%20Soy%20el%20socio%20${userProfile.id}.%20Estuve%20buscando%20el%20aroma%20"${input}"%20y%20no%20lo%20conseguí.%20¿Lo%20tienen%20disponible?`, '_blank');
}

export function filterFAQ() {
    let input = document.getElementById('faqSearchInput').value.toLowerCase();
    document.querySelectorAll('.faq-item').forEach(item => {
        let tags = item.getAttribute('data-tags').toLowerCase();
        let text = item.innerText.toLowerCase();
        if (tags.includes(input) || text.includes(input)) item.style.display = "block";
        else item.style.display = "none";
    });
}

export function filterByBrand(brandName) {
    haptic('light');
    document.querySelectorAll('.brand-filter-btn').forEach(btn => {
        if (btn.innerText === brandName || (brandName === 'All' && btn.innerText === 'Todos')) btn.className = "brand-filter-btn active whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold bg-textMain text-white transition-colors";
        else btn.className = "brand-filter-btn whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold bg-white text-gray-500 border border-gray-200 hover:text-textMain transition-colors";
    });
    document.querySelectorAll('.category-block').forEach(catBlock => { catBlock.style.display = (brandName === 'All' || catBlock.getAttribute('data-brand') === brandName) ? "block" : "none"; });
}

export function openCartModal() { haptic('light'); logEvent('cart_opened', {}); const modal = document.getElementById('cart-modal'); const backdrop = document.getElementById('cart-backdrop'); const sheet = document.getElementById('cart-sheet'); modal.classList.remove('hidden'); void modal.offsetWidth; backdrop.classList.remove('opacity-0'); sheet.classList.remove('translate-y-full'); document.body.style.overflow = 'hidden'; renderCartModalItems(); }
export function closeCartModal() { const backdrop = document.getElementById('cart-backdrop'); const sheet = document.getElementById('cart-sheet'); backdrop.classList.add('opacity-0'); sheet.classList.add('translate-y-full'); setTimeout(() => { document.getElementById('cart-modal').classList.add('hidden'); document.body.style.overflow = ''; sheet.style.transform = ''; }, 500); }
export function openFAQ() { haptic('light'); const modal = document.getElementById('faq-modal'); const backdrop = document.getElementById('faq-backdrop'); const sheet = document.getElementById('faq-sheet'); modal.classList.remove('hidden'); void modal.offsetWidth; backdrop.classList.remove('opacity-0'); sheet.classList.remove('translate-y-full'); document.body.style.overflow = 'hidden'; }
export function closeFAQ() { const backdrop = document.getElementById('faq-backdrop'); const sheet = document.getElementById('faq-sheet'); backdrop.classList.add('opacity-0'); sheet.classList.add('translate-y-full'); setTimeout(() => { document.getElementById('faq-modal').classList.add('hidden'); document.body.style.overflow = ''; }, 500); }
export function showPreview(img) { haptic('light'); const modal = document.getElementById('image-preview-modal'); const imgEl = document.getElementById('preview-img-element'); imgEl.src = img; modal.classList.remove('hidden'); void modal.offsetWidth; modal.classList.remove('opacity-0'); imgEl.classList.remove('scale-90'); imgEl.classList.add('scale-100'); }
export function hidePreview() { const modal = document.getElementById('image-preview-modal'); const imgEl = document.getElementById('preview-img-element'); modal.classList.add('opacity-0'); imgEl.classList.remove('scale-100'); imgEl.classList.add('scale-90'); setTimeout(() => modal.classList.add('hidden'), 400); }

export function openReceiptModal() { 
    haptic('light'); 
    logEvent('receipt_opened', {}); 
    const modal = document.getElementById('receipt-modal'); 
    const backdrop = document.getElementById('receipt-backdrop'); 
    // Render Receipt Data
    import('./cart.js').then(module => module.buildReceiptData());
    
    closeCartModal(); // Hide shopping cart
    modal.classList.remove('hidden'); 
    void modal.offsetWidth; 
    backdrop.classList.remove('opacity-0', 'pointer-events-none'); 
    modal.classList.remove('translate-y-full', 'pointer-events-none'); 
    document.body.style.overflow = 'hidden'; 
}

export function closeReceiptModal() { 
    const modal = document.getElementById('receipt-modal'); 
    const backdrop = document.getElementById('receipt-backdrop'); 
    backdrop.classList.add('opacity-0', 'pointer-events-none'); 
    modal.classList.add('translate-y-full', 'pointer-events-none'); 
    setTimeout(() => { document.body.style.overflow = ''; }, 500); 
}

// FOMO SOCIAL PROOF DYNAMIC
export function initSocialProofFOMO() {
    const fomoNames = ['Ana', 'María', 'Valentina', 'Carla', 'Sofia', 'Andrea'];
    const fomoCities = ['Caracas', 'Valencia', 'Barquisimeto', 'Maracaibo', 'Lechería'];
    const fomoActions = ['acaba de pedir una Caja x20', 'reservó una Caja x50', 'agregó al carrito perfumes Lattafa', 'subió a Nivel Mayorista'];

    setInterval(() => {
        let name = fomoNames[Math.floor(Math.random() * fomoNames.length)];
        let city = fomoCities[Math.floor(Math.random() * fomoCities.length)];
        let action = fomoActions[Math.floor(Math.random() * fomoActions.length)];
        
        let text = `🔥 ${name} de ${city} ${action}`;
        showIOSNotification(text, 'success');
    }, Math.floor(Math.random() * (60000 - 35000 + 1) + 35000)); // Entre 35s a 60s
}

export function togglePabbot() {
    haptic('light');
    const menu = document.getElementById('pabbot-menu');
    const fabIcon = document.querySelector('#pabbot-fab .fa-comment-dots');
    const closeIcon = document.querySelector('#pabbot-fab .fa-times');
    
    if (menu.classList.contains('scale-0')) {
        menu.classList.remove('scale-0', 'opacity-0', 'pointer-events-none');
        fabIcon.classList.add('scale-0', '-rotate-90');
        closeIcon.classList.remove('scale-0', 'rotate-90');
        logEvent('pabbot_opened', {});
    } else {
        menu.classList.add('scale-0', 'opacity-0', 'pointer-events-none');
        fabIcon.classList.remove('scale-0', '-rotate-90');
        closeIcon.classList.add('scale-0', 'rotate-90');
    }
}

// --- SISTEMA DE TOUR GAMIFICADO ---
const tourData = [
    { targetId: 'tour-step-combos', icon: 'fa-box-open', title: 'Paso 1 de 3: Cajas Inteligentes', text: 'Haz tu primer pedido con un solo toque y accede al precio mayorista automático.', btn: 'Siguiente' },
    { targetId: 'sticky-cart', icon: 'fa-shopping-bag', title: 'Paso 2 de 3: Descubre tu Ganancia', text: 'Aquí verás bajar tu precio. ¡Añade 20 unidades para empezar a multiplicar tu margen de ganancia!', btn: 'Siguiente' },
    { targetId: 'pabbot-fab', icon: 'fa-robot', title: 'Paso 3 de 3: Soporte VIP', text: '¿Dudas con los márgenes o los despachos a nivel nacional? Haz clic aquí en cualquier momento.', btn: '¡Vamos a emprender!' }
];

let currentTourStep = 0;
let activeTourTarget = null;
let originalZIndex = '';

export function startTour() {
    closeCartModal(); currentTourStep = 0;
    const overlay = document.getElementById('tour-overlay');
    const tooltip = document.getElementById('tour-tooltip');
    overlay.classList.remove('hidden'); tooltip.classList.remove('hidden');
    void overlay.offsetWidth; overlay.classList.remove('opacity-0');
    document.getElementById('catalog-zone').classList.remove('hidden');
    // Aplicar Blur Global al fondo de forma controlada
    document.getElementById('catalog-zone').classList.add('blur-sm', 'transition-all', 'duration-500');
    document.querySelector('header').classList.add('blur-sm', 'transition-all', 'duration-500');
    renderTourStep();
}

export function renderTourStep() {
    if (activeTourTarget) {
        activeTourTarget.classList.remove('z-[160]', 'ring-4', 'ring-iosBlue', 'ring-offset-8', 'ring-offset-black/50', 'rounded-2xl', 'shadow-[0_0_40px_rgba(0,122,255,0.4)]', 'bg-white');
        activeTourTarget.style.pointerEvents = '';
        if(activeTourTarget.dataset.origPos) activeTourTarget.style.position = activeTourTarget.dataset.origPos;
        else activeTourTarget.style.position = '';
        activeTourTarget.style.zIndex = originalZIndex;
    }

    const step = tourData[currentTourStep];
    activeTourTarget = document.getElementById(step.targetId);
    
    if (activeTourTarget) {
        activeTourTarget.dataset.origPos = window.getComputedStyle(activeTourTarget).position;
        originalZIndex = window.getComputedStyle(activeTourTarget).zIndex;
        if(activeTourTarget.dataset.origPos === 'static') activeTourTarget.style.position = 'relative';
        
        // Modales de Enfoque con Glow Brillante
        activeTourTarget.classList.add('z-[160]', 'ring-4', 'ring-iosBlue', 'ring-offset-8', 'ring-offset-black/50', 'rounded-2xl', 'shadow-[0_0_40px_rgba(0,122,255,0.4)]');
        activeTourTarget.style.zIndex = '160';
        
        if(step.targetId !== 'brand-filters-container' && step.targetId !== 'pabbot-fab') activeTourTarget.classList.add('bg-white');
        activeTourTarget.style.pointerEvents = 'none';
        
        const yOffset = -250; 
        const y = activeTourTarget.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
    }

    document.getElementById('tour-icon').innerHTML = `<i class="fas ${step.icon}"></i>`;
    document.getElementById('tour-title').innerText = step.title;
    document.getElementById('tour-text').innerText = step.text;
    document.getElementById('tour-next-btn').innerHTML = currentTourStep === tourData.length - 1 ? `${step.btn} <i class="fas fa-check"></i>` : `${step.btn} <i class="fas fa-arrow-right"></i>`;
    
    const dots = document.getElementById('tour-dots').children;
    for(let i=0; i<dots.length; i++) {
        dots[i].className = i === currentTourStep ? "w-4 h-2 rounded-full bg-iosBlue transition-all duration-300" : "w-2 h-2 rounded-full bg-gray-200 transition-all duration-300";
    }

    const tooltip = document.getElementById('tour-tooltip');
    tooltip.classList.remove('opacity-0', 'scale-90');
}

export function nextTourStep() {
    haptic('light');
    const tooltip = document.getElementById('tour-tooltip');
    tooltip.classList.add('opacity-0', 'scale-90');
    if (currentTourStep < tourData.length - 1) { setTimeout(() => { currentTourStep++; renderTourStep(); }, 300); } 
    else { setTimeout(endTour, 300); }
}

export function endTour() {
    haptic('success');
    const overlay = document.getElementById('tour-overlay');
    const tooltip = document.getElementById('tour-tooltip');
    overlay.classList.add('opacity-0'); tooltip.classList.add('opacity-0', 'scale-90');
    
    document.getElementById('catalog-zone').classList.remove('blur-sm');
    document.querySelector('header').classList.remove('blur-sm');

    if (activeTourTarget) {
        activeTourTarget.classList.remove('z-[160]', 'ring-4', 'ring-iosBlue', 'ring-offset-8', 'ring-offset-black/50', 'rounded-2xl', 'shadow-[0_0_40px_rgba(0,122,255,0.4)]', 'bg-white');
        activeTourTarget.style.pointerEvents = '';
        if(activeTourTarget.dataset.origPos) activeTourTarget.style.position = activeTourTarget.dataset.origPos;
        else activeTourTarget.style.position = '';
        activeTourTarget.style.zIndex = originalZIndex;
        activeTourTarget = null;
    }
    setTimeout(() => { overlay.classList.add('hidden'); tooltip.classList.add('hidden'); }, 300);
    showIOSNotification("¡Comienza tu emprendimiento ahora!", "success");
}
