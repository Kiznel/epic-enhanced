// content.js
// Version: 3.8.0 - Final bug fixes and feature implementations.

// --- Globals ---
let settings = {
    previewOnHover: true,
    enablePriceComparison: true,
    enableInLibraryIndicator: true,
    priceComparedCountries: [],
    enableQuickPurchaseLink: true
};
const exchangeRateCache = new Map();
let activeFetchController = null;
let activePriceFetchController = null;
let hidePopupsTimeout = null;
let carouselInterval = null;

// --- Mappings ---
const currencyToCountryMap = {
    'AED': 'AE', 'AFN': 'AF', 'ALL': 'AL', 'AMD': 'AM', 'ANG': 'CW', 'AOA': 'AO', 'ARS': 'AR',
    'AUD': 'AU', 'AWG': 'AW', 'AZN': 'AZ', 'BAM': 'BA', 'BBD': 'BB', 'BDT': 'BD', 'BGN': 'BG',
    'BHD': 'BH', 'BIF': 'BI', 'BMD': 'BM', 'BND': 'BN', 'BOB': 'BO', 'BRL': 'BR', 'BSD': 'BS',
    'BTN': 'BT', 'BWP': 'BW', 'BYN': 'BY', 'BZD': 'BZ', 'CAD': 'CA', 'CDF': 'CD', 'CHF': 'CH',
    'CLP': 'CL', 'CNY': 'CN', 'COP': 'CO', 'CRC': 'CR', 'CUP': 'CU', 'CVE': 'CV', 'CZK': 'CZ',
    'DJF': 'DJ', 'DKK': 'DK', 'DOP': 'DO', 'DZD': 'DZ', 'EGP': 'EG', 'ERN': 'ER', 'ETB': 'ET',
    'EUR': 'DE', 'FJD': 'FJ', 'FKP': 'FK', 'GBP': 'GB', 'GEL': 'GE', 'GGP': 'GG', 'GHS': 'GH', 
    'GIP': 'GI', 'GMD': 'GM', 'GNF': 'GN', 'GTQ': 'GT', 'GYD': 'GY', 'HKD': 'HK', 'HNL': 'HN', 
    'HRK': 'HR', 'HTG': 'HT', 'HUF': 'HU', 'IDR': 'ID', 'ILS': 'IL', 'IMP': 'IM', 'INR': 'IN', 
    'IQD': 'IQ', 'IRR': 'IR', 'ISK': 'IS', 'JEP': 'JE', 'JMD': 'JM', 'JOD': 'JO', 'JPY': 'JP', 
    'KES': 'KE', 'KGS': 'KG', 'KHR': 'KH', 'KMF': 'KM', 'KPW': 'KP', 'KRW': 'KR', 'KWD': 'KW', 
    'KYD': 'KY', 'KZT': 'KZ', 'LAK': 'LA', 'LBP': 'LB', 'LRD': 'LR', 'LSL': 'LS', 
    'LYD': 'LY', 'MAD': 'MA', 'MDL': 'MD', 'MGA': 'MG', 'MKD': 'MK', 'MMK': 'MM', 'MNT': 'MN', 
    'MOP': 'MO', 'MRU': 'MR', 'MUR': 'MU', 'MVR': 'MV', 'MWK': 'MW', 'MXN': 'MX', 'MYR': 'MY', 
    'MZN': 'MZ', 'NAD': 'NA', 'NGN': 'NG', 'NIO': 'NI', 'NOK': 'NO', 'NPR': 'NP', 'NZD': 'NZ', 
    'OMR': 'OM', 'PAB': 'PA', 'PEN': 'PE', 'PGK': 'PG', 'PHP': 'PH', 'PKR': 'PK', 'PLN': 'PL', 
    'PYG': 'PY', 'QAR': 'QA', 'RON': 'RO', 'RSD': 'RS', 'RUB': 'RU', 'RWF': 'RW', 'SAR': 'SA', 
    'SBD': 'SB', 'SCR': 'SC', 'SDG': 'SD', 'SEK': 'SE', 'SGD': 'SG', 'SHP': 'SH', 'SLL': 'SL', 
    'SOS': 'SO', 'SRD': 'SR', 'SSP': 'SS', 'STN': 'ST', 'SVC': 'SV', 'SYP': 'SY', 'SZL': 'SZ', 
    'THB': 'TH', 'TJS': 'TJ', 'TMT': 'TM', 'TND': 'TN', 'TOP': 'TO', 'TRY': 'TR', 'TTD': 'TT', 
    'TWD': 'TW', 'TZS': 'TZ', 'UAH': 'UA', 'UGX': 'UG', 'USD': 'US', 'UYU': 'UY', 'UZS': 'UZ', 
    'VES': 'VE', 'VND': 'VN', 'VUV': 'VU', 'WST': 'WS', 'XAF': 'CM', 'XCD': 'AG', 'XOF': 'SN', 
    'XPF': 'PF', 'YER': 'YE', 'ZAR': 'ZA', 'ZMW': 'ZM', 'ZWL': 'ZW'
};


