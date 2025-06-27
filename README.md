<h align="center"> Twitter/X Emoji-in-Username Blocker 🚫🤦</h>
<p align="center">
  <img src="https://github.com/pelmeniboiler/x-quality-filter/blob/main/img/logo.png" alt="Beautiful AI Generated Image" width="118" height="118">
</p>
 
 **Tired of your X (formerly Twitter) timeline being cluttered with low-quality content? This Tampermonkey script helps you curate your feed by automatically blocking users whose display names contain emojis you can set for it to check.**


# TLDR: install tampermonkey paste script block slop win

## Low Quality Content

I like using X, but I think it's sorely lacking in ability to filter low-quality content. Curating a quality timeline can be difficult, especially when users can have their algorithm re-rolled regularly, or when they are unfamiliar with X's built-in curation tools. It's too hands-on and you make very little progress over time.

In my quest to enjoy twitter, the highest ROI solution is to only follow engineers, hobbyists, and accounts that post art. (Do not confuse this with following artists, they are annoying and complain a lot) If someone mostly posts text they usually are just complaining, so choose people that include pictures of what they're working on.

The second highest ROI solution is to block any account that posts low-quality content, and that's what this script is for.

There are 5 categories of accounts that are consistent sources of low-quality posts (besides automated bot spam) I've noticed:

**Category 1. Premium Payout Farmers:** There's a huge incentive to make posting your full-time job if you live in a country where even a solid career pays less than ad revenue share, thus many turn to spamming mindless polls like "do you love or let go?" 80 times a day, or posting inflammatory content in order to get dogpiled. Payout reductions have helped the former a bit, but community notes have become fewer and less frequent, allowing the latter to spread prodigiously. Content aggregators fall under this umbrella too, 'meme pages' and other lowest-common-denominator slop farms, though I have a soft-spot for bots that post museum exhibits or interior design photos. The most prolific of this category are pretty easy to block manually.
  
**Category 2. Fundraisers:** Posts that function as come-ons for—or directly serve—donation links for fundraisers often (but not exclusively) related to current events. This is pretty common, legitimate or otherwise, it's pretty annoying and not meaningful content. I know it's not really the right thing to say, but I don't go on X to see someone asking for $5000 for very vague reasons. Often these are automated or from third-world scammers, but *Category 3 Subtype II* is often found signal-boosting this type of content organically.
   
**Category 3.  Disinformation and Ideological Dogma:** Posts that fall under the "aiding-and-abetting" discussed by President Franklin Delano Roosevelt during the "Arsenal of Democracy" speech.

