(function () {
    console.log("FBFeeder: Content script loaded.");
    let post_index = 0; // Initialize auto-increment index
    let total_processed_count = 0;
    function hidePost(post, reason) {
        console.log(`[hide_post] postid=${post.getAttribute('data-fbfeeder-postid')}, (${reason}): `,
            post.getAttribute('data-fbfeeder-postname'),
            post);

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
        var batch_count = 0;
        var hidden_count = 0;
        var undecided_count = 0;
        var shown_count = 0;

        // this is where we loop through each feed and identify if it's sponsored content
        posts.forEach(post => {
            batch_count++;
            total_processed_count++;

            // const post_name_element = post.querySelector('h4 a[role="link"] b');
            // const post_name = post_name_element ? post_name_element.textContent : "Unknown";
            // simpler?
            const post_name_element = post.querySelector('h4');
            if (!post_name_element) {
                // element not ready yet (?), skip this round
                undecided_count++;
                return;
            }

            // we'll handle this post, annotate it with post id/name
            const post_name = post_name_element ? post_name_element.textContent : "Unknown";
            // Mark as processed
            post.setAttribute('data-fbfeeder-processed', 'true');
            post.setAttribute('data-fbfeeder-postid', post_index++);
            post.setAttribute('data-fbfeeder-postname', post_name);

            // Verified account appears in a <title> tag
            const post_title = post.querySelector('title');
            if (post_title) {
                // 'Shared with Public' -> it seems some friends do share with public... should I care about these?
                const keywords = ['Verified account'];  // none of my friends have this
                if (keywords.some(keyword => post_title.textContent.includes(keyword))) {
                    hidePost(post, "Verified account in Title");
                    hidden_count++;
                    return;
                }
            }

            // 2. Check for "Sponsored" specific URL parameters
            // "attributionsrc" was too broad. Ads (even with obfuscated text) often have 
            // tracking parameters like __cft__ (Campaign Feedback Token) or __tn__ in the link hrefs.
            const adLinks = Array.from(post.querySelectorAll('a')).filter(a => {
                return (a.href.includes('__cft__') || a.href.includes('__tn__'));
            });

            // if (adLinks.length > 0) {
            //     hidePost(post, "Link with Ad Tracking Token (__cft__/__tn__)");
            //     return;
            // }

            // 3. Text-based filtering (Fallback)
            // Use textContent for better reliability than innerText
            const postContent = (post.textContent || post.innerText).toLowerCase();
            const keywords = ["sponsored", "follow", "join", "people you may know", "reels"];

            const foundKeyword = keywords.find(keyword => postContent.includes(keyword.toLowerCase()));
            if (foundKeyword) {
                hidePost(post, `Keyword: ${foundKeyword}`);
                hidden_count++;
                return;
            }

            // 4. SVG/Use based filtering (Legacy/Obfuscated "Sponsored" text)
            for (const svg_use of post.querySelectorAll('use')) {
                try {
                    const svg_text = document.querySelector(svg_use.href.baseVal);
                    if (svg_text && svg_text.textContent.includes('Sponsor')) {
                        hidePost(post, "Obfuscated SVG 'Sponsored'");
                        hidden_count++;
                        return;
                    }
                } catch (e) {
                    // Ignore errors if SVG ref is missing
                }
            }
            console.log(`[shown] postid=${post.getAttribute('data-fbfeeder-postid')}`, post_name, post);
            shown_count++;
        });
        if (hidden_count + shown_count > 0) {
            console.log(`[processed] processed ${total_processed_count}, hidden=${hidden_count}, shown ${shown_count}, pending=${undecided_count}`);
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
