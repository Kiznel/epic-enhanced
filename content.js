// content.js
// Version: 3.8.1 - Added store links to product pages.

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

function slugify(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .toString()
        .replace(/&/g, 'and') // Replace & with 'and'
        .replace(/[™®©:,.!?()']/g, '') // Remove special characters
        .replace(/[\s_]+/g, '-') // Replace spaces and underscores with a hyphen
        .replace(/-+/g, '-') // Replace multiple hyphens with a single one
        .replace(/^-+/, '') // Trim hyphen from start
        .replace(/-+$/, ''); // Trim hyphen from end
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

// --- UPDATED FUNCTION ---
function injectStoreLinks(offerId, gameTitle, container) {
    if (!container) {
        return;
    }
    
    container.innerHTML = ''; // Clear any previous content
    
    // 1. Create egdata link (if offerId is present)
    if (offerId) {
        const egdataLink = document.createElement('a');
        egdataLink.href = `https://egdata.app/offers/${offerId}`;
        egdataLink.target = '_blank';
        egdataLink.rel = 'noopener noreferrer';
        egdataLink.className = 'epic-enhanced-store-link-btn'; // Add class for styling
        egdataLink.title = 'View on egdata.app';
        
        // UPDATED: Replaced icon with the user's provided SVG
        egdataLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<path d="M0 0 C3.70213796 0.01123321 7.40421624 -0.00087293 11.1063503 -0.00984204 C18.33517275 -0.02369228 25.56381914 -0.01628019 32.79263302 -0.00116646 C41.22757869 0.01579046 49.66248168 0.01247136 58.09743915 0.00873946 C73.15498996 0.00287622 88.21245686 0.01697338 103.26998556 0.04168689 C117.85139774 0.06561595 132.43269789 0.07268417 147.01412618 0.06219471 C162.9313031 0.05076469 178.84842836 0.04888014 194.76560467 0.0632928 C196.46528999 0.06481849 198.1649753 0.06633885 199.86466062 0.06785381 C200.70072949 0.06861162 201.53679836 0.06936944 202.39820265 0.07015022 C208.26585344 0.07487595 214.133481 0.07305389 220.00113142 0.06878841 C227.15779434 0.06384289 234.31435175 0.06993003 241.47099062 0.08968271 C245.1163484 0.09949905 248.7615461 0.10472161 252.40691221 0.09679019 C256.37082559 0.0883426 260.33446229 0.10341905 264.29835165 0.12055957 C265.43271506 0.11454953 266.56707847 0.10853948 267.73581654 0.10234731 C278.90599863 0.18965364 292.45727453 1.23872914 301.15353048 9.03948963 C307.70959646 16.05814908 309.5679811 24.60401593 309.57513368 34.03153694 C309.57835813 35.11081878 309.58158257 36.19010061 309.58490473 37.30208796 C309.58335613 38.47688391 309.58180753 39.65167986 309.580212 40.86207569 C309.58247755 42.11858627 309.58474311 43.37509685 309.58707732 44.66968352 C309.59318608 48.15044324 309.59306281 51.63117891 309.59188294 55.11194277 C309.5916787 58.86869452 309.59719992 62.6254386 309.60194051 66.38218677 C309.61024255 73.73978577 309.61299515 81.09737676 309.61355289 88.45498005 C309.61402826 94.43635936 309.61608406 100.41773602 309.61925352 106.39911449 C309.62805885 123.36203472 309.63267308 140.32494863 309.63192304 157.28787116 C309.63186311 158.65922772 309.63186311 158.65922772 309.63180196 160.05828846 C309.63176108 160.973644 309.6317202 161.88899955 309.63167808 162.83209314 C309.63127164 177.66632073 309.640841 192.50052293 309.65494033 207.33474318 C309.66930731 222.5709356 309.67621034 237.80711563 309.67534655 253.04331499 C309.6750147 261.59545972 309.67775686 270.14757783 309.6885246 278.69971645 C309.69763383 285.98119015 309.69980138 293.26262517 309.69301518 300.54410211 C309.68975212 304.25759949 309.68968557 307.97102267 309.69836843 311.68451297 C309.70769358 315.71421557 309.70145183 319.74374667 309.69373739 323.77345264 C309.69888095 324.94155642 309.70402451 326.10966021 309.70932394 327.31316108 C309.67180085 336.18320926 309.38637681 344.47417406 303.44649923 351.50823963 C298.32090511 355.9325855 292.97105593 358.93252593 286.74337423 361.50433338 C285.92102788 361.85431385 285.09868154 362.20429431 284.25141561 362.56488025 C281.5708117 363.70250049 278.88388285 364.82424057 276.19649923 365.94573963 C274.30069778 366.74636587 272.40527653 367.54789294 270.51021993 368.35028064 C264.82865909 370.75152333 259.13845829 373.13177268 253.44649923 375.50823963 C251.85905587 376.17220407 250.27165115 376.8362609 248.6842922 377.50042713 C242.88486115 379.92556909 237.08315798 382.34517986 231.27706563 384.75433338 C219.18846905 389.7708576 207.12699173 394.85022313 195.07149923 399.94573963 C193.17339876 400.74760606 191.27528683 401.54944537 189.37716329 402.35125721 C180.92421811 405.92256632 172.47247936 409.49669729 164.02309835 413.07643116 C160.48166345 414.57616784 156.93926002 416.07360659 153.39663351 417.570526 C151.73508127 418.27327619 150.07398086 418.97709572 148.41335714 419.68203723 C146.13254463 420.65018811 143.85025669 421.61477579 141.56759298 422.57855213 C140.90000463 422.86300693 140.23241628 423.14746173 139.54459798 423.44053638 C130.13513986 427.40063123 122.41750493 427.95081718 112.83637655 424.06625354 C111.60891462 423.55220462 111.60891462 423.55220462 110.35665548 423.02777088 C109.48352209 422.67008625 108.61038869 422.31240161 107.71079671 421.94387805 C104.95147563 420.80931822 102.19837034 419.66074022 99.44649923 418.50823963 C98.15942068 417.97150119 98.15942068 417.97150119 96.84634054 417.42391956 C91.61263886 415.23900471 86.38848743 413.03207004 81.16817892 410.81536853 C76.26150339 408.73205365 71.35191521 406.65562055 66.44259298 404.57855213 C65.43985342 404.15414844 64.43711385 403.72974475 63.40398824 403.29248035 C54.14050645 399.37389379 44.8634887 395.48806125 35.5829128 391.61016834 C30.28718378 389.39673873 24.99313157 387.17930087 19.6988796 384.96234119 C14.94977964 382.97390083 10.19992586 380.98728891 5.44894063 379.00335681 C0.36443852 376.87971057 -4.71756988 374.7501858 -9.79812968 372.61712635 C-11.72357735 371.80982483 -13.64981727 371.00440961 -15.57693827 370.20111072 C-24.65567582 366.41562436 -33.69741795 362.57642217 -42.54178202 358.26605213 C-43.18318629 357.96053424 -43.82459055 357.65501636 -44.48543131 357.34024036 C-51.32028156 353.92284402 -55.95042391 349.0757537 -58.48909014 341.84254235 C-60.39222778 334.3859309 -60.9823063 327.45524617 -60.94118083 319.77696216 C-60.94656636 318.55222684 -60.9519519 317.32749152 -60.95750064 316.06564301 C-60.9692479 312.7010682 -60.96774917 309.33699475 -60.96033382 305.97244096 C-60.95557402 302.33018137 -60.96813675 298.68797319 -60.97835124 295.04573047 C-60.99549037 287.92354143 -60.99638936 280.8014408 -60.99113833 273.67923649 C-60.98708592 267.88587809 -60.98855287 262.09254567 -60.99388659 256.29918849 C-60.99463501 255.47253685 -60.99538343 254.6458852 -60.99615454 253.7941835 C-60.99768612 252.11446787 -60.99922447 250.43475225 -61.0007695 248.75503663 C-61.01447711 233.02562705 -61.00906932 217.29626729 -60.99758429 201.56685887 C-60.98765586 187.20261734 -61.00058893 172.83850471 -61.02451848 158.47428306 C-61.04894973 143.69664518 -61.05850735 128.91906723 -61.05186576 114.14140958 C-61.04838219 105.85629632 -61.05054823 97.57128209 -61.06811678 89.28618419 C-61.08288932 82.23262034 -61.08340872 75.17922527 -61.06604587 68.12566455 C-61.0575744 64.53281945 -61.05529069 60.94027518 -61.07069743 57.34744632 C-61.21876208 20.18877678 -61.21876208 20.18877678 -51.11990702 8.90667713 C-38.30867186 -2.67764687 -15.87229705 -0.06718989 0 0 Z M43.44649923 75.50823963 C42.84225118 75.77894275 42.23800313 76.04964588 41.61544454 76.32855213 C29.89130327 81.63011839 17.18408588 88.89662001 11.63399923 101.13323963 C9.95089086 105.91681078 9.3213166 110.13551464 9.29932821 115.19857776 C9.2921729 116.33387928 9.2850176 117.46918079 9.27764547 118.63888538 C9.27495656 119.87532794 9.27226766 121.11177051 9.26949728 122.38568103 C9.26292608 123.69522754 9.25635488 125.00477405 9.24958456 126.35400379 C9.22860819 130.68925758 9.2181867 135.02451145 9.20821798 139.35980213 C9.20416772 140.85688661 9.20005072 142.35397091 9.1958679 143.85105503 C9.17682862 150.88779938 9.16259617 157.92453333 9.15425593 164.96129847 C9.14449448 173.06165442 9.11819842 181.16173633 9.07775503 189.26199579 C9.04750732 195.53737809 9.0327788 201.81268222 9.02947491 208.08813596 C9.02713389 211.82934455 9.01829834 215.57025996 8.99301374 219.3113898 C8.96957622 222.83604343 8.96556178 226.3602141 8.97577512 229.88492572 C8.97649934 231.77813369 8.95751808 233.671318 8.93771017 235.56442249 C9.00654295 246.98617238 11.68876762 255.80595644 19.69649923 264.09027088 C43.60302147 285.11035222 79.95876576 292.52414314 111.00509298 292.74652088 C112.10708532 292.75459262 113.20907766 292.76266437 114.34446371 292.77098072 C116.67671835 292.78476 119.00899264 292.79550943 121.34127462 292.80340564 C123.67271712 292.81481302 126.00413591 292.83508105 128.33541524 292.86492908 C149.9224197 293.14032455 171.44255597 291.57852696 192.07149923 284.75823963 C193.67746969 284.24390369 193.67746969 284.24390369 195.31588399 283.71917713 C212.31067668 278.09826644 230.59837744 270.01273138 239.50118673 253.55902088 C241.84648961 248.41052266 242.56962646 243.53152222 242.58694112 237.92506397 C242.59265127 236.81355976 242.59836141 235.70205554 242.60424459 234.55686939 C242.60536245 233.34690799 242.60648031 232.1369466 242.60763204 230.89031971 C242.61259695 229.60842762 242.61756185 228.32653553 242.62267721 227.00579822 C242.63576378 223.49520474 242.64223908 219.98463036 242.64668787 216.47401631 C242.64962523 214.27701887 242.65373133 212.08002657 242.65819204 209.88303173 C242.67185842 202.99845799 242.68152872 196.1138961 242.68539393 189.22930974 C242.68986978 181.3021837 242.70739919 173.37523052 242.73639452 165.44815701 C242.75806877 159.30781979 242.7681013 153.16753098 242.76943505 147.02715594 C242.77047917 143.3659601 242.77630237 139.70492693 242.79425466 136.04377162 C242.81392179 131.95345325 242.8094236 127.86349279 242.80294454 123.77313221 C242.81676672 121.97337184 242.81676672 121.97337184 242.83086812 120.13725269 C242.77725899 109.30210013 240.77460931 99.80394483 233.44649923 91.50823963 C206.48808676 65.70932877 161.8679493 60.04141854 126.13399923 60.13323963 C124.97636571 60.13355686 124.97636571 60.13355686 123.79534566 60.1338805 C96.57203993 60.20752397 68.37819761 64.13001486 43.44649923 75.50823963 Z M66.44649923 359.50823963 C66.44649923 360.49823963 66.44649923 361.48823963 66.44649923 362.50823963 C73.08032135 365.58346621 79.75359957 368.56390353 86.44649923 371.50823963 C87.14227071 371.81465381 87.8380422 372.121068 88.55489767 372.43676746 C93.28289665 374.51504411 98.02162999 376.56635895 102.77181661 378.59341419 C104.38230572 379.28407264 105.99001958 379.98124033 107.59481466 380.68502796 C109.88704667 381.68845041 112.18846932 382.66715777 114.49337423 383.64105213 C115.17617452 383.94579959 115.85897481 384.25054706 116.56246603 384.5645293 C123.33287189 387.36698482 128.67025774 386.30597256 135.32687032 383.72991931 C137.12901522 382.97385268 138.92652713 382.20667435 140.71993673 381.43011463 C142.16561529 380.81743732 142.16561529 380.81743732 143.64049947 380.19238269 C145.67127083 379.32957346 147.70000096 378.46194573 149.72677267 377.5897826 C152.80091817 376.26709487 155.8808024 374.95864097 158.96212423 373.65277088 C160.94424817 372.80854737 162.92603041 371.96352104 164.90743673 371.11761463 C165.81504751 370.7309563 166.72265829 370.34429798 167.65777242 369.94592273 C173.69928569 367.34243766 179.59286919 364.50982389 185.44649923 361.50823963 C184.95149923 360.51823963 184.95149923 360.51823963 184.44649923 359.50823963 C145.50649923 359.50823963 106.56649923 359.50823963 66.44649923 359.50823963 Z " fill="#FFFFFF" transform="translate(130.55350077152252,41.49176037311554)"/>
<path d="M0 0 C0.15211778 6.33513627 0.25719976 12.66980202 0.32958984 19.00634766 C0.35976553 21.16180011 0.40071202 23.31712976 0.45263672 25.47216797 C0.5254163 28.57029493 0.55944832 31.66679932 0.5859375 34.765625 C0.61690521 35.72929993 0.64787292 36.69297485 0.67977905 37.68585205 C0.68107309 40.25754406 0.61721951 42.50325575 0 45 C-2.74536133 47.50317383 -2.74536133 47.50317383 -6 49 C-6.78125244 49.39630615 -7.56250488 49.7926123 -8.36743164 50.20092773 C-57.04042674 71.06226362 -120.11718782 75.02203871 -170.08984375 55.75 C-175.1351813 53.68088052 -180.19733489 51.59138911 -185 49 C-186.06589355 48.50226074 -187.13178711 48.00452148 -188.22998047 47.49169922 C-191.2925325 44.73685998 -191.42474572 44.37439939 -191.68115234 40.50683594 C-191.68020487 38.66574228 -191.64644249 36.82447442 -191.5859375 34.984375 C-191.57744781 34.01340881 -191.56895813 33.04244263 -191.56021118 32.04205322 C-191.52664785 28.94356903 -191.45136181 25.84769621 -191.375 22.75 C-191.34490425 20.64847511 -191.31752777 18.54690939 -191.29296875 16.4453125 C-191.22684654 11.29587023 -191.12330308 6.14837767 -191 1 C-186.1135335 -0.20162417 -183.76709862 0.59844942 -179.125 2.625 C-177.77072258 3.19165775 -176.41521926 3.75539328 -175.05859375 4.31640625 C-174.03354736 4.74397217 -174.03354736 4.74397217 -172.98779297 5.18017578 C-121.62826725 26.36235306 -58.55241255 21.65064759 -8 1 C-6.97749146 0.41255005 -6.97749146 0.41255005 -5.93432617 -0.18676758 C-3.52336186 -1.20038895 -2.45105786 -0.71848523 0 0 Z " fill="#FFFFFF" transform="translate(352,178)"/>
<path d="M0 0 C3.99160061 0.57085437 7.52524474 1.43272009 11.28125 2.890625 C63.99760441 22.89944055 128.55644415 25.39444776 180.97753906 2.12207031 C181.5753418 1.84717773 182.17314453 1.57228516 182.7890625 1.2890625 C185.92030952 0.03199253 187.70483023 -0.1154604 191 0 C191.1489943 5.14106727 191.25751582 10.28086202 191.32958984 15.42358398 C191.35965146 17.17055163 191.40051371 18.91736972 191.45263672 20.66381836 C191.5259298 23.18380707 191.55956001 25.7017914 191.5859375 28.22265625 C191.61690521 28.99585709 191.64787292 29.76905792 191.67977905 30.56568909 C191.68310143 35.99249338 190.25299696 38.68917295 186.51467896 42.60299683 C163.17481124 64.12958447 117.80023995 68.34314214 87.66113281 67.15234375 C62.65745355 65.72094046 21.93393003 62.5698093 3.71284485 42.58850098 C-0.08582115 37.79863562 -0.68899274 34.23628586 -0.48828125 28.22265625 C-0.48120651 27.41130722 -0.47413177 26.59995819 -0.46684265 25.76402283 C-0.43905771 23.19587377 -0.37635566 20.6299796 -0.3125 18.0625 C-0.28739629 16.31188065 -0.26458676 14.56122681 -0.24414062 12.81054688 C-0.1892841 8.53950793 -0.10312803 4.270135 0 0 Z " fill="#FFFFFF" transform="translate(161,247)"/>
<path d="M0 0 C1.08124146 0.00373123 1.08124146 0.00373123 2.18432617 0.00753784 C29.58948516 0.15309278 70.37211509 4.45131934 91.203125 24.4921875 C91.77546875 25.09289062 92.3478125 25.69359375 92.9375 26.3125 C88.79349979 34.74693152 77.94745597 38.75171977 69.5 41.9375 C53.6766044 47.19420606 37.45591112 51.06987883 20.9375 53.3125 C19.50857422 53.50972656 19.50857422 53.50972656 18.05078125 53.7109375 C-17.53793281 57.74396176 -57.72002734 50.58583027 -88.0625 31.3125 C-90.0625 29.3125 -90.0625 29.3125 -90.078125 26.46484375 C-88.73684937 22.30173056 -86.45892938 20.92142719 -82.8125 18.875 C-81.81863281 18.30313965 -81.81863281 18.30313965 -80.8046875 17.71972656 C-57.12322056 4.74046103 -26.65550672 -0.14802603 0 0 Z " fill="#FFFFFF" transform="translate(255.0625,122.6875)"/>
</svg>`;
        
        container.appendChild(egdataLink);
    }
    
    // 2. Create IGDB link (if gameTitle is present)
    if (gameTitle) {
        const igdbSlug = slugify(gameTitle);
        if (igdbSlug) {
            const igdbLink = document.createElement('a');
            igdbLink.href = `https://www.igdb.com/games/${igdbSlug}`;
            igdbLink.target = '_blank';
            igdbLink.rel = 'noopener noreferrer';
            igdbLink.className = 'epic-enhanced-store-link-btn'; // Use same class for styling
            igdbLink.title = 'Search on IGDB';
            
            // Replaced <img> with the user's provided SVG, removed color/width attributes
            // so CSS can style it.
            igdbLink.innerHTML = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="gamepad" class="svg-inline--fa fa-gamepad " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M192 64C86 64 0 150 0 256S86 448 192 448l256 0c106 0 192-86 192-192s-86-192-192-192L192 64zM496 168a40 40 0 1 1 0 80 40 40 0 1 1 0-80zM392 304a40 40 0 1 1 80 0 40 40 0 1 1 -80 0zM168 200c0-13.3 10.7-24 24-24s24 10.7 24 24l0 32 32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0 0 32c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32-32 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l32 0 0-32z"></path></svg>`;

            container.appendChild(igdbLink);
        }
    }
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
        // --- UPDATED LOGIC for Store Links ---
        if (!document.getElementById('epic-enhanced-store-links-container')) {
            const h1 = document.querySelector('#app-main-content h1');
            const gameTitle = h1 ? h1.textContent.trim() : null; // <-- GET THE TITLE HERE
            const titleContainer = h1 ? h1.parentElement : null; // div[data-testid="product-title-container"]
            const mainInfoContainer = titleContainer ? titleContainer.parentElement : null; // Parent container holding title/dev

            if (mainInfoContainer && gameTitle) { // <-- CHECK FOR gameTitle
                // Create and inject the container
                const linksContainer = document.createElement('div');
                linksContainer.id = 'epic-enhanced-store-links-container';
                
                // Set position relative on parent
                mainInfoContainer.style.position = 'relative'; 
                
                // Style and add the container
                linksContainer.style.position = 'absolute';
                linksContainer.style.top = '0'; // Aligns to the top of the info container
                linksContainer.style.right = '0';
                linksContainer.style.display = 'flex';
                linksContainer.style.gap = '8px';
                linksContainer.style.zIndex = '100'; // Ensure it's above other elements
                
                mainInfoContainer.appendChild(linksContainer);

                // Fetch details to get offerId
                const slug = getProductSlugFromUrl(window.location.href);
                if (slug) {
                    fetchOfferDetails(slug, new AbortController().signal)
                        .then(offerDetails => {
                            // We got offer details, inject both links
                            if (offerDetails && offerDetails.offerId) {
                                injectStoreLinks(offerDetails.offerId, gameTitle, linksContainer);
                            } else {
                                // Failed to get offerId, but we still have title. Inject only IGDB.
                                injectStoreLinks(null, gameTitle, linksContainer);
                            }
                        })
                        .catch(e => {
                            console.error("[EpicEnhanced] Failed to get offerId for store links.", e);
                            // Error fetching offerId, but we still have title. Inject only IGDB.
                            injectStoreLinks(null, gameTitle, linksContainer);
                        });
                } else {
                     // No slug, but we have title. Inject only IGDB.
                     injectStoreLinks(null, gameTitle, linksContainer);
                }
            }
        }
        // --- END UPDATED LOGIC ---
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