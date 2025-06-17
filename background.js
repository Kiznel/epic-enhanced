// background.js
// Version: 2.8.0 - Added default setting for Quick-Purchase Link.

// --- Constants for Storage Keys ---
const OWNED_GAMES_DATA_KEY = 'epicEnhanced_ownedGamesData';
const LAST_SYNC_TIME_KEY = 'epicEnhanced_lastSyncTime';
const LIBRARY_SYNC_ERROR_KEY = 'epicEnhanced_librarySyncError';
const GAMES_FOUND_COUNT_KEY = 'epicEnhanced_gamesFoundCount';
const SYNCING_STATUS_KEY = 'epicEnhanced_isSyncing';

// --- Offscreen Document Management ---
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
let creatingOffscreenPromise = null;

function setupContextMenu() {
    chrome.contextMenus.create({
        id: "epic-enhanced-settings",
        title: "Epic Enhanced Settings",
        contexts: ["action"]
    });
}

chrome.runtime.onInstalled.addListener((details) => {
    setupContextMenu();
    if (details.reason === 'install') {
        chrome.storage.local.set({
            previewOnHover: true,
            enablePriceComparison: true,
            enableInLibraryIndicator: true,
            enableQuickPurchaseLink: true,
            priceComparedCountries: ['GB', 'US', 'FR', 'AU', 'JP', 'BR'],
            librarySortPreference: 'az'
        });
    }
    chrome.storage.local.set({ [SYNCING_STATUS_KEY]: false });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "epic-enhanced-settings") {
        chrome.runtime.openOptionsPage();
    }
});

// --- Offscreen Document Helpers ---
async function hasActiveOffscreenDocument() {
    if (typeof chrome.offscreen === 'undefined') return false;
    try {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
        });
        return contexts.length > 0;
    } catch (e) { return false; }
}

async function setupOffscreenDocument() {
    if (await hasActiveOffscreenDocument()) return;
    if (creatingOffscreenPromise) return creatingOffscreenPromise;

    creatingOffscreenPromise = chrome.offscreen.createDocument({
        url: chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH),
        reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
        justification: 'To fetch Epic Games transaction history via AJAX.',
    }).finally(() => {
        creatingOffscreenPromise = null;
    });
    return creatingOffscreenPromise;
}

async function closeOffscreenDocument() {
    if (await hasActiveOffscreenDocument()) {
        await chrome.offscreen.closeDocument();
    }
}

// --- Title Normalization and Game Ownership Logic ---
function normalizeTitleForMatching(title) {
    if (!title || typeof title !== 'string') return "";
    let normalized = title.toLowerCase();
    normalized = normalized.replace(/\s*\(.*?\)/g, " ").replace(/\s*\[.*?\]/g, " ");
    normalized = normalized.replace(/^(epic\s+games\s+store\s*-\s*)+/i, "");
    normalized = normalized.replace(/[™®©:,]/g, " ");
    normalized = normalized.replace(/\s-\s/g, " ");
    const genericPhrasesToRemove = [ 'standard edition', 'digital deluxe edition', 'collector\'s edition', 'limited edition', 'special edition', 'enhanced edition', 'premium edition', 'complete edition', 'definitive edition', 'game of the year edition', 'goty edition', 'pre-purchase bonus', 'pre-order bonus', 'starter pack', 'founder\'s pack', 'season pass', 'expansion pass', 'director\'s cut'];
    for (const phrase of genericPhrasesToRemove) {
        normalized = normalized.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), " ");
    }
    normalized = normalized.replace(/\s+(edition|bundle|pack|pass|dlc|kit|enhanced|premium)(?=\s|$)/gi, " ");
    normalized = normalized.replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, " ").trim();
    return normalized;
}

function isTransactionConsideredOwnedGame(txItem) {
    if (!txItem) return false;
    const lowerDesc = txItem.originalDescription.toLowerCase();
    const itemType = txItem.itemTypeFromTransaction ? txItem.itemTypeFromTransaction.toLowerCase() : 'unknown';
    const orderType = txItem.orderType;
    if (orderType !== 'PURCHASE' && orderType !== 'REDEMPTION' && orderType !== 'DETECTED') return false;
    const nonGameKeywords = [ 'v-bucks', 'virtual currency', 'subscription', 'soundtrack', 'artbook', 'cosmetic', 'emote', 'theme', 'avatar', 'credits pack', 'wallet fund', 'wallpaper', 'digital comic', 'guide', 'manual' ];
    if (nonGameKeywords.some(keyword => lowerDesc.includes(keyword))) return false;
    if (['game', 'base_game_edition', 'basegame', 'application', 'game_redemption'].includes(itemType)) return true;
    if (orderType === 'REDEMPTION' || orderType === 'DETECTED') return true;
    if (orderType === 'PURCHASE' && (itemType === 'product' || itemType === 'unknown')) return true;
    return false;
}

