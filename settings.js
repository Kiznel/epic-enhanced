// settings.js
// Version 3.8.0 - Added Quick-Purchase Link toggle functionality.

document.addEventListener('DOMContentLoaded', () => {
    // --- Get all DOM elements ---
    const previewOnHoverToggle = document.getElementById('previewOnHoverToggle');
    const inLibraryIndicatorToggle = document.getElementById('inLibraryIndicatorToggle');
    const quickPurchaseLinkToggle = document.getElementById('quickPurchaseLinkToggle'); // New toggle
    const librarySearch = document.getElementById('library-search');
    const ownedGamesList = document.getElementById('owned-games-list');
    const libraryGameCount = document.getElementById('library-game-count');
    const librarySort = document.getElementById('library-sort');
    const clearLibraryBtn = document.getElementById('clear-library-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmClearBtn = document.getElementById('confirm-clear-btn');
    const cancelClearBtn = document.getElementById('cancel-clear-btn');
    const clearSyncedOnlyCheckbox = document.getElementById('clear-synced-only-checkbox');
    const priceComparisonToggle = document.getElementById('priceComparisonToggle');
    const countryList = document.getElementById('country-list');
    const addCountryBtn = document.getElementById('add-country-btn');
    const countrySelect = document.getElementById('country-select');
    const defaultCountriesBtn = document.getElementById('default-countries-btn');
    const clearCountriesBtn = document.getElementById('clear-countries-btn');

    // --- State variables ---
    let allOwnedGames = [];
    let currentSort = 'az';
    let selectedCountries = [];
    
    // --- Constants ---
    const MAX_COMPARED_COUNTRIES = 20;
    const allCountries = { 'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AS': 'American Samoa', 'AD': 'Andorra', 'AO': 'Angola', 'AI': 'Anguilla', 'AG': 'Antigua and Barbuda', 'AR': 'Argentina', 'AM': 'Armenia', 'AW': 'Aruba', 'AU': 'Australia', 'AT': 'Austria', 'AZ': 'Azerbaijan', 'BS': 'Bahamas', 'BH': 'Bahrain', 'BD': 'Bangladesh', 'BB': 'Barbados', 'BY': 'Belarus', 'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin', 'BM': 'Bermuda', 'BT': 'Bhutan', 'BO': 'Bolivia', 'BA': 'Bosnia and Herzegovina', 'BW': 'Botswana', 'BR': 'Brazil', 'VG': 'British Virgin Islands', 'BN': 'Brunei Darussalam', 'BG': 'Bulgaria', 'BF': 'Burkina Faso', 'BI': 'Burundi', 'KH': 'Cambodia', 'CM': 'Cameroon', 'CA': 'Canada', 'CV': 'Cape Verde', 'KY': 'Cayman Islands', 'TD': 'Chad', 'CL': 'Chile', 'CO': 'Colombia', 'KM': 'Comoros', 'CG': 'Congo', 'CR': 'Costa Rica', 'HR': 'Croatia', 'CY': 'Cyprus', 'CZ': 'Czech Republic', 'CI': 'Côte d\'Ivoire', 'DK': 'Denmark', 'DJ': 'Djibouti', 'DM': 'Dominica', 'DO': 'Dominican Republic', 'EC': 'Ecuador', 'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Equatorial Guinea', 'EE': 'Estonia', 'SZ': 'Eswatini', 'ET': 'Ethiopia', 'FK': 'Falkland Islands (Malvinas)', 'FO': 'Faroe Islands', 'FJ': 'Fiji', 'FI': 'Finland', 'FR': 'France', 'GF': 'French Guiana', 'PF': 'French Polynesia', 'GA': 'Gabon', 'GM': 'Gambia', 'GE': 'Georgia', 'DE': 'Germany', 'GH': 'Ghana', 'GI': 'Gibraltar', 'GR': 'Greece', 'GL': 'Greenland', 'GD': 'Grenada', 'GP': 'Guadeloupe', 'GU': 'Guam', 'GT': 'Guatemala', 'GG': 'Guernsey', 'GN': 'Guinea', 'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HN': 'Honduras', 'HK': 'Hong Kong', 'HU': 'Hungary', 'IS': 'Iceland', 'IN': 'India', 'ID': 'Indonesia', 'IE': 'Ireland', 'IM': 'Isle of Man', 'IL': 'Israel', 'IT': 'Italy', 'JM': 'Jamaica', 'JP': 'Japan', 'JE': 'Jersey', 'JO': 'Jordan', 'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KW': 'Kuwait', 'KG': 'Kyrgyzstan', 'LA': 'Lao People\'s Democratic Republic', 'LV': 'Latvia', 'LB': 'Lebanon', 'LS': 'Lesotho', 'LR': 'Liberia', 'LI': 'Liechtenstein', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'MO': 'Macao', 'MG': 'Madagascar', 'MW': 'Malawi', 'MY': 'Malaysia', 'MV': 'Maldives', 'ML': 'Mali', 'MT': 'Malta', 'MH': 'Marshall Islands', 'MQ': 'Martinique', 'MR': 'Mauritania', 'MU': 'Mauritius', 'YT': 'Mayotte', 'MX': 'Mexico', 'FM': 'Micronesia, Federated States of', 'MD': 'Moldova, Republic of', 'MC': 'Monaco', 'MN': 'Mongolia', 'ME': 'Montenegro', 'MS': 'Montserrat', 'MA': 'Morocco', 'MZ': 'Mozambique', 'NA': 'Namibia', 'NP': 'Nepal', 'NL': 'Netherlands', 'NC': 'New Caledonia', 'NZ': 'New Zealand', 'NI': 'Nicaragua', 'NE': 'Niger', 'NG': 'Nigeria', 'MK': 'North Macedonia', 'MP': 'Northern Mariana Islands', 'NO': 'Norway', 'OM': 'Oman', 'PK': 'Pakistan', 'PW': 'Palau', 'PA': 'Panama', 'PG': 'Papua New Guinea', 'PY': 'Paraguay', 'PE': 'Peru', 'PH': 'Philippines', 'PL': 'Poland', 'PT': 'Portugal', 'PR': 'Puerto Rico', 'QA': 'Qatar', 'RO': 'Romania', 'RU': 'Russia', 'RW': 'Rwanda', 'RE': 'Réunion', 'WS': 'Samoa', 'SM': 'San Marino', 'ST': 'Sao Tome and Principe', 'SA': 'Saudi Arabia', 'SN': 'Senegal', 'RS': 'Serbia', 'SC': 'Seychelles', 'SL': 'Sierra Leone', 'SG': 'Singapore', 'SK': 'Slovakia', 'SI': 'Slovenia', 'SB': 'Solomon Islands', 'ZA': 'South Africa', 'KR': 'South Korea', 'ES': 'Spain', 'LK': 'Sri Lanka', 'BL': 'St. Barthélemy', 'KN': 'St. Kitts and Nevis', 'LC': 'St. Lucia', 'MF': 'St. Martin', 'PM': 'St. Pierre and Miquelon', 'VC': 'St. Vincent and the Grenadines', 'SR': 'Suriname', 'SE': 'Sweden', 'CH': 'Switzerland', 'TW': 'Taiwan', 'TJ': 'Tajikistan', 'TZ': 'Tanzania, United Republic of', 'TH': 'Thailand', 'TL': 'Timor-Leste', 'TG': 'Togo', 'TO': 'Tonga', 'TT': 'Trinidad and Tobago', 'TN': 'Tunisia', 'TR': 'Turkey', 'TM': 'Turkmenistan', 'TC': 'Turks and Caicos Islands', 'AE': 'U.A.E.', 'UG': 'Uganda', 'GB': 'United Kingdom', 'UA': 'Ukraine', 'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VU': 'Vanuatu', 'VE': 'Venezuela', 'VN': 'Vietnam', 'WF': 'Wallis and Futuna', 'YE': 'Yemen', 'ZM': 'Zambia', 'ZW': 'Zimbabwe' };
    const defaultCountries = ['GB', 'US', 'FR', 'AU', 'JP', 'BR'];
    const SVG_ICON_CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    // --- Library Functions ---
    const renderLibraryList = () => {
        ownedGamesList.innerHTML = '';
        const searchTerm = librarySearch.value.toLowerCase();

        const groupedGamesMap = new Map();
        allOwnedGames.forEach(game => {
            if (!game.originalDescription) return;
            const gameTitle = game.originalDescription;
            if (!groupedGamesMap.has(gameTitle)) {
                groupedGamesMap.set(gameTitle, { ...game });
            }
        });
        const uniqueGameList = Array.from(groupedGamesMap.values());

        let filteredGames = uniqueGameList.filter(game => 
            game.originalDescription.toLowerCase().includes(searchTerm)
        );

        switch (currentSort) {
            case 'recent':
                filteredGames.sort((a, b) => (new Date(b.orderDate || 0) - new Date(a.orderDate || 0)));
                break;
            case 'za':
                filteredGames.sort((a, b) => b.originalDescription.localeCompare(a.originalDescription));
                break;
            case 'az':
            default:
                filteredGames.sort((a, b) => a.originalDescription.localeCompare(b.originalDescription));
                break;
        }

        if (filteredGames.length === 0) {
            ownedGamesList.innerHTML = `<div class="library-empty-message">${allOwnedGames.length === 0 ? 'Your library is empty. Sync from the extension popup.' : 'No games found for your search.'}</div>`;
            libraryGameCount.textContent = '0 items';
            return;
        }

        libraryGameCount.textContent = `${filteredGames.length} ${filteredGames.length === 1 ? 'item' : 'items'}`;

        filteredGames.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.className = 'owned-game-item';
            
            const title = document.createElement('div');
            title.className = 'owned-game-title';
            title.textContent = game.originalDescription;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-game-btn';
            removeBtn.innerHTML = SVG_ICON_CLOSE;
            removeBtn.dataset.gameKey = game.offerId || game.productSlug || game.originalDescription;

            gameItem.appendChild(title);
            gameItem.appendChild(removeBtn);
            ownedGamesList.appendChild(gameItem);
        });
    };
    
    // --- Price Comparison Functions ---
    const saveCountries = () => {
        chrome.storage.local.set({ priceComparedCountries: selectedCountries });
    };

    const renderCountryList = () => {
        countryList.innerHTML = '';
        selectedCountries.forEach(countryCode => {
            const countryItem = document.createElement('div');
            countryItem.className = 'country-item';
            countryItem.dataset.code = countryCode;
            countryItem.innerHTML = `<span>${allCountries[countryCode]}</span><button class="remove-country-btn">${SVG_ICON_CLOSE}</button>`;
            countryList.appendChild(countryItem);
        });
        updateCountrySelect();
    };

    const updateCountrySelect = () => {
        const availableCountries = Object.keys(allCountries)
            .filter(code => !selectedCountries.includes(code))
            .sort((a, b) => allCountries[a].localeCompare(allCountries[b]));
        
        countrySelect.innerHTML = '';
        availableCountries.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = allCountries[code];
            countrySelect.appendChild(option);
        });
        
        addCountryBtn.disabled = selectedCountries.length >= MAX_COMPARED_COUNTRIES || availableCountries.length === 0;
        addCountryBtn.title = addCountryBtn.disabled ? `Maximum of ${MAX_COMPARED_COUNTRIES} countries reached.` : '';
    };

    // --- Event Listeners ---
    previewOnHoverToggle.addEventListener('change', () => chrome.storage.local.set({ previewOnHover: previewOnHoverToggle.checked }));
    inLibraryIndicatorToggle.addEventListener('change', () => chrome.storage.local.set({ enableInLibraryIndicator: inLibraryIndicatorToggle.checked }));
    priceComparisonToggle.addEventListener('change', () => chrome.storage.local.set({ enablePriceComparison: priceComparisonToggle.checked }));
    quickPurchaseLinkToggle.addEventListener('change', () => chrome.storage.local.set({ enableQuickPurchaseLink: quickPurchaseLinkToggle.checked }));

    librarySearch.addEventListener('input', renderLibraryList);
    librarySort.addEventListener('change', () => {
        currentSort = librarySort.value;
        chrome.storage.local.set({ librarySortPreference: currentSort });
        renderLibraryList();
    });

    clearLibraryBtn.addEventListener('click', () => { confirmationModal.style.display = 'flex'; });
    cancelClearBtn.addEventListener('click', () => { 
        confirmationModal.style.display = 'none';
        clearSyncedOnlyCheckbox.checked = false;
    });

    confirmClearBtn.addEventListener('click', () => {
        const clearSyncedOnly = clearSyncedOnlyCheckbox.checked;
        chrome.runtime.sendMessage({ action: "clearLibraryCache", clearSyncedOnly: clearSyncedOnly }, (response) => {
            if (response && response.success) {
                // The libraryCacheUpdated message will handle refresh
            }
        });
        confirmationModal.style.display = 'none';
        clearSyncedOnlyCheckbox.checked = false;
    });
    
    ownedGamesList.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.remove-game-btn');
        if (removeButton) {
            const gameKey = removeButton.dataset.gameKey;
            if (gameKey) {
                chrome.runtime.sendMessage({ action: 'removeGameFromLibrary', gameKey: gameKey });
                removeButton.parentElement.style.opacity = '0';
                setTimeout(() => removeButton.parentElement.remove(), 200);
            }
        }
    });

    addCountryBtn.addEventListener('click', () => {
        if (selectedCountries.length < MAX_COMPARED_COUNTRIES) {
            const countryCode = countrySelect.value;
            if (countryCode && !selectedCountries.includes(countryCode)) {
                selectedCountries.push(countryCode);
                saveCountries();
                renderCountryList();
            }
        }
    });

    defaultCountriesBtn.addEventListener('click', () => {
        selectedCountries = [...defaultCountries];
        saveCountries();
        renderCountryList();
    });

    clearCountriesBtn.addEventListener('click', () => {
        selectedCountries = [];
        saveCountries();
        renderCountryList();
    });

    countryList.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.remove-country-btn');
        if (removeButton) {
            const countryCode = removeButton.parentElement.dataset.code;
            selectedCountries = selectedCountries.filter(code => code !== countryCode);
            saveCountries();
            renderCountryList();
        }
    });

    // --- Tab Switching Logic ---
    document.querySelectorAll('.navbar li').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.navbar li').forEach(item => item.classList.remove('active-tab'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            tab.classList.add('active-tab');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // --- Initialization ---
    const storageKeys = [
        'previewOnHover', 'enableInLibraryIndicator', 'enablePriceComparison', 
        'priceComparedCountries', 'epicEnhanced_ownedGamesData', 'librarySortPreference',
        'enableQuickPurchaseLink'
    ];
    chrome.storage.local.get(storageKeys, (result) => {
        previewOnHoverToggle.checked = result.previewOnHover !== false;
        inLibraryIndicatorToggle.checked = result.enableInLibraryIndicator !== false;
        priceComparisonToggle.checked = result.enablePriceComparison !== false;
        quickPurchaseLinkToggle.checked = result.enableQuickPurchaseLink !== false;
        
        selectedCountries = result.priceComparedCountries || [...defaultCountries];
        allOwnedGames = result.epicEnhanced_ownedGamesData || [];
        currentSort = result.librarySortPreference || 'az';
        librarySort.value = currentSort;
        
        renderCountryList();
        renderLibraryList();

        if (result.priceComparedCountries === undefined) {
             saveCountries();
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "libraryCacheUpdated") {
            chrome.storage.local.get('epicEnhanced_ownedGamesData', (result) => {
                allOwnedGames = result.epicEnhanced_ownedGamesData || [];
                renderLibraryList();
            });
        }
        return true; 
    });
});
