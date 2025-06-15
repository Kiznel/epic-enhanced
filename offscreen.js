// offscreen.js
// Version: 2.0.0 - Restored to original, dedicated library syncing functionality.

const ORDER_HISTORY_URL_BASE = 'https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory';
const CODE_REDEMPTION_URL_BASE = 'https://www.epicgames.com/account/v2/payment/ajaxGetCodeRedemptionHistory'; 
let scrapingInProgress = false;

chrome.runtime.onMessage.addListener(handleMessages);

function handleMessages(message, sender, sendResponse) {
    if (message.action === 'scrapeEpicTransactions') { 
        if (scrapingInProgress) {
            sendResponse({ success: false, error: 'Scrape already in progress.' });
            return false; 
        }
        scrapingInProgress = true;
        (async () => {
            try {
                const allOwnedItems = await fetchAllOwnedItemsData();
                sendResponse({ success: true, data: allOwnedItems });
            } catch (error) {
                sendResponse({ success: false, error: `Offscreen AJAX Error: ${error.message}` });
            } finally {
                scrapingInProgress = false;
            }
        })();
        return true; 
    }
    return false; 
}

// --- Library Scraping Logic ---
async function fetchAndProcessOrderHistoryAPI(pageToken = '', allItems = [], pageNum = 1, accumulatedOffset = 0) {
    const fetchUrl = `${ORDER_HISTORY_URL_BASE}?sortDir=DESC&sortBy=DATE&nextPageToken=${encodeURIComponent(pageToken)}&locale=en-US`;
    let response;
    try {
        response = await fetch(fetchUrl, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
    } catch (networkError) { throw new Error(`Order History Network error: ${networkError.message}`); }

    if (!response.ok) { throw new Error(`Order History API request failed: Status: ${response.status}`); }

    let apiData;
    try { apiData = await response.json(); } 
    catch (jsonError) { throw new Error(`Order History JSON parse error: ${jsonError.message}.`); }

    if (!apiData || !Array.isArray(apiData.orders)) { throw new Error('Invalid data from Order History API.'); }

    apiData.orders.forEach(order => {
        const orderType = order.orderType ? order.orderType.toUpperCase() : 'UNKNOWN_ORDER_TYPE';
        const orderDate = order.date; 

        if (Array.isArray(order.items)) {
            order.items.forEach(item => { 
                if (item && typeof item.description === 'string') {
                    allItems.push({
                        originalDescription: item.description, offerId: item.offerId || null,
                        namespace: item.namespace || null, productSlug: item.slugForGrouping || item.productSlug || item.urlSlug || null,
                        itemTypeFromTransaction: item.itemType ? item.itemType.toLowerCase() : 'unknown',
                        orderDate: orderDate, orderType: orderType
                    });
                }
            });
        }
    });
    
    if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
            action: "syncPageProcessed",
            itemsSoFar: accumulatedOffset + allItems.length,
            message: `Scanning ${accumulatedOffset + allItems.length} transaction items...`,
        }).catch(e => {}); 
    }

    if (!apiData.nextPageToken || apiData.nextPageToken === pageToken || apiData.orders.length === 0) return allItems;
    await new Promise(resolve => setTimeout(resolve, 300)); 
    return await fetchAndProcessOrderHistoryAPI(apiData.nextPageToken, allItems, pageNum + 1, accumulatedOffset);
}

async function fetchAndProcessCodeRedemptionsAPI(pageToken = '', allItems = [], pageNum = 1, accumulatedOffset = 0) {
    const fetchUrl = `${CODE_REDEMPTION_URL_BASE}?sortDir=DESC&sortBy=DATE&nextPageToken=${encodeURIComponent(pageToken)}&locale=en-US`;
    let response;
    try { response = await fetch(fetchUrl, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
    } catch (networkError) { throw new Error(`Code Redemption Network error: ${networkError.message}`); }

    if (!response.ok) { return allItems; }
    
    let apiData;
    try { apiData = await response.json(); } 
    catch (jsonError) { throw new Error(`Code Redemption JSON parse error: ${jsonError.message}.`); }

    const redeemedItemsList = apiData.codeRedemptions || apiData.redemptions || apiData.codes || []; 
    if (!Array.isArray(redeemedItemsList)) { return allItems; }
    
    redeemedItemsList.forEach(item => {
        const title = item.description || item.title || item.productName; 
        const redemptionTimestamp = item.redeemDate || item.redemptionDate || item.date || item.claimDate; 
        if (title && redemptionTimestamp) {
            allItems.push({
                originalDescription: title, offerId: null, namespace: null, productSlug: null, 
                itemTypeFromTransaction: item.itemType ? item.itemType.toLowerCase() : 'game', 
                orderDate: new Date(redemptionTimestamp).toISOString(), orderType: 'REDEMPTION' 
            });
        }
    });

    if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
            action: "syncPageProcessed",
            itemsSoFar: accumulatedOffset + allItems.length,
            message: `Scanning ${accumulatedOffset + allItems.length} redeemed items...`,
        }).catch(e => {});
    }

    if (!apiData.nextPageToken || apiData.nextPageToken === pageToken || redeemedItemsList.length === 0) return allItems;
    await new Promise(resolve => setTimeout(resolve, 300)); 
    return await fetchAndProcessCodeRedemptionsAPI(apiData.nextPageToken, allItems, pageNum + 1, accumulatedOffset);
}

async function fetchAllOwnedItemsData() {
    let allItems = [];
    let orderItems = await fetchAndProcessOrderHistoryAPI();
    allItems = allItems.concat(orderItems);
    let redemptionItems = await fetchAndProcessCodeRedemptionsAPI('', allItems, 1, allItems.length);
    allItems = allItems.concat(redemptionItems);
    return allItems;
}