[*"I do not charge these American citizens with being foreign agents. But I do charge them with doing exactly the kind of work that the dictators want done in the United States"*](https://www.americanrhetoric.com/speeches/fdrarsenalofdemocracy.html)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*a. Subtype I:* These are mostly downstream traditional 'independent journalism' and based around the contrarian-industrial-complex which works on offering people satisfying exercise in the form of mental gymnastics. Stretching to believe anything outside of the 'mainstream' (as if that even exists anymore) is good fun, but when it's for its own sake, and especially when it's coming from sources that could have my worst interests at heart, I simply don't care to hear about the 'compelling evidence' that nuclear weapons were used on Tartus. It's really weird how conveniently the fascinations of these types seem to interact with interests of non-western powers.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*b. Subtype II:* A distributary of the former to keep the brown-water analogy going. This is a problem for all political groups due to their social nature and signaling requirements. Repetition of shibboleth in exchange for minor reward was a prized technique of Chinese political officers on POW camps during the Korean War. [*Read more about Lenient Policy and Thought Reform.*](https://ia600203.us.archive.org/33/items/ThePsychologyOfPersuasion/The%20Psychology%20of%20Persuasion.pdf) Social-media environments are ideal ad-hoc prison camps where everyone gets to play both POW and commissar. Pay attention to how people are rewarded when signaling alignment. (Consider muting the word 'based') These are easily the most annoying people on this website.

**Category 4. Why are you still here?** Posts from jaded superusers who don't seem to enjoy X but will continue updating everyone on that matter.

**Category 5. Mainstream Media.** Utter brainrot and of basically zero value as worthwhile contributors were replaced with regurgitant slopfarmers decades ago.

While not a perfect science, a noticeable trend across these types of accounts is the use of pictographic Unicode characters in their display names – often national flags or symbols representing ideologies and movements. (Except in the case of #5) I can opine about the psychology of emojis and self-representative symbolism, but the important fact is that annoying content and emojis go hand-in-hand.

## The Solution: Automated Emoji-Based User Blocking

This script saves you from having to manually block likely nuisannces. It automatically:

* **Scans** your X timeline for new tweets as they appear.
* **Checks** the display names of users for a predefined list of "banned" emojis.
* **Blocks** users if a banned emoji is detected in their name.
* **Hides** the tweet from the blocked user immediately.
* Provides **verbose logging** in your browser's developer console so you can see its actions.

## How It Works

This is a **Tampermonkey** (or Greasemonkey/Violentmonkey) userscript. It injects JavaScript into X pages to:
1.  Use a `MutationObserver` to detect when new tweets are added to the DOM.
2.  Inspect the username area of each tweet, looking for both `<img>` tags (which X uses to render emojis) and text-based emojis.
3.  Compare found emojis against your configured list.
4.  If a match is found, it simulates the necessary clicks to:
    * Open the "More" (three-dots) menu on a tweet.
    * Select the "Block @username" option.
    * Confirm the block.

## Installation & Usage

1.  **Install a Userscript Manager:** If you don't have one, install a browser extension like:
    * [Tampermonkey](https://www.tampermonkey.net/) (Recommended for Chrome, Edge, Safari, Firefox)
    * Greasemonkey (Firefox)
    * Violentmonkey (Chrome, Edge, Firefox, Opera)
2.  **Install the Script:**
    * Click on the `XQF.js` file in this repository.
    * Click the "Raw" button.
    * Your userscript manager should automatically detect it and prompt you to install. Confirm the installation.
3.  **Browse X:** Navigate to `twitter.com` or `x.com`. The script will start working automatically.
4.  **Check Console (Optional):** Open your browser's developer console (usually F12, then click the "Console" tab) to see a graveyard.

## Configuration: Customizing Your Block List

The script comes with a default list of emojis. You can (and are encouraged to) customize this list to your preferences.

1.  Open your Tampermonkey (or other userscript manager) dashboard.
2.  Find "Twitter Emoji User Blocker" in your list of installed scripts and click to edit it.
3.  Locate the `BANNED_EMOJIS` array near the top of the script:
    ```javascript
    // --- CONFIGURATION ---
    const BANNED_EMOJIS = ['🇵🇸', '🏳️‍⚧️', '🔻', '🍉', '🌻', '🇻🇦', '☭'];
    // Add or remove emojis from this list as needed.
    ```
4.  **Add or remove emojis** from this list. Ensure each emoji is enclosed in single quotes (`' '`) and separated by commas (don't give the last one a comma).
5.  Save the script (File > Save, or Ctrl+S). The changes will take effect on your next visit to X or after a page refresh.

**Recommendation:** The default list is relatively conservative. For a more aggressive filtering experience, consider adding:
* Most, if not all, national flag emojis.
* Any other emojis you personally associate with low-quality or undesirable content.

## ⚠️ Disclaimer & Important Notes

* **X's Structure Changes:** Twitter/X frequently updates its website's HTML structure, CSS class names, and `data-testid` attributes. This script relies on these to find elements and simulate clicks. **If X changes its site, this script may break or stop working correctly.** You might need to update the selectors in the script (using your browser's "Inspect Element" tool) to get it working again.
* **No Guarantees:** This script is provided as-is. It's a tool to assist in content filtering, but it will not catch every unwanted user or might occasionally misidentify elements.
* **Use Responsibly:** Automated actions on websites are typically in violation of terms-of-service. I'm too lazy to check and I'll just make a new account if I get banned, but you might not live by that M.O.

## Contributing

Feel free to fork this repository. I don't think I'll continue supporting this long term, since my blocklist will probably encompass enough accounts by the time it breaks.

---

*This script is an attempt to improve the individual user experience on X. It reflects a personal approach to content filtering and is not intended as a definitive statement on any group or symbol.*


I hope the X team will choose to address the algorithms and incentives at play on their platform in order to reward and encourage high-effort edifying content.
