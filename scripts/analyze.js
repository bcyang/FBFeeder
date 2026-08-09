const CDP = require('chrome-remote-interface');

/**
 * Diagnostic script to fetch live Facebook feed DOM structures using Chrome DevTools Protocol.
 * Useful for reverse-engineering new obfuscation techniques when Sponsored posts slip through.
 * 
 * Usage:
 * 1. Launch Chrome with CDP enabled (e.g. Google Chrome --remote-debugging-port=9222)
 * 2. npm i chrome-remote-interface
 * 3. node analyze.js
 */
(async function() {
    try {
        const targets = await CDP.List();
        const fbTarget = targets.find(t => t.url.includes('facebook.com'));
        if (!fbTarget) {
            console.log("No active Facebook tab found.");
            return;
        }
        
        const client = await CDP({target: fbTarget});
        const { Runtime } = client;
        
        // This evaluates in the context of the page, mimicking content.js logic to grab posts
        const result = await Runtime.evaluate({
            expression: `
                (function() {
                    // Hint from codes: find the div that holds each post
                    let posts = Array.from(document.querySelectorAll('div[class="x1lliihq"]'));
                    
                    let data = posts.map(p => {
                        let name = p.querySelector('h4') ? p.querySelector('h4').textContent : 'Unknown';
                        
                        // Extract flexbox text to check for new invisible characters
                        let flexSpans = Array.from(p.querySelectorAll('span[style*="display: flex"], span[style*="display:flex"]'));
                        let flexTexts = flexSpans.map(span => {
                            let children = Array.from(span.children);
                            let validChildren = [];
                            for (let child of children) {
                                let style = window.getComputedStyle(child);
                                if (style.position === 'absolute' || style.display === 'none') {
                                    continue;
                                }
                                validChildren.push({
                                    text: child.textContent,
                                    order: parseInt(style.order) || 0
                                });
                            }
                            validChildren.sort((a, b) => a.order - b.order);
                            return {
                                reconstructedText: validChildren.map(c => c.text).join('')
                            };
                        });
                        
                        return { name, flexTexts };
                    }).filter(x => x.flexTexts.length > 0);
                    
                    return data;
                })()
            `,
            returnByValue: true
        });
        
        console.log("Found Flexbox Obfuscated texts:");
        console.log(JSON.stringify(result.result.value, null, 2));
        
        await client.close();
    } catch (err) {
        console.error(err);
    }
})();