// --- DOM Element IDs and Selectors ---
const LIBRARY_POPUP_ID = 'epic-enhanced-in-library-popup-instance';
const PREVIEW_POPUP_ID = 'epic-enhanced-preview-overlay-instance';
const REGIONAL_PRICE_POPUP_ID = 'epic-enhanced-regional-price-popup-instance';
const LOADING_INDICATOR_CLASS = 'epic-enhanced-loading-indicator';
const PREVIEW_TARGET_SELECTOR = 'div.css-uwwqev';
const TARGET_GAME_ELEMENT_SELECTOR = 'a.css-g3jcms';
const PRICE_CONTAINER_SELECTOR = '.css-169q7x3'; 
const OWNED_GAME_DARKEN_CLASS = 'epic-enhanced-owned-poster-darken';
const STYLED_FOR_OWNERSHIP_ATTR = 'data-epic-enhanced-styled';
const LISTENERS_ATTACHED_ATTR = 'data-epic-enhanced-listeners';
const PRICE_HOVER_ENABLED_CLASS = 'epic-enhanced-price-hover-enabled';
const SVG_TICK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" class="popup-icon" viewBox="-10 -10 468.8 468.8"><path fill="currentColor" stroke-width="10" stroke="currentColor" d="M142.8 323.85L35.7 216.75 0 252.45l142.8 142.8 306-306-35.7-35.7z"></path></svg>`;
const IN_LIBRARY_BUTTON_SELECTOR = 'button[data-testid="purchase-cta-button"]:disabled';
const CHECKOUT_BUTTON_CONTAINER_SELECTOR = 'div[data-testid="cart-summary-cta"]';

// --- Regional Price Fetching ---
async function getExchangeRate(baseCurrency, targetCurrency) {
    if (baseCurrency === targetCurrency) return 1;
    const cacheKey = `${baseCurrency}-${targetCurrency}`;
    const cached = exchangeRateCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 3600000)) { return cached.rate; }
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        if (!response.ok) throw new Error(`Exchange rate API failed`);
        const data = await response.json();
        const rate = data.rates[targetCurrency];
        if (!rate) throw new Error(`Rate not found`);
        exchangeRateCache.set(cacheKey, { rate, timestamp: Date.now() });
        return rate;
    } catch (error) { return null; }
}

async function fetchPriceForCountry(offerId, sandboxId, countryCode, signal) {
    const variables = { offerId, sandboxId, country: countryCode, locale: 'en-US' };
    const extensions = { persistedQuery: { version: 1, sha256Hash: "abafd6e0aa80535c43676f533f0283c7f5214a59e9fae6ebfb37bed1b1bb2e9b" } };
    const url = `https://store.epicgames.com/graphql?operationName=getCatalogOffer&variables=${encodeURIComponent(JSON.stringify(variables))}&extensions=${encodeURIComponent(JSON.stringify(extensions))}`;
    
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const json = await response.json();
    const totalPrice = json?.data?.Catalog?.catalogOffer?.price?.totalPrice;
    if (!totalPrice) throw new Error(`Invalid price data`);

    const zeroDecimalCurrencies = ['JPY', 'KRW'];
    const currency = totalPrice.currencyCode;
    const decimals = zeroDecimalCurrencies.includes(currency) ? 0 : totalPrice.currencyInfo?.decimals || 2;
    const amountInMajorUnit = totalPrice.discountPrice / Math.pow(10, decimals);
    
    let formattedPrice;
    if (totalPrice.fmtPrice && totalPrice.fmtPrice.discountPrice) {
        formattedPrice = totalPrice.fmtPrice.discountPrice;
    } else {
        try {
            formattedPrice = formatCurrency(amountInMajorUnit, currency);
        } catch (e) { formattedPrice = `${amountInMajorUnit.toFixed(decimals)} ${currency}`; }
    }
    
    return {
        formatted: formattedPrice,
        amount: amountInMajorUnit,
        currency: currency
    };
}

async function getRegionalPrices(requestData, signal) {
    const { offerId, sandboxId, countries, userCurrency, basePrice } = requestData;
    const pricePromises = countries.map(async (countryCode) => {
        try {
            if (signal.aborted) return { countryCode, error: "Cancelled" };
            const regionalPrice = await fetchPriceForCountry(offerId, sandboxId, countryCode, signal);
            const rate = await getExchangeRate(regionalPrice.currency, userCurrency);
            if (rate === null) return { countryCode, error: 'Conversion failed' };
            
            const convertedAmount = regionalPrice.amount * rate;
            const difference = basePrice.amount === 0 ? 0 : ((convertedAmount - basePrice.amount) / basePrice.amount) * 100;
            
            return { countryCode, regionalPrice, convertedAmount, difference, error: null };
        } catch (error) {
            return { countryCode, error: error.message };
        }
    });
    return Promise.all(pricePromises);
}

// --- Popup Creation and Management ---
function createManagedPopup(id, className) {
    let popup = document.getElementById(id);
    if (!popup) {
        popup = document.createElement('div');
        popup.id = id;
        popup.className = className;
        document.body.appendChild(popup);
        popup.addEventListener('mouseenter', () => clearTimeout(hidePopupsTimeout));
        popup.addEventListener('mouseleave', scheduleHideAllPopups);
        popup.addEventListener('contextmenu', e => e.preventDefault());
    }
    return popup;
}

function showLibraryPopup(targetCardElement) {
    if (!settings.enableInLibraryIndicator) return;
    const popup = createManagedPopup(LIBRARY_POPUP_ID, 'epic-enhanced-in-library-popup');
    popup.innerHTML = `${SVG_TICK_ICON}<span class="popup-text">In Library</span>`;
    if (!targetCardElement) return;
    
    popup.classList.add('visible');
    const targetRect = targetCardElement.getBoundingClientRect();
    
    const topOffset = 12; 
    const spinnerLeft = 12;
    const spinnerWidth = 20;
    const spacing = 12; 

    const leftOffset = settings.previewOnHover ? (spinnerLeft + spinnerWidth + spacing) : spinnerLeft;
    
    popup.style.top = `${targetRect.top + topOffset}px`;
    popup.style.left = `${targetRect.left + leftOffset}px`;
}

