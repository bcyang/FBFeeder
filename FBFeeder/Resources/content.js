(function() {
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
            const postContent = post.innerText.toLowerCase();
            // overly simplified - this may false-positively identify those posts
            // this also comes from the page being rendered
            const keywords = ["sponsored", "follow", "join"];

            if (keywords.some(keyword => postContent.includes(keyword.toLowerCase()))) {
                // hide the unwanted feed
                post.style.display = 'none';
            }
        });
    }

    // filterFeeds();  // potentially do filterFeeds() initially
    
    // Set up a MutationObserver to monitor changes and re-filter as necessary
    const observer = new MutationObserver(filterFeeds);
    observer.observe(document.body, { childList: true, subtree: true });

    // setInterval(filterFeeds, 5000);  // potentially run filterFeeds() periodically
})();
