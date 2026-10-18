// No Shorts — content script
// Runs on all YouTube pages

(function () {
    'use strict';

    // ── 1. Redirect /shorts/* URLs to /watch?v= ──────────────────────────────
    function redirectIfShorts() {
        const match = location.pathname.match(/^\/shorts\/([A-Za-z0-9_-]+)/);
        if (match) {
            const videoId = match[1];
            const params = new URLSearchParams(location.search);
            params.set('v', videoId);
            // Keep any extra query params (t=, etc.) but drop "shorts" path
            window.location.replace('https://www.youtube.com/watch?' + params.toString());
        }
    }

    redirectIfShorts();

    function redirectIfPlayables() {
        if (location.pathname.startsWith('/playables')) {
            window.location.replace('https://www.youtube.com/');
        }
    }

    redirectIfPlayables();

    // ── 2. CSS injection — hide Shorts shelves & sidebar entries ─────────────
    const STYLE_ID = 'no-shorts-style';

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      /* Shorts shelf on homepage / subscriptions */
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-shorts,

      /* Shorts button in left sidebar */
      ytd-guide-entry-renderer a[href="/shorts"],
      ytd-mini-guide-entry-renderer a[href="/shorts"],

      /* Chips / filter pills */
      yt-chip-cloud-chip-renderer[chip-style="STYLE_HOME_FILTER"] [title="Shorts"],

      /* Search results — Shorts video cards */
      ytd-video-renderer[is-shorts],

      /* Inline Shorts shelf in search */
      ytd-reel-shelf-renderer {
        display: none !important;

      /* Playables: sidebar, shelves, cards */
      ytd-guide-entry-renderer:has(a[href^="/playables"]),
      ytd-mini-guide-entry-renderer:has(a[href^="/playables"]),
      ytd-rich-section-renderer:has(a[href*="/playables"]),
      ytd-rich-shelf-renderer:has(a[href*="/playables"]),
      ytd-rich-item-renderer:has(a[href*="/playables"]),
      ytd-video-renderer:has(a[href*="/playables"]),
      }
    `;
        (document.head || document.documentElement).appendChild(style);
    }

    injectStyle();

    // ── 3. DOM observer — catch dynamically rendered Shorts elements ──────────
    const SHORTS_SELECTORS = [
        'ytd-reel-shelf-renderer',
        'ytd-rich-shelf-renderer[is-shorts]',
        'ytd-shorts',
        'ytd-video-renderer[is-shorts]',
    ];

    // Also hide sidebar "Shorts" link by href
    function hideSidebarShorts() {
        document.querySelectorAll(
            'ytd-guide-entry-renderer a[href="/shorts"], ytd-mini-guide-entry-renderer a[href="/shorts"]'
        ).forEach(el => {
            const entry = el.closest('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer');
            if (entry) entry.style.display = 'none';
        });
    }

    const observer = new MutationObserver(() => {
        // Re-run redirect check (SPA navigation)
        redirectIfShorts();

        // Hide any newly injected Shorts nodes
        SHORTS_SELECTORS.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = 'none';
            });
        });

        hideSidebarShorts();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Initial pass once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideSidebarShorts);
    } else {
        hideSidebarShorts();
    }
})();