async function showPreviewPopup(targetElement, gameCardElement) {
    if (!settings.previewOnHover) return;
    if (activeFetchController) activeFetchController.abort();
    document.querySelectorAll(`.${LOADING_INDICATOR_CLASS}`).forEach(el => el.remove());
    activeFetchController = new AbortController();
    const signal = activeFetchController.signal;

    const popup = createManagedPopup(PREVIEW_POPUP_ID, 'epic-enhanced-preview-overlay');
    
    if (popup.mouseHandler) {
        popup.removeEventListener('mousedown', popup.mouseHandler);
    }
    
    popup.mouseHandler = (e) => {
        if (e.target.closest('button')) return;
        if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
            gameCardElement.click();
        } else if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
            e.preventDefault();
            window.open(gameCardElement.href, '_blank');
        }
    };
    popup.addEventListener('mousedown', popup.mouseHandler);
    
    const parentContainer = gameCardElement.closest('[data-component]');
    if (!parentContainer) return;

    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = LOADING_INDICATOR_CLASS;
    parentContainer.appendChild(loadingIndicator);

    try {
        const gameInfo = getGameInfoFromCardElement(gameCardElement);
        if (!gameInfo || !gameInfo.pageSlugFromCard) throw new Error(`Could not determine Page Slug from card.`);
        
        const ownershipResponse = await chrome.runtime.sendMessage({ action: "checkGameInLibrary", ...gameInfo });
        const isOwned = ownershipResponse && ownershipResponse.inLibrary;

        const previewData = await fetchPreviewData(gameInfo.pageSlugFromCard, signal);
        
        if (previewData.isOwnedOnPage && !isOwned) {
             passivelyAddGame(gameInfo.pageSlugFromCard, previewData.title);
        }

        if (signal.aborted) return;
        if (!previewData.imageUrls || previewData.imageUrls.length === 0) {
            loadingIndicator.remove();
            return;
        }

        const targetRect = targetElement.getBoundingClientRect();
        if (!targetRect || targetRect.width === 0) {
            loadingIndicator.remove();
            return;
        }
        
        const newHeight = targetRect.height * 1.75;
        const carouselHeight = newHeight * 0.55;
        const newWidth = carouselHeight * (16 / 9);

        let top = targetRect.top - (newHeight - targetRect.height) / 2;
        let left = targetRect.left - (newWidth - targetRect.width) / 2;
        const margin = 10;

        if (top < margin) {
            top = margin;
        }
        if (top + newHeight > window.innerHeight - margin) {
            top = window.innerHeight - newHeight - margin;
        }
        if (left < margin) {
            left = margin;
        }
        if (left + newWidth > window.innerWidth - margin) {
            left = window.innerWidth - newWidth - margin;
        }
        
        popup.style.width = `${newWidth}px`;
        popup.style.height = `${newHeight}px`;
        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
        
        if (previewData.imageUrls.length > 1) {
            buildAndRunCarousel(popup, previewData, gameCardElement, isOwned);
        } else {
            buildStaticImage(popup, previewData, gameCardElement, isOwned);
        }
        popup.classList.add('visible');
    } catch (error) {
        if (error.name !== 'AbortError') console.error("Error building preview:", error);
    } finally {
        loadingIndicator.remove();
    }
}

function buildAndRunCarousel(popupElement, previewData, gameCardElement, isOwned) {
    const { imageUrls } = previewData;
    popupElement.innerHTML = ''; 
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'preview-carousel-container';
    carouselContainer.innerHTML = `${imageUrls.map((url, index) => `<img src="${url}" class="preview-carousel-image ${index === 0 ? 'active' : ''}" />`).join('')}<div class="carousel-progress-bar"><div class="carousel-progress-bar-inner"></div></div>`;
    popupElement.appendChild(carouselContainer);
    appendPreviewDetails(popupElement, previewData, gameCardElement, isOwned);
    let currentIndex = 0;
    const images = popupElement.querySelectorAll('.preview-carousel-image');
    const progressBarInner = popupElement.querySelector('.carousel-progress-bar-inner');
    const cycleTime = 5000;
    const cycle = () => {
        if (!popupElement.classList.contains('visible')) {
            clearInterval(carouselInterval);
            carouselInterval = null;
            return;
        }
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
        progressBarInner.style.animation = 'none';
        void progressBarInner.offsetWidth; 
        progressBarInner.style.animation = `progressBarAnimation ${cycleTime / 1000}s linear forwards`;
    };
    progressBarInner.style.animation = `progressBarAnimation ${cycleTime / 1000}s linear forwards`;
    if (images.length > 1) carouselInterval = setInterval(cycle, cycleTime);
}

function buildStaticImage(popupElement, previewData, gameCardElement, isOwned) {
    const { imageUrls } = previewData;
    popupElement.innerHTML = '';
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'preview-carousel-container';
    if(imageUrls && imageUrls.length > 0) {
        carouselContainer.innerHTML = `<img src="${imageUrls[0]}" class="preview-carousel-image active" />`;
    }
    popupElement.appendChild(carouselContainer);
    appendPreviewDetails(popupElement, previewData, gameCardElement, isOwned);
}

