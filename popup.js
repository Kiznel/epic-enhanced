// popup.js
// Version 0.3.0 - Added persistent sync status check on open.
document.addEventListener('DOMContentLoaded', () => {
    const syncButton = document.getElementById('syncButton');
    const syncStatusDiv = document.getElementById('syncStatus');
    const lastSyncedTimeDiv = document.getElementById('lastSyncedTime');
    const progressTextDiv = document.getElementById('syncProgressText');

    const setStatus = (text, type = 'neutral', targetDiv = syncStatusDiv) => {
        targetDiv.textContent = text;
        targetDiv.className = `status-${type}`;
    };

    const updateLastSyncedTime = () => {
        chrome.storage.local.get(['epicEnhanced_lastSyncTime', 'epicEnhanced_librarySyncError', 'epicEnhanced_gamesFoundCount'], (result) => {
            if (result.epicEnhanced_librarySyncError && !result.epicEnhanced_lastSyncTime) { 
                lastSyncedTimeDiv.textContent = `Last sync attempt failed.`;
                setStatus(`Error: ${result.epicEnhanced_librarySyncError}`, 'error');
            } else if (result.epicEnhanced_lastSyncTime) {
                const date = new Date(result.epicEnhanced_lastSyncTime);
                const formattedDate = `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                lastSyncedTimeDiv.textContent = `Library last synced: ${formattedDate}`;
                const count = result.epicEnhanced_gamesFoundCount || 0;
                setStatus(`Synced. ${count} owned items in library.`, 'success');
            } else {
                lastSyncedTimeDiv.textContent = 'Library not synced yet.';
                setStatus('Ready to sync.', 'neutral');
            }
        });
    };

    // Check if a sync is already running when the popup opens
    chrome.storage.local.get('epicEnhanced_isSyncing', (result) => {
        if (result.epicEnhanced_isSyncing) {
            syncButton.disabled = true;
            setStatus('Sync in progress...', 'progress');
            progressTextDiv.textContent = 'Scan is currently running in the background.';
        }
    });

    updateLastSyncedTime();

    syncButton.addEventListener('click', async () => {
        syncButton.disabled = true;
        setStatus('Syncing library... Please wait.', 'progress');
        progressTextDiv.textContent = 'Initializing sync...';
        try {
            const response = await chrome.runtime.sendMessage({ action: "startLibrarySync" });
            if (response && response.error) {
                setStatus(`Error: ${response.error}`, 'error', syncStatusDiv);
                chrome.storage.local.set({ 'epicEnhanced_librarySyncError': response.error });
                syncButton.disabled = false;
                progressTextDiv.textContent = 'Sync failed to start.';
            }
        } catch (error) {
            setStatus(`Error: ${error.message || "Could not connect."}`, 'error', syncStatusDiv);
            chrome.storage.local.set({ 'epicEnhanced_librarySyncError': error.message || "Could not connect." });
            syncButton.disabled = false;
            progressTextDiv.textContent = '';
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "syncStatusUpdate") {
            const isSyncing = message.status === "in_progress";
            syncButton.disabled = isSyncing;

            if (message.status === "success") {
                const count = message.gamesFound || 0;
                setStatus(`Synced. ${count} owned items in library.`, 'success', syncStatusDiv);
                progressTextDiv.textContent = `Processed ${count} owned items. Sync complete.`;
                setTimeout(() => { progressTextDiv.textContent = ''; }, 3000);
            } else if (message.status === "error") {
                setStatus(`Error: ${message.error}`, 'error', syncStatusDiv);
                progressTextDiv.textContent = 'Sync failed.';
                setTimeout(() => { progressTextDiv.textContent = ''; }, 3000);
            } else if (message.status === "in_progress") {
                 setStatus(message.message || "Sync in progress...", 'progress', syncStatusDiv);
                 progressTextDiv.textContent = message.message || "Fetching...";
            }
            if (message.status !== "in_progress") {
                updateLastSyncedTime();
            }
        } else if (message.action === "syncProgressTick") {
            progressTextDiv.textContent = message.message || `Scanned ${message.itemsSoFar || 0} transaction items...`;
        }
        return false; 
    });
});
