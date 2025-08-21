(function() {
    function hidePost(post) {
        // post.style.display = 'none';
        // post.style.opacity = 0.1;
        // post.remove();  // from DOM
        post.style.position = 'absolute';
        post.style.left = '-9999px';  // move it off-screen
        post.style.top = '-9999px';  // move it off-screen
    }

    // filtering
    function filterFeeds() {
        // console.log("filterFeeds");
        
        // identify each "feed"
        // this is where things could break - intentionally or untentionally, FB (or the framework they adopted)
        // uses layers and layers of divs, making identify the outer-most div harder to identify
        // below comes from inspecting the DOM
        posts = document.querySelectorAll('[class="x1lliihq"]');

        // this is where we loop through each feed and identify if it's sponsored content
        posts.forEach(post => {
        
            // Verified account appears in a <title> tag
            const post_title = post.querySelector('title');
            if (post_title) {
                // 'Shared with Public' -> it seems some friends do share with public... should I care about these?
                const keywords = ['Verified account'];  // none of my friends have this
                if (keywords.some(keyword => post_title.textContent.includes(keyword))) {
                    hidePost(post);
                    return;
                }
            }
            
            // overly simplified - this may false-positively identify those posts
            // this also comes from the page being rendered
            const postContent = post.innerText.toLowerCase();
            const keywords = ["sponsored", "follow", "join", "verified account",
                 "people you may know", "reels"];
            // Deal with those text appended right after title
            if (keywords.some(keyword => postContent.includes(keyword.toLowerCase()))) {
                hidePost(post);
                return;
            }

            // the "Sponsored" is done using <svg><use xlink:href="#SvgTxx> (and the definition is elsewhere in the doc)
            for (const svg_use of post.querySelectorAll('use')) {
                // lookup the definition of that <use> node
                const svg_text = document.querySelector(svg_use.href.baseVal);
                // Spon<tspan>onsored</tspan> is the text that appears in the SVG, FB seems to change how the word is broken up by <tspan> randomly
                if (svg_text.textContent.includes('Sponsor')) {
                    hidePost(post);
                }
            }
        });
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
            window.scrollTo(0, scrollY/2);
            filterFeedsTimeout = null;
        }, 5000); // 1 second after last change
    }

    // Set up a MutationObserver to monitor changes and re-filter as necessary
    // const observer = new MutationObserver(debouncedFilterFeeds);
    // observer.observe(document.body, { childList: true, subtree: true });

    // run filterFeeds() periodically
    setInterval(filterFeeds, 500);
})();