function appendPreviewDetails(popupElement, previewData, gameCardElement, isOwned) {
    const { title, description, tags, releaseInfo } = previewData;
    
    if (title) {
        const titleContainer = document.createElement('div');
        titleContainer.className = 'preview-title-container';

        const titleElement = document.createElement('span');
        titleElement.className = 'preview-title-text';
        titleElement.textContent = title;
        titleContainer.appendChild(titleElement);

        if (isOwned && settings.enableInLibraryIndicator) {
            const inLibraryPill = document.createElement('span');
            inLibraryPill.className = 'preview-in-library-pill';
            inLibraryPill.textContent = 'In Library';
            titleContainer.appendChild(inLibraryPill);
        }
        
        popupElement.appendChild(titleContainer);
    }

    if (description) {
        const descriptionElement = document.createElement('div');
        descriptionElement.className = 'preview-description';
        descriptionElement.textContent = description;
        popupElement.appendChild(descriptionElement);
    }
    if (tags && tags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'preview-tags-container';
        tags.forEach(tagText => {
            const tagElement = document.createElement('span');
            tagElement.className = 'preview-tag';
            tagElement.textContent = tagText;
            tagsContainer.appendChild(tagElement);
        });
        popupElement.appendChild(tagsContainer);
    }
    
    if (releaseInfo && releaseInfo.label && releaseInfo.value) {
        const { label, value } = releaseInfo;
        const releaseDateContainer = document.createElement('div');
        releaseDateContainer.className = 'preview-release-info';
        releaseDateContainer.innerHTML = `<span class="preview-release-label">${label}:</span><span class="preview-release-value">${value}</span>`;
        popupElement.appendChild(releaseDateContainer);
    }

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'preview-actions-container';
    const wishlistButton = gameCardElement.parentElement.querySelector('button[aria-label*="Wishlist"]');
    if (wishlistButton) {
        const newWishlistButton = document.createElement('button');
        newWishlistButton.className = 'preview-action-button preview-action-button--secondary';
        const isWishlisted = wishlistButton.getAttribute('aria-label').toLowerCase().includes('remove from wishlist');
        newWishlistButton.textContent = isWishlisted ? 'In Wishlist' : 'Add to Wishlist';
        newWishlistButton.disabled = wishlistButton.disabled;
        newWishlistButton.addEventListener('click', e => {
            e.stopPropagation();
            wishlistButton.click();
            newWishlistButton.textContent = newWishlistButton.textContent === 'In Wishlist' ? 'Add to Wishlist' : 'In Wishlist';
        });
        actionsContainer.appendChild(newWishlistButton);
    }

    if (actionsContainer.hasChildNodes()) {
        popupElement.appendChild(actionsContainer);
    }
}


function hidePreviewPopupAndSpinner() {
    clearInterval(carouselInterval);
    carouselInterval = null;
    if (activeFetchController) {
        activeFetchController.abort();
        activeFetchController = null;
    }
    document.querySelectorAll(`.${LOADING_INDICATOR_CLASS}`).forEach(el => el.remove());
    const previewPopup = document.getElementById(PREVIEW_POPUP_ID);
    if (previewPopup) {
        previewPopup.classList.remove('visible');
        previewPopup.innerHTML = '';
    }
}

async function showRegionalPricePopup(targetElement) {
    if (!settings.enablePriceComparison) return;
    if (activePriceFetchController) activePriceFetchController.abort();
    activePriceFetchController = new AbortController();

    const popup = createManagedPopup(REGIONAL_PRICE_POPUP_ID, 'epic-enhanced-regional-price-popup');
    popup.innerHTML = '<div class="price-loading-spinner"></div>';
    popup.className = 'epic-enhanced-regional-price-popup'; 

    const targetRect = targetElement.getBoundingClientRect();

    const repositionPopup = () => {
        const popupHeight = popup.offsetHeight;
        const popupWidth = popup.offsetWidth;
        const spacing = 12;

        let top = targetRect.top + (targetRect.height / 2) - (popupHeight / 2);
        let left = targetRect.left - popupWidth - spacing;

        popup.classList.remove('arrow-on-left');

        const margin = 10;
        if (left < margin) {
            left = targetRect.right + spacing;
            popup.classList.add('arrow-on-left');
        }

        if (top < margin) {
            top = margin;
        }
        if (top + popupHeight > window.innerHeight - margin) {
            top = window.innerHeight - popupHeight - margin;
        }

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        popup.style.visibility = 'visible';
    };

    popup.style.visibility = 'hidden';
    popup.style.left = '-9999px';
    popup.style.top = '-9999px';
    popup.classList.add('visible');

    repositionPopup();

    try {
        const pageSlug = getProductSlugFromUrl(window.location.href);
        if (!pageSlug) throw new Error("Could not determine page slug.");

        const offerDetails = await fetchOfferDetails(pageSlug, activePriceFetchController.signal);
        
        if (!offerDetails.offerId || !offerDetails.sandboxId) throw new Error("Could not retrieve offer details from any source.");
        
        let basePrice;
        let finalPriceEl = targetElement.querySelector('span.css-12s1vua b');
        if (!finalPriceEl) {
            finalPriceEl = targetElement.querySelector('span[data-testid="current-price"]');
        }
        if (!finalPriceEl) {
            const priceSpans = targetElement.querySelectorAll('span');
            for (let i = priceSpans.length - 1; i >= 0; i--) {
                if (/[£$€]/.test(priceSpans[i].textContent) || /Ft/.test(priceSpans[i].textContent) ) {
                    finalPriceEl = priceSpans[i];
                    break;
                }
            }
        }
        
        if (finalPriceEl && finalPriceEl.textContent.trim().toLowerCase() === 'free') {
            const strikedEl = targetElement.querySelector('s, .css-4jky3p');
            const originalPriceText = strikedEl ? strikedEl.textContent : 'USD0';
            const originalPriceInfo = parsePrice(originalPriceText);
            basePrice = { amount: 0, currency: originalPriceInfo.currency, formatted: formatCurrency(0, originalPriceInfo.currency) };
        } else if (finalPriceEl) {
            basePrice = parsePrice(finalPriceEl.textContent);
        } else {
             basePrice = parsePrice(targetElement.textContent);
        }
        
        const baseCountryCode = getCountryCodeFromCurrency(basePrice.currency);
        
        const priceData = await getRegionalPrices({
            ...offerDetails,
            countries: settings.priceComparedCountries,
            userCurrency: basePrice.currency,
            basePrice
        }, activePriceFetchController.signal);
        
        if (activePriceFetchController.signal.aborted) return;
        
        buildPriceTable(popup, priceData, basePrice, baseCountryCode);
        repositionPopup();

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error("[EpicEnhanced] Price Comparison Error:", error);
            popup.innerHTML = `<div class="price-error">${error.message}</div>`;
            repositionPopup();
        }
    }
}

