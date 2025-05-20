// ==UserScript==
// @name         X Quality Filter
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Scans 'X the everything app' timeline for users with specific emojis in their name, attempts to block them, and hides the tweet. Look at console logs if you want to see a graveyard. 
// @author       pelmeniboiler
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const BANNED_EMOJIS = ['🇵🇸', '🏳️‍⚧️', '🔻', '🍉', '🌻', '🇻🇦', '☭','⚡','🌹','✝️','👾','📕','✊','☦️','☪️','🔥','🪮','💰'];
    const CLICK_DELAY_MS = 800;

    // --- SCRIPT STATE ---
    const processedTweets = new Set();

    // --- UTILITY FUNCTIONS ---
    function log(message, ...args) {
        console.log(`[EmojiBlockerV1.6] ${message}`, ...args);
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function simulateClick(element) {
        if (!element) {
            log("Error: Tried to click a null/undefined element.");
            return false;
        }
        log("Simulating click on:", element);
        if (element.offsetParent === null && element.isConnected) {
            log("Warning: Element might not be visible or interactable, but attempting click anyway.", element);
        }
        element.click();
        await delay(CLICK_DELAY_MS);
        return true;
    }

    function getUserInfo(tweetElement) {
        let displayName = "Unknown Display Name";
        let userHandle = "Unknown Handle";
        const userNameContainer = tweetElement.querySelector('div[data-testid="User-Name"]');

        if (userNameContainer) {
            const userLinks = Array.from(userNameContainer.querySelectorAll('a[href^="/"][role="link"]'));
            let mainUserLink = null;
            for (const link of userLinks) {
                const href = link.getAttribute('href');
                if (href && href.split('/').length === 2 && !href.includes('/status/')) {
                    if (link.querySelector('span')) { mainUserLink = link; break; }
                }
            }
            if (!mainUserLink && userLinks.length > 0) {
                 for (const link of userLinks) {
                    const href = link.getAttribute('href');
                     if (href && !href.includes('/status/')) { mainUserLink = link; break; }
                 }
            }

            if (mainUserLink) {
                const spansInLink = mainUserLink.querySelectorAll('span');
                let collectedDisplayNameParts = [];
                spansInLink.forEach(span => {
                    const text = span.innerText.trim();
                    if (text) {
                        if (text.startsWith('@')) {
                            if (userHandle === "Unknown Handle") userHandle = text;
                        } else {
                            if (text.toLowerCase() !== 'verified' && !/^\d+(s|m|h|d|mo|yr)$/.test(text) && text !== '·') {
                                collectedDisplayNameParts.push(text);
                            }
                        }
                    }
                });
                if (collectedDisplayNameParts.length > 0) displayName = collectedDisplayNameParts.join(' ');
            }

            if (userHandle === "Unknown Handle") {
                const handleCandidates = userNameContainer.querySelectorAll('div[dir="ltr"] > span, span');
                for (const candidate of handleCandidates) {
                    if (candidate.innerText && candidate.innerText.startsWith('@')) {
                        userHandle = candidate.innerText.trim(); break;
                    }
                }
            }
            if (displayName === "Unknown Display Name" && userHandle !== "Unknown Handle") {
                 const allSpans = userNameContainer.querySelectorAll('span');
                 for (const span of allSpans) {
                    const text = span.innerText.trim();
                    if (text && text !== userHandle && !text.startsWith('@') && text.toLowerCase() !== 'verified' && span.offsetParent !== null) {
                        displayName = text; break;
                    }
                 }
            }
        } else {
            const links = tweetElement.querySelectorAll('a[href^="/"]');
            for (const link of links) {
                const text = link.innerText.trim();
                if (text.startsWith('@') && userHandle === "Unknown Handle") userHandle = text;
                else if (text.length > 0 && !text.startsWith('@') && displayName === "Unknown Display Name" && link.offsetParent !== null) {
                     if(link.href && link.href.split('/').length <= 4 && !link.href.includes('/status/')) { // User profile links are usually short
                        displayName = text.split('\n')[0];
                     }
                }
                if (displayName !== "Unknown Display Name" && userHandle !== "Unknown Handle") break;
            }
        }

        if (displayName !== "Unknown Display Name" && userHandle !== "Unknown Handle" && displayName.includes(userHandle)) {
            displayName = displayName.replace(userHandle, "").trim();
        }
        if (displayName.trim() === "") displayName = "Unknown Display Name";
        return { displayName: displayName.replace(/\s+/g, ' ').trim(), userHandle };
    }

    function containsBannedEmoji(tweetElement) {
        const userInfo = getUserInfo(tweetElement);

        // Strategy:
        // 1. Check within the primary `div[data-testid="User-Name"]` for both images and text.
        // 2. Fallback to a broader search for other spans that might contain username parts, checking both images and text in them.

        // 1. Primary check within `div[data-testid="User-Name"]`
        const userNameDiv = tweetElement.querySelector('div[data-testid="User-Name"]');
        if (userNameDiv) {
            // Check for image emojis (img alt) within the userNameDiv
            const imagesInUserNameDiv = userNameDiv.querySelectorAll('img[alt]');
            for (const img of imagesInUserNameDiv) {
                const emojiAltText = img.getAttribute('alt');
                if (emojiAltText && BANNED_EMOJIS.includes(emojiAltText)) {
                    log(`Banned emoji (img alt) "${emojiAltText}" in User-Name div for User: ${userInfo.displayName} (${userInfo.userHandle}).`);
                    return true;
                }
            }

            // Check for text emojis within any span inside userNameDiv
            const spansInUserNameDiv = userNameDiv.querySelectorAll('span');
            for (const span of spansInUserNameDiv) {
                if (span.innerText && span.offsetParent !== null) { // Ensure span is visible and has text
                    for (const bannedEmoji of BANNED_EMOJIS) {
                        if (span.innerText.includes(bannedEmoji)) {
                            log(`Banned emoji (text) "${bannedEmoji}" in span "${span.innerText.slice(0,30)}" (User-Name div) for User: ${userInfo.displayName} (${userInfo.userHandle}).`);
                            return true;
                        }
                    }
                }
            }
        }

        // 2. Fallback / Broader check for other relevant spans
        // This targets spans that might be part of the name display but perhaps structured differently or outside the main User-Name div.
        const potentialNameSpansQuery = 'div[data-testid^="tweetTextContainer-"] ~ div span, a[role="link"] span';
        // Rationale for selector:
        // - `div[data-testid^="tweetTextContainer-"] ~ div span`: Catches spans in divs that are siblings after the tweet text container (often metadata like time, or sometimes parts of user names in replies/quotes).
        // - `a[role="link"] span`: Catches spans inside any link. This is broad, so context check later is important.
        // We avoid `a[href*="/status/"] span` here if it's too noisy and not specific to the *primary* user of the tweet being processed.
        // The goal is to find spans that are *part of the name display for the tweet's author*.

        const potentialNameSpans = tweetElement.querySelectorAll(potentialNameSpansQuery);

        for (const span of potentialNameSpans) {
            // Skip if this span is inside userNameDiv, as it was already checked
            if (userNameDiv && userNameDiv.contains(span)) {
                continue;
            }

            let isLikelyUsernameContext = false;
            let currentElement = span;
            for (let i = 0; i < 4; i++) { // Check self and up to 3 parents
                if (!currentElement) break;
                if (currentElement.matches('div[data-testid="User-Name"], a[href^="/"]:not([href*="/status/"])')) {
                    isLikelyUsernameContext = true;
                    break;
                }
                // If the link is short and doesn't point to a status, it's likely a user profile link
                if (currentElement.tagName === 'A' && currentElement.getAttribute('href')) {
                    const href = currentElement.getAttribute('href');
                    if (href.startsWith('/') && href.split('/').length <= 2 && !href.includes('/status/')) {
                        isLikelyUsernameContext = true;
                        break;
                    }
                }
                currentElement = currentElement.parentElement;
            }

            if (!isLikelyUsernameContext) {
                // If the span is not clearly in a username context after checking parents, skip it to avoid false positives
                // log(`Span "${span.innerText.slice(0,30)}" skipped, not strong username context.`);
                continue;
            }

            // Check for image emojis (img alt) directly within this span
            const imagesInSpan = span.querySelectorAll('img[alt]');
            for (const img of imagesInSpan) {
                const emojiAltText = img.getAttribute('alt');
                if (emojiAltText && BANNED_EMOJIS.includes(emojiAltText)) {
                    log(`Banned emoji (img alt) "${emojiAltText}" in potential name span for User: ${userInfo.displayName} (${userInfo.userHandle}). Span: "${span.innerText.slice(0,30)}"`);
                    return true;
                }
            }

            // Check for text emojis within this span's innerText
            if (span.innerText && span.offsetParent !== null) {
                for (const bannedEmoji of BANNED_EMOJIS) {
                    if (span.innerText.includes(bannedEmoji)) {
                        log(`Banned emoji (text) "${bannedEmoji}" in span "${span.innerText.slice(0,30)}" for User: ${userInfo.displayName} (${userInfo.userHandle}).`);
                        return true;
                    }
                }
            }
        }
        return false;
    }


    async function attemptBlockUser(tweetElement) {
        const userInfo = getUserInfo(tweetElement);
        let tweetIdForLog = "unknown_tweet_id";
        const statusLinks = tweetElement.querySelectorAll('a[href*="/status/"]');
        for (const link of statusLinks) {
            const href = link.getAttribute('href');
            const match = href.match(/\/status\/(\d+)/);
            if (match && match[1]) { tweetIdForLog = match[1]; break; }
        }
        if (tweetIdForLog === "unknown_tweet_id") {
            tweetIdForLog = (tweetElement.innerText || "no_text").slice(0,70).replace(/\n/g, ' ');
        }

        const actionKey = `blockAttempt_${tweetIdForLog}_${userInfo.userHandle}_${tweetElement.outerHTML.slice(0,50)}`;
        if (processedTweets.has(actionKey)) return;

        log(`Processing tweet (ID: ${tweetIdForLog}, User: ${userInfo.displayName} (${userInfo.userHandle})) for potential block.`);

        const moreButton = tweetElement.querySelector('button[data-testid="caret"][aria-label="More"], button[data-testid="caret"], div[data-testid="caret"], div[aria-label="More"], div[aria-label^="More options"]');
        if (!moreButton) {
            log(`Could not find 'More' button for tweet (ID: ${tweetIdForLog}, User: ${userInfo.displayName} (${userInfo.userHandle})).`);
            processedTweets.add(actionKey); return;
        }
        log(`Found 'More' button for User: ${userInfo.displayName} (${userInfo.userHandle}). Clicking...`, moreButton);
        if (!await simulateClick(moreButton)) {
            log(`Failed to click 'More' button for User: ${userInfo.displayName} (${userInfo.userHandle}).`);
            processedTweets.add(actionKey); return;
        }

        let blockMenuItem = null;
        const menuItems = Array.from(document.querySelectorAll('div[role="menuitem"], [data-testid="Dropdown"] div[role="button"], [data-testid="Dropdown"] div[role="link"]'));
        log(`Searching for 'Block' menu item for User: ${userInfo.displayName} (${userInfo.userHandle}). Found ${menuItems.length} items.`, menuItems.map(mi => mi.textContent.trim().slice(0,100)));

        for (const item of menuItems) {
            const itemText = (item.textContent || "").toLowerCase();
            const spanInside = item.querySelector('span');
            const spanText = (spanInside ? (spanInside.textContent || "") : "").toLowerCase();
            const blockTextToMatch = `block ${userInfo.userHandle}`.toLowerCase();
            const genericBlockText = "block ";

            if (itemText.includes(blockTextToMatch) || spanText.includes(blockTextToMatch) ||
                (itemText.startsWith(genericBlockText) && itemText.length < (genericBlockText.length + userInfo.userHandle.length + 10)) || // Increased length buffer
                (spanText.startsWith(genericBlockText) && spanText.length < (genericBlockText.length + userInfo.userHandle.length + 10)) ) {
                if (!itemText.includes('unblock') && !spanText.includes('unblock')) {
                    blockMenuItem = item;
                    log(`Potential 'Block' menu item found: "${item.textContent.trim()}" for User: ${userInfo.displayName} (${userInfo.userHandle}).`);
                    break;
                } else {
                    log(`Skipping 'Unblock' item: "${item.textContent.trim()}"`);
                }
            }
        }

        if (!blockMenuItem) {
            log(`Could not find 'Block ${userInfo.userHandle}' menu item. User: ${userInfo.displayName} (${userInfo.userHandle}).`);
            const firstMenuItem = menuItems[0];
            if (firstMenuItem && firstMenuItem.offsetParent !== null) {
                 log("Attempting to close dropdown by clicking body.");
                 document.body.click(); await delay(200);
            }
            processedTweets.add(actionKey); return;
        }
        log(`Found 'Block ${userInfo.userHandle}' menu item. Clicking...`, blockMenuItem);
        if (!await simulateClick(blockMenuItem)) {
            log(`Failed to click 'Block ${userInfo.userHandle}' menu item.`);
            processedTweets.add(actionKey); return;
        }

        let confirmButton = null;
        const allButtons = Array.from(document.querySelectorAll('button[data-testid="confirmationSheetConfirm"], button'));
        for (const btn of allButtons) {
            if (btn.getAttribute('data-testid') === 'confirmationSheetConfirm') {
                if ((btn.textContent || "").toLowerCase().includes('block')) { confirmButton = btn; break; }
            }
            if (!confirmButton && (btn.textContent || "").trim().toLowerCase() === 'block' && btn.offsetParent !== null) {
                 log("Found button with text 'Block', considering as confirmation.", btn);
                 confirmButton = btn; break;
            }
        }

        if (!confirmButton) {
            log(`Could not find 'Block' confirmation button for User: ${userInfo.displayName} (${userInfo.userHandle}).`);
            processedTweets.add(actionKey); return;
        }
        log(`Found 'Block' confirmation button for User: ${userInfo.displayName} (${userInfo.userHandle}). Clicking...`, confirmButton);
        if (!await simulateClick(confirmButton)) {
            log(`Failed to click 'Block' confirmation button for User: ${userInfo.displayName} (${userInfo.userHandle}).`);
            processedTweets.add(actionKey); return;
        }

        log(`Block sequence successfully completed for User: ${userInfo.displayName} (${userInfo.userHandle}).`);
        processedTweets.add(actionKey);

        log("Attempting to hide tweet from view for User: " + userInfo.displayName, tweetElement);
        tweetElement.style.transition = 'opacity 0.5s ease-out, max-height 0.5s ease-out, margin 0.5s ease-out, padding 0.5s ease-out';
        tweetElement.style.opacity = '0';
        tweetElement.style.maxHeight = '0px';
        tweetElement.style.overflow = 'hidden';
        tweetElement.style.margin = '0px'; // Set to 0
        tweetElement.style.padding = '0px'; // Set to 0
        tweetElement.style.border = 'none';
        await delay(500);
        log("Tweet for User: " + userInfo.displayName + " should now be hidden.");
    }


    async function processTweetElement(tweetElement) {
        const userInfo = getUserInfo(tweetElement);
        const scanKey = `scanned_${userInfo.userHandle}_${(tweetElement.querySelector('a[href*="/status/"]')?.getAttribute('href') || tweetElement.innerText.slice(0,30))}`;
        if (processedTweets.has(scanKey)) return;

        if (containsBannedEmoji(tweetElement)) {
            await attemptBlockUser(tweetElement);
        }
        processedTweets.add(scanKey);
    }

    function handleMutations(mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && (node.matches('article') || node.matches('[data-testid="tweet"]'))) {
                            processTweetElement(node);
                        }
                        const newTweetsInNode = node.querySelectorAll('article, [data-testid="tweet"]');
                        newTweetsInNode.forEach(tweet => processTweetElement(tweet));
                    }
                });
            }
        }
    }

    function observeTimeline() {
        log("Attempting to start MutationObserver to monitor timeline...");
        const targetNode = document.querySelector('main') || document.body;
        if (!targetNode) {
            log("Error: Could not find targetNode (main or body) for MutationObserver."); return;
        }
        log("Target node for observer:", targetNode);
        const config = { childList: true, subtree: true };
        const observer = new MutationObserver(handleMutations);
        try {
            observer.observe(targetNode, config);
            log("MutationObserver is now active and observing.", targetNode);
            document.body.classList.add('emoji-blocker-observer-active');
        } catch (e) { log("Error starting MutationObserver:", e); return; }

        log("Performing initial scan of existing tweets...");
        const initialTweets = document.querySelectorAll('article, [data-testid="tweet"]');
        log(`Initial scan found ${initialTweets.length} potential tweet elements.`);
        initialTweets.forEach(tweet => processTweetElement(tweet));
        log("Initial scan complete.");
    }

    log("Twitter Emoji User Blocker script started (v1.6).");
    log("BANNED_EMOJIS:", BANNED_EMOJIS);

    function robustStart() {
        if (document.body && (document.body.scrollHeight > 0 || document.querySelector('main'))) {
            log(`Document seems ready enough (state: ${document.readyState}). Calling observeTimeline.`);
            observeTimeline();
        } else {
            log(`Document not ready enough (state: ${document.readyState}). Retrying in 500ms.`);
            setTimeout(robustStart, 500);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        robustStart();
    } else {
        document.addEventListener('DOMContentLoaded', () => { log("DOMContentLoaded event fired."); robustStart(); });
        window.addEventListener('load', () => {
            log("Window 'load' event fired.");
            if (!document.body.classList.contains('emoji-blocker-observer-active')) {
                log("Observer not yet active, attempting robustStart from window.load.");
                robustStart();
            }
        });
    }
})();