// --- Library Syncing ---
let currentSyncPromise = null;
async function syncAndBuildLibraryCache() {
    if (currentSyncPromise) {
        chrome.runtime.sendMessage({ action: "syncStatusUpdate", status: "in_progress", message: "Sync already running..." }).catch(e => {});
        return currentSyncPromise;
    }
    currentSyncPromise = (async () => {
        await chrome.storage.local.set({ [SYNCING_STATUS_KEY]: true });
        await chrome.runtime.sendMessage({ action: "syncStatusUpdate", status: "in_progress", message: "Initializing sync..." }).catch(e => {});
        
        let allFetchedItems;
        try {
            await setupOffscreenDocument();
            const offscreenResponse = await chrome.runtime.sendMessage({ action: 'scrapeEpicTransactions' });
            if (!offscreenResponse || !offscreenResponse.success || !Array.isArray(offscreenResponse.data)) {
                throw new Error(offscreenResponse?.error || "Offscreen: Invalid response or no data.");
            }
            allFetchedItems = offscreenResponse.data;
        } catch (error) {
            await chrome.runtime.sendMessage({ action: "syncStatusUpdate", status: "error", error: error.message }).catch(e => {});
            throw error;
        } finally {
            await closeOffscreenDocument();
        }

        const { [OWNED_GAMES_DATA_KEY]: existingGames = [] } = await chrome.storage.local.get(OWNED_GAMES_DATA_KEY);
        const passivelyAddedGames = existingGames.filter(game => game.orderType === 'DETECTED');
        
        const combinedItems = [...allFetchedItems, ...passivelyAddedGames];

        const latestItemsMap = new Map();
        combinedItems.sort((a, b) => new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime());

        for (const item of combinedItems) {
            const key = item.offerId || item.productSlug || normalizeTitleForMatching(item.originalDescription);
            if (!latestItemsMap.has(key)) {
                latestItemsMap.set(key, item);
            }
        }
        
        const ownedGamesForCache = [];
        for (const tx of latestItemsMap.values()) {
            if (isTransactionConsideredOwnedGame(tx)) {
                ownedGamesForCache.push({
                    offerId: tx.offerId, namespace: tx.namespace, originalDescription: tx.originalDescription,
                    normalizedTransactionTitle: normalizeTitleForMatching(tx.originalDescription), productSlug: tx.productSlug || null,
                    itemTypeFromTransaction: tx.itemTypeFromTransaction, orderType: tx.orderType,
                    orderDate: tx.orderDate
                });
            }
        }

        await chrome.storage.local.set({
            [OWNED_GAMES_DATA_KEY]: ownedGamesForCache, [LAST_SYNC_TIME_KEY]: Date.now(),
            [LIBRARY_SYNC_ERROR_KEY]: null, [GAMES_FOUND_COUNT_KEY]: ownedGamesForCache.length
        });
        await chrome.runtime.sendMessage({ action: "syncStatusUpdate", status: "success", gamesFound: ownedGamesForCache.length }).catch(e => {});
        await chrome.runtime.sendMessage({ action: "libraryCacheUpdated" }).catch(e => {});
        return { success: true, gamesFound: ownedGamesForCache.length };
    })().catch(async (error) => {
        const errorMsg = error.message || 'General failure in library sync process.';
        await chrome.storage.local.set({ [LIBRARY_SYNC_ERROR_KEY]: errorMsg });
        await chrome.runtime.sendMessage({ action: "syncStatusUpdate", status: "error", error: errorMsg }).catch(e => {});
        return { success: false, error: errorMsg };
    }).finally(async () => {
        currentSyncPromise = null;
        await chrome.storage.local.set({ [SYNCING_STATUS_KEY]: false });
    });
    return currentSyncPromise;
}

// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let isAsync = true;

    switch (request.action) {
        case "checkGameInLibrary": {
            const { titleFromStorePage, offerIdFromCard, imageDerivedNamespace, pageSlugFromCard } = request;
            const normalizedStoreTitle = titleFromStorePage ? normalizeTitleForMatching(titleFromStorePage) : null;
            
            chrome.storage.local.get(OWNED_GAMES_DATA_KEY, (result) => {
                const ownedGamesDataArray = result[OWNED_GAMES_DATA_KEY] || [];
                const foundItem = ownedGamesDataArray.find(cachedGame => {
                    const normTxTitle = cachedGame.normalizedTransactionTitle || "";
                    if (normalizedStoreTitle && normTxTitle && normalizedStoreTitle === normTxTitle && normalizedStoreTitle.length > 2) return true;
                    if (offerIdFromCard && cachedGame.offerId && cachedGame.offerId === offerIdFromCard) return true;
                    if (imageDerivedNamespace && cachedGame.namespace && imageDerivedNamespace === cachedGame.namespace && normalizedStoreTitle && normTxTitle && normalizedStoreTitle === normTxTitle && !offerIdFromCard && !pageSlugFromCard) return true;
                    if (pageSlugFromCard && cachedGame.productSlug && pageSlugFromCard === cachedGame.productSlug) return true;
                    if (normalizedStoreTitle && normTxTitle && normalizedStoreTitle === normTxTitle && !cachedGame.offerId && !cachedGame.namespace && !cachedGame.productSlug && !offerIdFromCard && !imageDerivedNamespace && !pageSlugFromCard) return true;
                    return false;
                });
                sendResponse({ inLibrary: !!foundItem, title: foundItem?.originalDescription });
            });
            break;
        }
        case "startLibrarySync":
            syncAndBuildLibraryCache().then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
            break;
        case "syncPageProcessed":
            chrome.runtime.sendMessage({
                action: "syncProgressTick",
                itemsSoFar: request.itemsSoFar,
                message: request.message
            }).catch(e => {});
            isAsync = false;
            break;
        case "clearLibraryCache":
            (async () => {
                if (request.clearSyncedOnly) {
                    const { [OWNED_GAMES_DATA_KEY]: ownedGames = [] } = await chrome.storage.local.get(OWNED_GAMES_DATA_KEY);
                    const manuallyAddedGames = ownedGames.filter(game => game.orderType === 'DETECTED');
                    await chrome.storage.local.set({
                        [OWNED_GAMES_DATA_KEY]: manuallyAddedGames,
                        [GAMES_FOUND_COUNT_KEY]: manuallyAddedGames.length
                    });
                    console.log(`Epic Enhanced: Cleared synced items. ${manuallyAddedGames.length} manually added items remain.`);
                } else {
                    await chrome.storage.local.remove([OWNED_GAMES_DATA_KEY, LAST_SYNC_TIME_KEY, GAMES_FOUND_COUNT_KEY, LIBRARY_SYNC_ERROR_KEY]);
                    console.log("Epic Enhanced: Library cache completely cleared.");
                }
                await chrome.runtime.sendMessage({ action: "libraryCacheUpdated" }).catch(e => {});
                sendResponse({ success: true });
            })();
            break;
        case "removeGameFromLibrary":
             (async () => {
                const { gameKey } = request;
                if (!gameKey) {
                    sendResponse({ success: false, error: "No game key provided."});
                    return;
                }
                const { [OWNED_GAMES_DATA_KEY]: ownedGames = [] } = await chrome.storage.local.get(OWNED_GAMES_DATA_KEY);
                
                const updatedLibrary = ownedGames.filter(game => {
                    const key = game.offerId || game.productSlug || game.originalDescription;
                    return key !== gameKey;
                });

                await chrome.storage.local.set({ 
                    [OWNED_GAMES_DATA_KEY]: updatedLibrary, 
                    [GAMES_FOUND_COUNT_KEY]: updatedLibrary.length 
                });

                await chrome.runtime.sendMessage({ action: "libraryCacheUpdated" }).catch(e => {});
                console.log(`Epic Enhanced: Removed item '${gameKey}' from library.`);
                sendResponse({ success: true });
            })();
            break;
        case "addGameToLibrary":
            (async () => {
                const { title, productSlug, offerId, namespace } = request;
                const { [OWNED_GAMES_DATA_KEY]: ownedGames = [] } = await chrome.storage.local.get(OWNED_GAMES_DATA_KEY);
                
                const normalizedTitle = normalizeTitleForMatching(title);
                const isAlreadyInLibrary = ownedGames.some(game => 
                    (game.productSlug && game.productSlug === productSlug) || 
                    (game.offerId && game.offerId === offerId) ||
                    (game.normalizedTransactionTitle && game.normalizedTransactionTitle === normalizedTitle)
                );

                if (!isAlreadyInLibrary) {
                    const newGameEntry = {
                        offerId: offerId, namespace: namespace, originalDescription: title,
                        normalizedTransactionTitle: normalizedTitle, productSlug: productSlug,
                        itemTypeFromTransaction: 'game', orderType: 'DETECTED',
                        orderDate: new Date().toISOString()
                    };
                    const updatedLibrary = [...ownedGames, newGameEntry];
                    await chrome.storage.local.set({ 
                        [OWNED_GAMES_DATA_KEY]: updatedLibrary, 
                        [GAMES_FOUND_COUNT_KEY]: updatedLibrary.length 
                    });
                    await chrome.runtime.sendMessage({ action: "libraryCacheUpdated" }).catch(e => {});
                    sendResponse({ success: true, added: true });
                } else {
                    sendResponse({ success: true, added: false, reason: 'already_exists' });
                }
            })();
            break;
        default:
            isAsync = false; 
            break;
    }
    
    return isAsync;
});

// --- Startup Listener ---
chrome.runtime.onStartup.addListener(async () => {
    await chrome.storage.local.set({ [SYNCING_STATUS_KEY]: false });
    await closeOffscreenDocument().catch(e => {});
});