function buildPriceTable(popup, priceData, basePrice, baseCountryCode) {
    const basePriceRow = {
        countryCode: baseCountryCode,
        regionalPrice: { formatted: basePrice.formatted },
        convertedAmount: basePrice.amount,
        difference: 0,
        error: null
    };

    const finalOrderedPrices = [basePriceRow];

    settings.priceComparedCountries.forEach(countryCode => {
        if (countryCode === baseCountryCode) return;
        
        const priceInfo = priceData.find(p => p.countryCode === countryCode);
        if (priceInfo) {
            finalOrderedPrices.push(priceInfo);
        }
    });

    let tableHtml = '<div class="price-comparison-scroll-container"><div class="price-comparison-table">';

    finalOrderedPrices.forEach(data => {
        if (data.error) {
            tableHtml += `<div class="price-row"><div class="price-flag-cell">${getCountryFlag(data.countryCode)}</div><div class="price-error-cell" colspan="3">${data.error}</div></div>`;
            return;
        }
        const diffClass = data.difference < -0.01 ? 'price-cheaper' : data.difference > 0.01 ? 'price-expensive' : 'price-equal';
        const diffSymbol = data.difference < -0.01 ? '▼' : data.difference > 0.01 ? '▲' : '=';
        
        const convertedFormatted = formatCurrency(data.convertedAmount, basePrice.currency);
        
        tableHtml += `
            <div class="price-row">
                <div class="price-flag-cell">${getCountryFlag(data.countryCode)}</div>
                <div>${data.regionalPrice.formatted}</div>
                <div>${convertedFormatted}</div>
                <div class="${diffClass}">${Math.abs(data.difference).toFixed(2)}% ${diffSymbol}</div>
            </div>
        `;
    });
    tableHtml += '</div></div>';
    popup.innerHTML = tableHtml;
}


function hideAllPopupsImmediately() {
    hidePreviewPopupAndSpinner();
    const libraryPopup = document.getElementById(LIBRARY_POPUP_ID);
    if (libraryPopup) libraryPopup.classList.remove('visible');
    const pricePopup = document.getElementById(REGIONAL_PRICE_POPUP_ID);
    if (pricePopup) pricePopup.classList.remove('visible');
    if (activePriceFetchController) activePriceFetchController.abort();
}

function scheduleHideAllPopups() {
    clearTimeout(hidePopupsTimeout);
    hidePopupsTimeout = setTimeout(() => {
        hideAllPopupsImmediately();
    }, 150);
}

// --- Data Fetching and Info Extraction ---
async function fetchPreviewData(slug, signal) {
    const productUrl = `https://store.epicgames.com/en-US/p/${slug}`;
    const [htmlResponse, offerDetails] = await Promise.all([
        fetch(productUrl, { signal }),
        fetchOfferDetails(slug, signal)
    ]);

    if (!htmlResponse.ok) throw new Error(`HTML fetch failed: ${htmlResponse.status}`);
    const htmlText = await htmlResponse.text();
    const html = new DOMParser().parseFromString(htmlText, 'text/html');

    const ogImage = html.querySelector('meta[property="og:image"]');
    const mainImageUrl = ogImage ? ogImage.content.split('?')[0] : null;
    const imageUrlSet = new Set();
    if (mainImageUrl) imageUrlSet.add(mainImageUrl);
    html.querySelectorAll('button[data-testid="thumbnail-button"]').forEach(button => {
        if (button.querySelector('span[data-testid="icon"]')) return;
        const imgElement = button.querySelector('img');
        if (imgElement) {
            let imageUrl = imgElement.dataset.image || imgElement.src;
            if (imageUrl) imageUrlSet.add(imageUrl.split('?')[0]);
        }
    });
    
    const title = html.querySelector('#app-main-content h1')?.textContent.trim() || html.querySelector('.css-1rn9p2c')?.textContent.trim() || document.title.split('|')[0].trim();
    const description = html.querySelector('.css-1myreog')?.textContent.trim() || null;
    let tags = Array.from(html.querySelectorAll('div[data-testid="about-metadata-layout-column"] a span span')).map(el => el.textContent.trim()).filter(Boolean);
    tags = [...new Set(tags)];
    if (html.querySelector('a[href*="/achievements/"]') && !tags.includes('Achievements')) tags.push('Achievements');

    let releaseInfo = { label: null, value: null };
    const labelSpan = Array.from(html.querySelectorAll('span')).find(span => {
        const text = span.textContent.trim().toLowerCase();
        return text === 'release date' || text === 'available';
    });

    if (labelSpan) {
        const valueElement = labelSpan.nextElementSibling;
        if (valueElement) {
            const labelText = labelSpan.textContent.trim();
            const timeElement = valueElement.querySelector('time[datetime]');
            if (timeElement) {
                releaseInfo.label = "Release Date";
                releaseInfo.value = formatReleaseDate(timeElement.getAttribute('datetime'));
            } else {
                releaseInfo.label = labelText;
                releaseInfo.value = valueElement.textContent.trim();
            }
        }
    }

    const inLibraryButton = html.querySelector(IN_LIBRARY_BUTTON_SELECTOR);
    const isOwnedOnPage = !!(inLibraryButton && inLibraryButton.textContent.trim().toLowerCase() === 'in library');

    return { 
        imageUrls: Array.from(imageUrlSet), 
        title, 
        description, 
        tags, 
        releaseInfo, 
        isOwnedOnPage,
        offerId: offerDetails.offerId,
        sandboxId: offerDetails.sandboxId
    };
}

