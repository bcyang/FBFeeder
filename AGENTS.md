# FBFeederApp Agent Instructions

When working on this repository, please keep the following guidelines in mind:

1. **Ad Obfuscation Context**:
   Facebook continually changes how it hides the "Sponsored" or "贊助" tags. 
   - They use Flexbox `order` property to visually reorder characters.
   - They insert invisible Unicode characters (like `U+034F Combining Grapheme Joiner`) between the text.

2. **Debugging Slipping Posts**:
   If the user reports that unwanted posts are slipping through the filter again, **do not guess** the new obfuscation method.
   Instead, use the included diagnostic script to analyze the live DOM of the Facebook feed:
   - Make sure a Chrome instance is running with CDP enabled (`--remote-debugging-port=9222`).
   - Run `node scripts/analyze.js` in a temporary scratch directory with `chrome-remote-interface` installed.
   - Check the output to see what new obfuscation techniques (e.g., new invisible characters, different flexbox CSS rules, or new shadow DOM structures) are being used for the reconstructed texts.

3. **Modifying content.js**:
   When updating the filter logic in `content.js`:
   - Always sanitize strings before running `.includes()` by stripping zero-width invisible characters using a regex (e.g., `reconstructedText.replace(/[\u00AD\u200B-\u200D\u2060\uFEFF\u034F]/g, '')`).
   - Preserve existing heuristic methods (like checking for SVG `<use>`, `h4` text, or verified `<title>`) unless proven obsolete.
