# FBFeeder

A browser extension to help manage your Facebook feed.

## Installation

### Chrome / Edge / Brave

1.  Open your browser and navigate to `chrome://extensions`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked**.
4.  Select the directory containing this repository.

### Safari (macOS)

To use this extension in Safari, you will need to convert it using the standard `xcrun safari-web-extension-converter` tool or load it as an unpacked extension if you have the Safari Web Extension development features enabled.

1.  Open Safari.
2.  Go to **Develop** > **Allow Unsigned Extensions**.
3.  Go to **Settings** > **Extensions**.
4.  Check **FBFeeder**.

*Note: You may need to build a wrapper app for permanent installation in Safari.*

### Firefox

1.  Open Firefox and navigate to `about:debugging`.
2.  Click **This Firefox**.
3.  Click **Load Temporary Add-on...**
4.  Select the `manifest.json` file in this repository.


## Development History

### Initial thoughts
From the structure of the page, the initial plan is simple
1. find the "div" that holds each post
2. decide if it's an Ad.

While the initial implementation is more heuristic, it kind of works by false-positively identifying some posts as Ad (so be it, FB post is not essential).

Time goes on and it became a game and I kind of want to know what's going on.

### Obfuscation

When rendered, it's easy for us to see Sponsored, Follow, Join, etc. However, they're not presented in the DOM as-is. FB does go to some lengths to make it hard.

A few interesting techniques:

#### SVG Obfuscation
<svg><use href='#xxxx'> is used and the implementation is not inline. so the simple innerText approach doesn't work.

#### Flexbox Obfuscation (Dec 2025 finding)
Facebook found a way to render "Sponsored" as "tSsnnrd" (or a variation of it) by:
1. Putting characters in a `display: flex` container.
2. Mixing in decoy characters (hidden with `position: absolute`).
3. Randomly shuffling the DOM order of the characters.
4. Using CSS `order: N` style to visually re-arrange them back to "Sponsored".

The fix involves finding `display: flex` spans, filtering out absolute/hidden children, sorting the rest by their computed `order`, and essentially OCR-ing the text back.

## Notes

Well, the codes are there for you to see and modify. Exactly the way I want to load any extension to my browser.

It works currently and will likely continue to work (the skeleton of the code remain the same since May 2025) until FB release another major version of UI.