async function fetchOfferDetails(slug, signal) {
    const isSPTOrAddon = /-[a-f0-9]{6,}$/i.test(slug) || slug.includes('--');
    let primaryMethod;

    if (isSPTOrAddon) {
        primaryMethod = async () => {
            const variables = { pageSlug: slug, locale: "en-US" };
            const extensions = { persistedQuery: { version: 1, sha256Hash: "781fd69ec8116125fa8dc245c0838198cdf5283e31647d08dfa27f45ee8b1f30" } };
            const url = `https://store.epicgames.com/graphql?operationName=getMappingByPageSlug&variables=${encodeURIComponent(JSON.stringify(variables))}&extensions=${encodeURIComponent(JSON.stringify(extensions))}`;
            const response = await fetch(url, { signal });
            if (response.ok) {
                const json = await response.json();
                const mapping = json?.data?.StorePageMapping?.mapping;
                const offerId = mapping?.offerId || mapping?.mappings?.offerId || mapping?.mappings?.prePurchaseOfferId;
                const sandboxId = mapping?.sandboxId;
                if (offerId && sandboxId) return { offerId, sandboxId };
            }
            return null;
        };
    } else {
        primaryMethod = async () => {
            const url = `https://store-content-ipv4.ak.epicgames.com/api/en-US/content/products/${slug}`;
            const response = await fetch(url, { signal });
            if (response.ok) {
                const json = await response.json();
                const mainOfferPage = json.pages?.find(p => p._urlPattern === `/productv2/${slug}/home` || p._urlPattern === `/bundles/${slug}`);
                if (mainOfferPage?.offer?.id && mainOfferPage?.offer?.namespace) {
                    return { offerId: mainOfferPage.offer.id, sandboxId: mainOfferPage.offer.namespace };
                }
            }
            return null;
        };
    }

    try {
        const result = await primaryMethod();
        if (result) return result;
    } catch (e) { console.warn("[EpicEnhanced] Primary API method failed, trying fallback.", e.message); }
    
    try {
        const scriptElement = document.getElementById('__NEXT_DATA__');
        if (scriptElement) {
            const jsonData = JSON.parse(scriptElement.textContent);
            const offerData = jsonData?.props?.pageProps?.product?.data?.Catalog?.searchStore?.elements?.[0] || jsonData?.props?.pageProps?.offer;
            if (offerData?.offerId && offerData?.namespace) return { offerId: offerData.offerId, sandboxId: offerData.namespace };
        }
    } catch (e) { console.error("[EpicEnhanced] Failed to parse inline page data.", e); }

    throw new Error("All methods to find offer details failed.");
}


