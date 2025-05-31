# Facebook Feed Filter Safari Extension

I have lots of friends on FB (well, choice of social network for our era). I don't post but do check feeds to keep up with them.

However, more and more I'm feeling I'm at the mercy of Facebook of how many sponsor content they want to force-feed to me.

Armed the power of GPT, I wonder "how hard could it be to write a safari extension that can help me filter out those I don't want to see?"

Apparently not that difficult.

## Installation
Rather than using XCode to deploy a "packaged" extension, simply
1. Open Safari, Preference > Advanced, enable "Show features for web developers" at bottom
2. Now you have Develop menu, Developer > Developer Settings..., enable "Allow unsigned extensions" (maybe optional)
3. Click on the "Add Temporary Extension" and navigate to the FBFeeder/Resources
4. Now you can enable it


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

## Installation - XCode (bad)
1. use XCode to open this project
2. build it (yes, that's it, it will be available to be selected in Safari)
3. Open Safari, Preference > Advanced, enable "Show features for web developers" at bottom
4. Now you have Develop menu, Developer > Developer Settings..., enable "Allow unsigned extensions"
5. now you should have an icon appear next to the Address Bar

## Credit
Not sure if it should go to GPT or wherever GPT scrap this from.
