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

## Caveat

It works currently and will likely work until FB release another version of UI (that generates another random css style).
The keyword filter I use are too simplistic.

Well, I don't use FB enough to warrant more effort on this. 

## Development History

#### Feed identification
From the structure of the page, the initial plan is simple
1. find the "div" that holds each post
2. decide if it's an Ad.

For (1), FB doesn't make it easy (either intentionally to evade ad-blocker or unintentionally because of the tool choices), but we found one (unlikely to work forever).
For (2), any post that says "follow" or "join" or "sponsored" is currently treated as Ad -> I figured if any of my friend uses this, so be it. It's unlikely I'll miss it.

#### dealing with "Sponsored"
Somehow some "Sponsored" posts start to show up. Upon some investigation, it uses a <svg><use href='#xxxx'> and the implementation is not inline. so the simple innerText approach doesn't work.
Well, just have to find the definition and inspect that.

#### Flexbox Obfuscation (Dec 2025 finding)
Facebook found a way to render "Sponsored" as "tSsnnrd" (or a variation of it) by:
1. Putting characters in a `display: flex` container.
2. Mixing in decoy characters (hidden with `position: absolute`).
3. Randomly shuffling the DOM order of the characters.
4. Using CSS `order: N` style to visually re-arrange them back to "Sponsored".

The fix involves finding `display: flex` spans, filtering out absolute/hidden children, sorting the rest by their computed `order`, and essentially OCR-ing the text back.

## Installation - XCode (bad)
1. use XCode to open this project
2. build it (yes, that's it, it will be available to be selected in Safari)
3. Open Safari, Preference > Advanced, enable "Show features for web developers" at bottom
4. Now you have Develop menu, Developer > Developer Settings..., enable "Allow unsigned extensions"
5. now you should have an icon appear next to the Address Bar

## Credit
Not sure if it should go to GPT or wherever GPT scrap this from.