function getGameInfoFromCardElement(gameCardElement) {
    if (!gameCardElement) return null;
    let title = null, offerId = null, namespace = null, pageSlugFromCard = null;
    pageSlugFromCard = getProductSlugFromUrl(gameCardElement.href);
    const offerIdElement = gameCardElement.closest('[data-offer-id]');
    if (offerIdElement) offerId = offerIdElement.dataset.offerId;
    const titleEl = gameCardElement.querySelector('.css-rgqwpc, span[data-testid="offer-title-info-title"], div.css-1e8ix6x, span.css-1vg6q84');
    if (titleEl) title = titleEl.textContent.trim();
    const imgEl = gameCardElement.querySelector('img[src]');
    if (imgEl?.src) {
        const namespaceMatch = imgEl.src.match(/\/(?:offer|item)\/([a-f0-9]{32})\//i);
        if (namespaceMatch) namespace = namespaceMatch[1];
    }
    if (!title && pageSlugFromCard) title = pageSlugFromCard.replace(/-/g, ' ');
    return { titleFromStorePage: title, offerIdFromCard: offerId, namespace: namespace, pageSlugFromCard };
}

async function checkAndApplyStyles(gameCardElement) {
    const parentContainer = gameCardElement.closest('[data-component]');
    if (!parentContainer) return { isOwned: false };

    if (!settings.enableInLibraryIndicator) {
        parentContainer.classList.remove(OWNED_GAME_DARKEN_CLASS);
        parentContainer.setAttribute(STYLED_FOR_OWNERSHIP_ATTR, 'disabled');
        return { isOwned: false };
    }

    parentContainer.setAttribute(STYLED_FOR_OWNERSHIP_ATTR, 'checking');
    const gameInfo = getGameInfoFromCardElement(gameCardElement);
    if (!gameInfo) {
        parentContainer.setAttribute(STYLED_FOR_OWNERSHIP_ATTR, 'no-info');
        return { isOwned: false };
    }
    try {
        const response = await chrome.runtime.sendMessage({ action: "checkGameInLibrary", ...gameInfo });
        if (response && response.inLibrary) {
            parentContainer.classList.add(OWNED_GAME_DARKEN_CLASS);
            parentContainer.setAttribute(STYLED_FOR_OWNERSHIP_ATTR, 'owned');
            return { isOwned: true };
        } else {
            parentContainer.classList.remove(OWNED_GAME_DARKEN_CLASS);
            parentContainer.setAttribute(STYLED_FOR_OWNERSHIP_ATTR, 'not-owned');
            return { isOwned: false };
        }
    } catch (error) {
        parentContainer.setAttribute(STYLED_FOR_OWNERSHIP_ATTR, 'error');
        return { isOwned: false };
    }
}

// --- Helper Functions ---
function getProductSlugFromUrl(url) {
    if (!url) return null;
    try {
        const path = new URL(url, window.location.origin).pathname;
        const slugMatch = path.match(/\/(?:p|product|bundles|addons)\/([^/?#]+)/);
        return slugMatch ? slugMatch[1].toLowerCase() : null;
    } catch (e) { return null; }
}

function parsePrice(priceString) {
    const originalFormatted = priceString;
    let currency = 'USD'; 
    let amount = 0;

    if (!priceString || priceString.trim().toLowerCase() === 'free') {
        return { amount: 0, currency: 'USD', formatted: 'Free' };
    }

    const codeMatch = priceString.match(/[A-Z]{3}/);
    if (codeMatch && currencyToCountryMap[codeMatch[0]]) {
        currency = codeMatch[0];
    } else {
        const symbolMap = [
            { symbol: 'Ft', currency: 'HUF' }, { symbol: 'zł', currency: 'PLN' },
            { symbol: '€', currency: 'EUR' }, { symbol: '£', currency: 'GBP' },
            { symbol: 'CA$', currency: 'CAD' }, { symbol: 'A$', currency: 'AUD' },
            { symbol: 'R$', currency: 'BRL' }, { symbol: '¥', currency: 'JPY' },
            { symbol: '₽', currency: 'RUB' }, { symbol: '$', currency: 'USD' }
        ];
        for (const item of symbolMap) {
            if (priceString.includes(item.symbol)) {
                currency = item.currency;
                break;
            }
        }
    }

    let numberString = priceString.replace(/[^\d.,]/g, '').trim();
    if (numberString) {
        const lastComma = numberString.lastIndexOf(',');
        const lastPeriod = numberString.lastIndexOf('.');
        if (lastComma > lastPeriod) {
            numberString = numberString.replace(/\./g, '').replace(',', '.');
        } else {
            numberString = numberString.replace(/,/g, '');
        }
        amount = parseFloat(numberString);
    }
    
    if (isNaN(amount)) amount = 0;

    return { amount, currency, formatted: originalFormatted };
}

function getCountryCodeFromCurrency(currencyCode) {
    return currencyToCountryMap[currencyCode] || 'US'; 
}

function formatCurrency(amount, currencyCode) {
    try {
        const zeroDecimalCurrencies = ['JPY', 'KRW'];
        const options = {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: zeroDecimalCurrencies.includes(currencyCode) ? 0 : 2,
            maximumFractionDigits: zeroDecimalCurrencies.includes(currencyCode) ? 0 : 2,
        };
        return new Intl.NumberFormat(undefined, options).format(amount);
    } catch (e) { return `${amount.toFixed(2)} ${currencyCode}`; }
}

function formatReleaseDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date)) return null;
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function getCountryFlag(countryCode) {
    if (!countryCode) return '<span></span>';
    const countryCodeLower = countryCode.toLowerCase();
    const flagUrl = `https://flagicons.lipis.dev/flags/1x1/${countryCodeLower}.svg`;
    return `<img src="${flagUrl}" class="price-country-flag" alt="${countryCode}" />`;
}

async function passivelyAddGame(productSlug, title) {
    if (!title || !productSlug) return;
    
    try {
        const ownershipResponse = await chrome.runtime.sendMessage({ 
            action: "checkGameInLibrary", 
            pageSlugFromCard: productSlug, 
            titleFromStorePage: title 
        });

        if (ownershipResponse && ownershipResponse.inLibrary) {
            return;
        }

        const offerDetails = await fetchOfferDetails(productSlug, new AbortController().signal);
        if (offerDetails.offerId && offerDetails.sandboxId) {
            chrome.runtime.sendMessage({
                action: 'addGameToLibrary',
                title: title,
                productSlug: productSlug,
                offerId: offerDetails.offerId,
                namespace: offerDetails.sandboxId
            });
        }
    } catch (error) {
        console.error("Epic Enhanced: Could not fetch offer details for passive add.", error);
    }
}


// --- Event Listener Setup ---
function setupCardListeners(card) {
    if (card.getAttribute(LISTENERS_ATTACHED_ATTR)) return;
    card.setAttribute(LISTENERS_ATTACHED_ATTR, 'true');
    card.addEventListener('mouseenter', async () => {
        if (card.closest('.css-19h5ycu')) return;
        hidePreviewPopupAndSpinner();
        clearTimeout(hidePopupsTimeout);
        const parentComponent = card.closest('[data-component]');
        if (!parentComponent) return;
        let styledStatus = parentComponent.getAttribute(STYLED_FOR_OWNERSHIP_ATTR);
        
        if (styledStatus !== 'owned' && styledStatus !== 'not-owned' && styledStatus !== 'disabled') {
            const { isOwned } = await checkAndApplyStyles(card);
            styledStatus = isOwned ? 'owned' : 'not-owned';
        }

        if (styledStatus === 'owned') {
            showLibraryPopup(parentComponent);
        }

        const previewTarget = card.querySelector(PREVIEW_TARGET_SELECTOR) || card.querySelector('img');
        if (previewTarget) showPreviewPopup(previewTarget, card);
    });
    card.addEventListener('mouseleave', scheduleHideAllPopups);
}

function setupPriceHoverListener(priceElement) {
    const finalPriceEl = priceElement.querySelector('span.css-12s1vua b') || priceElement.querySelector('span[data-testid="current-price"]');
    const priceText = finalPriceEl ? finalPriceEl.textContent.trim() : priceElement.textContent.trim();
    
    if (priceText.toLowerCase() === 'free' && !priceElement.querySelector('s')) {
        priceElement.classList.remove(PRICE_HOVER_ENABLED_CLASS);
        return; 
    }

    if (settings.enablePriceComparison) {
        priceElement.classList.add(PRICE_HOVER_ENABLED_CLASS);
    } else {
        priceElement.classList.remove(PRICE_HOVER_ENABLED_CLASS);
    }

    if (priceElement.getAttribute(LISTENERS_ATTACHED_ATTR)) return;
    priceElement.setAttribute(LISTENERS_ATTACHED_ATTR, 'true');

    priceElement.addEventListener('mouseenter', () => {
        clearTimeout(hidePopupsTimeout);
        showRegionalPricePopup(priceElement);
    });
    priceElement.addEventListener('mouseleave', scheduleHideAllPopups);
}

function addQuickPurchaseButton() {
    if (!settings.enableQuickPurchaseLink) {
        const existingButton = document.getElementById('quick-purchase-btn');
        if (existingButton) existingButton.remove();
        return;
    };

    const checkoutContainer = document.querySelector(CHECKOUT_BUTTON_CONTAINER_SELECTOR);
    if (!checkoutContainer || document.getElementById('quick-purchase-btn')) {
        return;
    }

    const checkoutButton = checkoutContainer.querySelector('button');
    if (!checkoutButton) return;

    const quickPurchaseButton = document.createElement('button');
    quickPurchaseButton.id = 'quick-purchase-btn';
    quickPurchaseButton.className = 'epic-enhanced-quick-purchase-link-btn';
    quickPurchaseButton.textContent = 'Generate Quick-Purchase Link';

    quickPurchaseButton.addEventListener('click', async () => {
        quickPurchaseButton.textContent = 'Generating...';
        quickPurchaseButton.disabled = true;

        try {
            const getCartItemsUrl = 'https://store.epicgames.com/graphql';
            const body = {
                "query": "query getCartItems { Cart { cartItems { elements { id namespace offerId } } } }"
            };
            
            const response = await fetch(getCartItemsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('Failed to fetch cart items.');
            
            const cartData = await response.json();
            const items = cartData?.data?.Cart?.cartItems?.elements;

            if (!items || items.length === 0) {
                 quickPurchaseButton.textContent = 'Cart is empty!';
                 setTimeout(() => {
                    quickPurchaseButton.textContent = 'Generate Quick-Purchase Link';
                    quickPurchaseButton.disabled = false;
                }, 2000);
                return;
            }

            const offerParams = items.map(item => `offers=1-${item.namespace}-${item.offerId}`).join('&');
            const purchaseUrl = `https://store.epicgames.com/purchase?highlightColor=0078f2&${offerParams}`;
            
            const tempInput = document.createElement('textarea');
            tempInput.value = purchaseUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);

            quickPurchaseButton.textContent = 'Copied to clipboard!';

        } catch (error) {
            console.error('Failed to generate quick-purchase link:', error);
            quickPurchaseButton.textContent = 'Error!';
        }

        setTimeout(() => {
            quickPurchaseButton.textContent = 'Generate Quick-Purchase Link';
            quickPurchaseButton.disabled = false;
        }, 2000);
    });

    checkoutButton.parentNode.insertBefore(quickPurchaseButton, checkoutButton.nextSibling);
}

function processPageElements() {
    document.querySelectorAll(TARGET_GAME_ELEMENT_SELECTOR).forEach(card => {
        checkAndApplyStyles(card);
        if (!card.getAttribute(LISTENERS_ATTACHED_ATTR)) {
            setupCardListeners(card);
        }
    });
    
    const path = window.location.pathname;
    if (path.includes('/p/') || path.includes('/bundles/') || path.includes('/addons/')) {
        const priceContainer = document.querySelector(PRICE_CONTAINER_SELECTOR);
        if (priceContainer) {
            setupPriceHoverListener(priceContainer);
        }
        
        const inLibraryButton = document.querySelector(IN_LIBRARY_BUTTON_SELECTOR);
        const isOwnedOnPage = !!(inLibraryButton && inLibraryButton.textContent.trim().toLowerCase() === 'in library');

        if (isOwnedOnPage) {
            passivelyAddGame(getProductSlugFromUrl(window.location.href), document.querySelector('#app-main-content h1')?.textContent.trim() || document.title.split('|')[0].trim());
        }
    }

    if (path.includes('/cart')) {
        addQuickPurchaseButton();
    }
}

// --- Initialization ---
const observer = new MutationObserver(() => {
    let timeoutId;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => processPageElements(), 250);
});

async function initialSetup() {
    const settingKeys = ['previewOnHover', 'enablePriceComparison', 'priceComparedCountries', 'enableInLibraryIndicator', 'enableQuickPurchaseLink'];
    
    await new Promise(resolve => {
        chrome.storage.local.get(settingKeys, (result) => {
            Object.assign(settings, result);
            resolve();
        });
    });
    
    processPageElements();

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'local') return;
        
        const hasRelevantChange = Object.keys(changes).some(key => settingKeys.includes(key));

        if (hasRelevantChange) {
            chrome.storage.local.get(settingKeys, async (result) => {
                Object.assign(settings, result);

                document.querySelectorAll(`[${STYLED_FOR_OWNERSHIP_ATTR}]`).forEach(el => {
                    el.classList.remove(OWNED_GAME_DARKEN_CLASS);
                    el.removeAttribute(STYLED_FOR_OWNERSHIP_ATTR);
                });
                
                processPageElements();
            });
        }
    });
    
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "libraryCacheUpdated") {
            document.querySelectorAll(`[${STYLED_FOR_OWNERSHIP_ATTR}]`).forEach(el => {
                el.removeAttribute(STYLED_FOR_OWNERSHIP_ATTR);
                el.classList.remove(OWNED_GAME_DARKEN_CLASS);
            });
            processPageElements();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('blur', hideAllPopupsImmediately);
    
    window.addEventListener('scroll', (e) => {
        const pricePopup = document.getElementById(REGIONAL_PRICE_POPUP_ID);
        if (pricePopup && pricePopup.contains(e.target)) {
            return; 
        }
        hideAllPopupsImmediately();
    }, true);
}

initialSetup();
