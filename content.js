(function () {
    console.log("FBFeeder: Content script loaded.");

    const I18N_CONFIG = {
        en: {
            sponsored: ["Sponsored", "Sponsor"],
            verified: ["Verified account"],
            buttons: ["Follow", "Join", "Sponsored"],
            reels: ["Reel", "People you may know"]
        },
        zh: { // Traditional Chinese
            sponsored: ["贊助"],
            verified: ["已驗證帳號"],
            buttons: ["贊助", "追蹤", "加入"],
            reels: []
        }
    };

    const I18n = {
        getAll: function (category) {
            let keywords = [];
            for (const lang in I18N_CONFIG) {
                if (I18N_CONFIG[lang][category]) {
                    keywords = keywords.concat(I18N_CONFIG[lang][category]);
                }
            }
            return keywords;
        }
    };
    let post_index = 0; // Initialize auto-increment index
    let total_processed_count = 0;
    let total_hidden_count = 0;
    let total_shown_count = 0;
    let current_not_ready_count = 0;
    function hidePost(post, reason) {
        total_hidden_count++;
        console.log(`[hide] postid=${post.getAttribute('data-fbfeeder-postid')}, (${reason}): `
            , post.getAttribute('data-fbfeeder-postname')
            // , post 
        );

        // post.style.display = 'none';
        // post.style.opacity = 0.1;
        // post.remove();  // from DOM
        post.style.position = 'absolute';
        post.style.left = '-9999px';  // move it off-screen
        post.style.top = '-9999px';  // move it off-screen
    }

    function filterFeeds() {
        // console.log("FBFeeder: Filtering feeds...");  // to debug if this is running at all

        // identify each "feed"
        // this is where things could break - intentionally or untentionally, FB (or the framework they adopted)
        // uses layers and layers of divs, making identify the outer-most div harder to identify
        // below comes from inspecting the DOM
        posts = document.querySelectorAll('[class="x1lliihq"]:not([data-fbfeeder-processed="true"])');
        var n_processed = 0;
        var n_hidden = 0;
        var n_shown = 0;
        current_not_ready_count = 0;

        // this is where we loop through each feed and identify if it's sponsored content
        posts.forEach(post => {
            n_processed++;

            let post_name = "Unknown";
            let post_by_fb = false;
            const post_name_element = post.querySelector('h4');
            if (post_name_element) {
                post_name = post_name_element.textContent;
            } else {
                // Fallback for posts without h4 (e.g. Reels?)
                const css_img = post.querySelector('i[data-visualcompletion="css-img"]');
                if (css_img) {
                    post_name = css_img.parentElement ? css_img.parentElement.textContent : "Unknown";
                    // If identified as "Reel" or "People you may know", hide it immediately
                    if (I18n.getAll('reels').some(k => post_name.includes(k))) {
                        post_by_fb = true;
                    }
                } else {
                    // element not ready yet (?), skip this round
                    current_not_ready_count++;
                    return;
                }
            }


            // we'll handle this, annotate it with post id/name so we don't process it again next around

            // Mark as processed
            post.setAttribute('data-fbfeeder-processed', 'true');
            post.setAttribute('data-fbfeeder-postid', post_index++);
            post.setAttribute('data-fbfeeder-postname', post_name);

            // we always see [class="x1lliihq"] nested inside each other. Only need to handle the outer one
            if (!post.querySelector('div[class="x1lliihq"]')) {
                return;
            }

            // legit div/post identified
            total_processed_count++;

            if (post_by_fb) {
                hidePost(post, "FB Injected");
                n_hidden++;
                return;
            }

            // Verified account appears in a <title> tag
            const post_title = post.querySelector('title');
            if (post_title) {
                // 'Shared with Public' -> it seems some friends do share with public... should I care about these?
                // 'Shared with Public' -> it seems some friends do share with public... should I care about these?
                const keywords = I18n.getAll('verified');
                if (keywords.some(keyword => post_title.textContent.includes(keyword))) {
                    hidePost(post, "Verified account in Title");
                    n_hidden++;
                    return;
                }
            }

            // Check for simple span.html-span with keywords
            const spanKeywords = I18n.getAll('buttons');
            const spans = post.querySelectorAll('span.html-span');
            for (const span of spans) {
                const foundKeyword = spanKeywords.find(keyword => span.textContent.includes(keyword));
                if (foundKeyword) {
                    hidePost(post, `Has simple span with keyword: "${foundKeyword}"`);
                    n_hidden++;
                    return;
                }
            }

            // Check for buttons with specific keywords
            // <div role="button">...<span>Follow</span>...</div>
            // This is more specific than a global keyword search
            const buttonKeywords = I18n.getAll('buttons');
            const buttons = post.querySelectorAll('div[role="button"]');
            for (const button of buttons) {
                const foundKeyword = buttonKeywords.find(keyword => button.textContent.includes(keyword));
                if (foundKeyword) {
                    hidePost(post, `Has Button with keyword: "${foundKeyword}"`);
                    n_hidden++;
                    return;
                }
            }

            // Sponsored - <svg><use href='#xxxx'>
            // SVG/Use based filtering (Legacy/Obfuscated "Sponsored" text)
            for (const svg_use of post.querySelectorAll('use')) {
                // FB obfuscates the text by using SVG <use> elements with href attributes pointing to other SVG elements.
                // We need to follow the chain of <use> elements to find the actual text.
                try {
                    let target = document.querySelector(svg_use.href.baseVal);
                    let depth = 0;
                    const MAX_DEPTH = 5;

                    while (target && depth < MAX_DEPTH) {
                        // Check if target is a <use> element or contains one
                        let useElement = target.tagName.toLowerCase() === 'use' ? target : target.querySelector('use');

                        if (useElement && useElement.href && useElement.href.baseVal) {
                            target = document.querySelector(useElement.href.baseVal);
                            depth++;
                        } else {
                            break;
                        }
                    }

                    if (target && I18n.getAll('sponsored').some(keyword => target.textContent.includes(keyword))) {
                        hidePost(post, "Obfuscated SVG 'Sponsored'");
                        n_hidden++;
                        return;
                    }
                } catch (e) {
                    // Ignore errors if SVG ref is missing
                }
            }

            // Sponsored - <span style="display: flex">
            // Facebook obfuscates text by shuffling <span> elements using CSS 'order' flex property.
            // We reconstruct the text by sorting visible elements by their computed order.
            const flexSpans = post.querySelectorAll('span[style*="display: flex"], span[style*="display:flex"]');
            for (const span of flexSpans) {
                const children = Array.from(span.children);
                const validChildren = [];

                for (const child of children) {
                    const style = window.getComputedStyle(child);
                    if (style.position === 'absolute' || style.display === 'none') {
                        continue; // Skip hidden/decoy characters
                    }
                    validChildren.push({
                        text: child.textContent,
                        order: parseInt(style.order) || 0
                    });
                }

                // Sort by flex order
                validChildren.sort((a, b) => a.order - b.order);
                const reconstructedText = validChildren.map(c => c.text).join('');
                // console.log(`[flexbox] postid=${post.getAttribute('data-fbfeeder-postid')}`, post_name, post, reconstructedText);

                // Check for "Sponsored" or "贊助"
                const flexKeywords = I18n.getAll('sponsored');
                if (flexKeywords.some(keyword => reconstructedText.toLowerCase().includes(keyword.toLowerCase()))) {
                    hidePost(post, `Flexbox De-obfuscated: "${reconstructedText}"`);
                    n_hidden++;
                    return;
                }
            }

            // Last Resort - Text-based filtering
            // Use textContent for better reliability than innerText
            // NOTE: only add keywords when all options are exhausted
            const postContent = (post.textContent || post.innerText).toLowerCase();
            const keywords = [];
            if (keywords.length > 0) {
                const foundKeyword = keywords.find(keyword => postContent.includes(keyword.toLowerCase()));
                if (foundKeyword) {
                    hidePost(post, `Keyword: ${foundKeyword}`);
                    n_hidden++;
                    return;
                }
            }

            console.log(`[shown] postid=${post.getAttribute('data-fbfeeder-postid')}`,
                post.getAttribute('data-fbfeeder-postname'));

            n_shown++;
            total_shown_count++;
        });
        if ((n_hidden + n_shown) > 0) {
            // for each invocation, log if we've done any processing
            console.log(`[processed] accumulated total=${total_processed_count}, hidden=${total_hidden_count}, shown=${total_shown_count}, n_not_ready=${current_not_ready_count}`);
        }
    }

    // Debounce timer variable
    let filterFeedsTimeout = null;

    // Debounced callback for MutationObserver
    function debouncedFilterFeeds() {
        if (filterFeedsTimeout) {
            clearTimeout(filterFeedsTimeout);
        }
        filterFeedsTimeout = setTimeout(() => {
            // Save current scroll position
            const scrollY = window.scrollY;
            filterFeeds();
            // Restore scroll position
            window.scrollTo(0, scrollY / 2);
            filterFeedsTimeout = null;
        }, 5000); // 1 second after last change
    }

    // Set up a MutationObserver to monitor changes and re-filter as necessary
    // const observer = new MutationObserver(debouncedFilterFeeds);
    // observer.observe(document.body, { childList: true, subtree: true });

    // run filterFeeds() periodically
    setInterval(filterFeeds, 500);
})();
