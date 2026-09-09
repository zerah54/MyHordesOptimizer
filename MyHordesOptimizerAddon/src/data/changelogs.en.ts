export const changelogs: Record<string, string> = {
    '1.1.61': `
        [Improvement] The changelog is now available in the script's 4 languages (French, English, German, Spanish)

        [Fix] After a 429 from MyHordes, the script kept waiting then retrying the token in a loop without ever letting the quota free up
        [Fix] A server request that never responded could indefinitely block a script feature
        `,
    '1.1.60': `
        [Improvement] In the catapult effect shown in the tooltip, an item that disappears without a trace now shows its own icon at very low opacity, instead of showing nothing
        [Improvement] Overall server performance and reliability (caching, compression, securing exchanges)
        `,
    '1.1.59': `
        [New] Advanced tooltips now show the item's actual catapult effect (item or transformation obtained on impact, zombies killed or repelled, area of effect), replacing the old "fragile item" indicator

        [Fix] Clearer message prompting a page reload when the script/extension version can't be read, instead of an incomplete error message
        `,
    '1.1.58': `
        [New] New option to send your chest contents to MHO when updating external tools from your house
        `,
    '1.1.57': `
        [Fix] The note on a player could fail when that player was in the same town as you
        `,
    '1.1.56': `
        [Fix] Notes display
        `,
    '1.1.55': `
        [New] Added personal notes on towns, a town's citizens and players, via a pencil icon (citizen window, citizen list, town page)
        [New] Tooltips now show the cost / opening chance of risky containers (boxes, chests...) as well as the tool required to open them
        [New] Added links to the player page and the town page on MyHordes Optimizer, from the citizen bubble and the external tools block
        [New] Notification when a script or extension update is available, and when an update has just been applied

        [Fix] The "Building" block in the extra info on the cell didn't always display, and could keep the previous building's info after leaving its cell
    `,
    '1.1.54': `
        [New] New forum reading option: show videos (youtube) directly in posts (for other providers, contact me)
        [New] New option to update daily actions in MHO. Sending bath info has been moved here, along with clothes storage and cleaning which make their appearance

        [Fix] Sorting and filtering on the citizen position column in the citizen list
        [Fix] In rare cases, the duplicate notification would show up even though only one script / extension was active
    `,
    '1.1.53': `
        [New] Three new forum reading options: automatically expand collapsed sections, click a spoiler to keep it shown, and display link images directly in posts
        [New] The external tools update now shows progress tool by tool (icon + status) instead of a single global message, with error details for each failed tool

        [Fix] The "Check all" settings button no longer accidentally unchecks options already checked by cascade
        [Fix] The external tools update button (extended version) could crash instead of showing the result when one of the tools failed
    `,
    '1.1.52': `
        [Improvement] When the script and the extension coexist, an error message is shown and only one of the two is loaded

        [Fix] Removed the outdoor chainsaw assembly recipe (a specific recipe that always fails), which made it look like the recipe existed twice identically
        [Fix] Removed the use of myHordes.localhost that had slipped in by mistake during testing
        [Fix] Using the "Seeker" heroic power and its variants should now be properly updated
    `,
    '1.1.51': `
        [New] On the bank page, a counter shows how many withdrawals are still possible before triggering the anti-abuse system, with an alert when the limit is reached
        [New] The calculation of PA needed for a building to survive the night now takes fireworks and the soviet reactor into account, with the correct value in both Far Territory and Pandemonium

        [Improvement] The script has been considerably lightened and optimized
        [Improvement] The MHO button is now positioned correctly

        [Fix] The bag didn't always open automatically, including when it contained no items
        [Fix] The shopping list could show up empty and only appear after clicking "Refresh"
        [Fix] Priorities shown on items disappeared when picking up or dropping
        [Fix] The external tools update button didn't always appear, notably after being moved
        [Fix] The registry character counter would disappear at times
        [Fix] The anti-abuse counter now removes itself when the option is unchecked
    `,
    '1.1.50': `
        [New] The watch, traps and dump lists can now be sorted
        [New] A bait search field can now be shown on the traps page
        [New] New option to freeze animated avatars, which only animate again on mouse hover
        [New] New option to apply a custom style to forum thread names, based on their tag and the words they contain, configurable via a dedicated window
    `,
    '1.1.49': `
        [Fix] Estimates since the site update
    `,
    '1.1.48': `
        [Fix] The shopping list wasn't displaying in the interface
    `,
    '1.1.47': `
        [Improvement] Added links to external tools' town pages on the town selection page
    `,
    '1.1.46': `
        [Fix] Adjusted the size of some filters in the citizen list
        [Fix] There was a bug duplicating the links to external tools in the user popup
    `,
    '1.1.45': `
        [Fix] The anti-abuse counter wasn't working correctly (but we're getting closer and closer!)

        [Improvement] Redesigned the camping calculator built into the page
    `,
    '1.1.44': `
        [Fix] The search fields on the constructions page, the watch page and the recipient list weren't working
        [Fix] The anti-abuse counter wasn't working correctly (fingers crossed this is the right one)

        [Improvement] The changelog display now also lets you browse older changelogs
    `,
    '1.1.43': `
        [Fix] Updating the GH map after an external tools update works correctly again without reloading the whole page

        [New] Two new options let you show filters on the citizen list and omniscience pages
    `,
    '1.1.42': `
        [Fix] Updating from the house no longer worked
    `,
    '1.1.41': `
        [Fix] Typo
        [Fix] Calls no longer work
    `,
    '1.1.40': `
        [Fix] Fixed the external tools update following the mid-season update
        [Fix] Shopping list display in the page

        [Improvement] Reworked the script's options for more clarity

        [New] Option to sort the citizen list and omniscience
    `,
    '1.1.39.0': `
        [Fix] Fixed the external tools update following the mid-season update
    `,
    '1.1.38.0': `
        [Fix] Changes to wishlist handling
    `,
    '1.1.37.0': `
        [Fix] Fixed the display of auras on shopping list items
    `,
    '1.1.36.0': `
        [Improvement] Enhanced tooltips now show which recipe element to click on
    `,
    '1.1.35.0': `
        [Fix] Completely changed the enhanced tooltip's behavior to make it smoother and fix its usage. Thanks Emmet for the help

        [Improvement] Compact display of recipes in the enhanced tooltip
        [Improvement] Added information about status and item properties

        [New] Customization of the information shown in the tooltip via separate options (warning, this disables the options in question, you'll need to re-enable them)
        [New] Added translation on item tooltips
    `,
    '1.1.34.0': `
        [Fix] Completely changed the enhanced tooltip's behavior to make it smoother and fix its usage. Thanks Emmet for the help

        [Improvement] Compact display of recipes in the enhanced tooltip

        [New] Customization of the information shown in the tooltip via separate options (warning, this disables the options in question, you'll need to re-enable them)
        [New] Added translation on item tooltips
    `,
    '1.1.33.0': `
        [Fix] Completely changed the enhanced tooltip's behavior to make it smoother and fix its usage. Thanks Emmet for the help
        [Fix] Fixed cases where the tooltip didn't have the "shift" hint or the button to close it once pinned
        [Fix] Prevents pinning a tooltip that doesn't show the "shift" hint
        [Fix] Better display of the "Wiki" and "Tools" buttons in the tooltip

        [New] Customization of the information shown in the tooltip via separate options
        [New] Added translation on item tooltips
    `,
    '1.1.32.0': `
        [Fix] Completely changed the enhanced tooltip's behavior to make it smoother and fix its usage. Thanks Emmet for the help
        [Fix] Fixed cases where the tooltip didn't have the "shift" hint or the button to close it once pinned
        [Fix] Prevents pinning a tooltip that doesn't show the "shift" hint
        [Fix] Better display of the "Wiki" and "Tools" buttons in the tooltip

        [New] Customization of the information shown in the tooltip via separate options
        [New] Added translation on item tooltips
    `,
    '1.1.31.0': `
        [Fix] Completely changed the enhanced tooltip's behavior to make it smoother and fix its usage. Thanks Emmet for the help
        [Fix] Better display of the "Wiki" and "Tools" buttons in the tooltip

        [New] Customization of the information shown in the tooltip via separate options
        [New] Added translation on item tooltips
    `,
    '1.1.30.0': `
        [Fix] Completely changed the enhanced tooltip's behavior to make it smoother and fix its usage. Thanks Emmet for the help
        [Fix] Better display of the "Wiki" and "Tools" buttons in the tooltip

        [New] Customization of the information shown in the tooltip via separate options
        [New] Added translation on item tooltips
    `,
    '1.1.29.0': `
        [Fix] Completely changed the enhanced tooltip's behavior to make it smoother and fix its usage. Thanks Emmet for the help
    `,
    '1.1.28.0': `
        [Fix] The filter on item names on the dump page no longer worked
    `,
    '1.1.27.0': `
        [Fix] Better stability when opening a bag
    `,
    '1.1.26.0': `
        [Fix] Attempted fix for 429s in town
    `,
    '1.1.25.0': `
        [Fix] Attempted fix for 429s in town
    `,
    '1.1.24.0': `
        [Fix] The script now works with GH's new URL
        [Fix] 429 when not in town
        [Fix] Some cases where the bag didn't open automatically even with the option checked

        [Misc] Removed the BBH update (BBH no longer works)
    `,
    '1.1.23.0': `
        [Fix] Wiki display in the script
        [Fix] 503 errors shown during an attack
    `,
    '1.1.22.0': `
        [Fix] Infinite update
    `,
    '1.1.21.0': `
        [Fix] Fixed the 400 error at the start of a town
    `,
    '1.1.20.0': `
        [Fix] MHO display following the season change
    `,
    '1.1.19.0': `
        [Fix] Constructions display
        [Fix] Anti-abuse counter
        [Fix] Display when external tools error with CSS
    `,
    '1.1.18.0': `
        [Fix] Constructions display
    `,
    '1.1.17.0': `
        [New] The script now sends page information to FataMorgana even outside chaos mode
    `,
    '1.1.16.0': `
        [Fix] The script no longer displayed when there was a wishlist
    `,
    '1.1.15.0': `
        [Fix] Bank display in the "Tools" window
        [Fix] Removed the now-obsolete "Shopping list" tab from the "Tools" window (find it on the site instead)
    `,
    '1.1.14.0': `
        [Fix] Fixed sending scavenger data to Fata Morgana
    `,
    '1.1.13.0': `
        [Fix] Sending scout and scavenger data
        [Fix] Anti-abuse
    `,
    '1.1.12.0': `
        [New] Added an option to send job-related information (scout, scavenger) to Fata Morgana
    `,
    '1.1.11.0': `
        [New] Added an option to send job-related information (scout, scavenger) to Fata Morgana
    `,
    '1.1.10.1': `
        [New] Added an option to send job-related information (scout, scavenger) to Fata Morgana
    `,
    '1.1.10.0': `
        [New] Added an option to send job-related information (scout, scavenger) to Fata Morgana
    `,
    '1.1.9.0': `
        [Fix] Fixes the shopping list
    `,
    '1.1.8.0': `
        [Fix] Fixes the shopping list
    `,
    '1.1.7.0': `
        [Fix] Fixes the call looping on the soul page when not embodied
    `,
    '1.1.6.0': `
        [Fix] Display of missing PA on constructions in Pandemonium

        [Improvement] Overall performance & stability

        [New] It's now possible to show a character counter on the chat box
        [New] It's now possible to re-read old notifications (as long as you haven't refreshed your page)
    `,
    '1.1.5.0': `
        [Fix] Display of missing PA on constructions in Pandemonium

        [Improvement] Overall performance & stability

        [New] It's now possible to show a character counter on the chat box
        [New] It's now possible to re-read old notifications (as long as you haven't refreshed your page)
    `,
    '1.1.4.0': `
        [Fix] Various fixes on item recipes
    `,
    '1.1.3.0': `
        [Fix] Correctly displays duplicate elements in item recipes
    `,
    '1.1.2.0': `
        [Fix] Correctly displays duplicate elements in item recipes
    `,
    '1.1.1.0': `
        [Fix] Added various missing item properties
        [Fix] Fixed sending the backpack to MHO
    `,
    '1.1.0.0': `
        Compatibility update (almost) with S18
    `,
    '1.0.33.0': `
        [Fix] Various display fixes
    `,
    '1.0.32.0': `
        [Fix] Missing text in some tooltips
    `,
    '1.0.31.0': `
        [New] Added information to the enhanced status tooltips
    `,
    '1.0.30.0': `
        [Fix] Label in the item tooltip (the "in bag" info was shown instead of "in bank")
        [Fix] The update in chaos mode wasn't working
    `,
    '1.0.29.0': `
        [Fix] The buttons to increment construction values had disappeared
    `,
    '1.0.28.0': `
        [Fix] Fixed the camping calculation on the cell


        html[lang]
        lang
        fr
    `,
    '1.0.27.0': `
        [Fix] Fixed the camping calculation on the cell


        html[lang]
        lang
        fr
    `,
    '1.0.26.0': `
        [Fix] Copying the registry no longer copies lines hidden by the filter

        [Modification] Removed the notion of "priority" in the shopping list, replaced by colors based on position
    `,
    '1.0.25.0': `
        [Fix] Signing up at the watchtower no longer crashes the estimated attack display
    `,
    '1.0.24.0': `
        [Fix] Trying to make sure repair bars in Pandemonium no longer overflow
        [Fix] Removed localhost from the match list
    `,
    '1.0.23.0': `
        [Fix] Trying to make sure repair bars in Pandemonium always display, instead of just whenever they feel like it
    `,
    '1.0.22.0': `
        [Fix] Various display bugs
    `,
    '1.0.21.0': `
        [New] Updating external tools with the status option enabled now also updates the information about whether the bath was taken
    `,
    '1.0.20.0': `
        [Script name update] The script will now be called MHO Addon
    `,
    '1.0.19.0': `
        [Fix] The custom anti-abuse counter only counted for one minute
    `,
    '1.0.18.0': `
        [Fix] Display issues
        [Fix] Error when adding an item to the shopping list
    `,
    '1.0.17.0': `
        [Fix] Automatic retrieval of the external identifier is available again

        [Improvement] Various performance improvements (hopefully :D)

        [New] Added an option to pre-fill a message in the house when you want to send an item and the message is empty. The message is pre-filled with values picked at random among those available for your language. Currently there's only one message per language, but feel free to send me suggestions so I can add more ;)
        [New] Added an option to show expeditions from MHO that you're signed up for, directly in-game
    `,
    '1.0.16.0': `
        [Fix] Deployed a hotfix after a bug was introduced. Automatic retrieval of your external identifier for apps is temporarily unavailable.
    `,
    '1.0.15.0': `
        [Improvement] Available updates are now flagged with a visual indicator, and a new link appears in the menu when an update is available
        [Improvement] Changelogs are no longer shown when the app loads, but flagged with a visual indicator on the menu

        [New] A new option appears for Fata Morgana: sending the number of zombies killed
    `,
    '1.0.14.0': `
        [Fix] Missing translations
        [Fix] End-of-dig notification
        [Fix] Various bugs since version 1.0.8.0

        [Improvement] A new option is available to update Fata Morgana in a devastated town
    `,
    '1.0.13.0': `
        [Fix] Missing translations
        [Fix] End-of-dig notification
        [Fix] Various bugs since version 1.0.8.0

        [Improvement] A new option is available to update Fata Morgana in a devastated town
    `,
    '1.0.12.0': `
        [Fix] Missing translations
        [Fix] End-of-dig notification

        [Improvement] A new option is available to update Fata Morgana in a devastated town
    `,
    '1.0.11.0': `
        [Fix] Missing translations
        [Fix] End-of-dig notification

        [Improvement] A new option is available to update Fata Morgana in a devastated town
    `,
    '1.0.10.0': `
        [Fix] Missing translations
        [Fix] End-of-dig notification

        [Improvement] A new option is available to update Fata Morgana in a devastated town
    `,
    '1.0.9.0': `
        [Fix] When registering digs, the digs of the person registering were never taken into account
        [Fix] Fixed a display bug on links to users' external profiles
        [Fix] A few fixes to the Anti-Abuse (it's not over, and I feel like there's no end in sight 🥲)
        [Fix] Fixed a Fata Morgana integration bug

        [Removed] Removed the new-message notification feature, since it now exists natively in MyHordes
    `,
    '1.0.8.0': `
        [Improvement] A new option is available to update Fata Morgana in a devastated town
    `,
    '1.0.7.0': `
        [Fix] When registering digs, the digs of the person registering were never taken into account
        [Fix] Fixed a display bug on links to users' external profiles
        [Fix] A few fixes to the Anti-Abuse (it's not over, and I feel like there's no end in sight 🥲)
        [Fix] Fixed a Fata Morgana integration bug

        [Removed] Removed the new-message notification feature, since it now exists natively in MyHordes
    `,
    '1.0.6.0': `
        [Fix] Display and saving of watchtower estimates in the Firefox extension

        [Improvement] No longer need to press Enter to start a translation, it now launches automatically for any search over 2 letters
        [Improvement] Visual indicator on the registry copy button once the copy is done

        [New] Added links to external profiles in a user's popup
    `,
    '1.0.5.0': `
        [Fix] The first bank withdrawal no longer counts towards the anti-abuse
        [Fix] Translations

        [New] Search field on the dump page
        [New] Display of the voracity % on the gauge
    `,
    '1.0.4.0': `
        [Fix] The button to add an item to the shopping list no longer appears on items in the Bank tool
        [Fix] The "CloneInto" error should be (finally) fixed
        [Fix] The recipe wiki is accessible again in the extension
    `,
    '1.0.3.0': `
        [Fix] Fixed the external tools update button display on chrome
        [Fix] Fixed retrieving the shopping list when it exists
    `,
    '1.0.2.0': `
        [Fix] Fixed the success icon display after an external tools update on small screens in compact mode
        [Fix] Fixed the tooltip loader display which was in German when it should have had no text
        [Fix] The APAG tooltip display is now cleaner
        [Fix] Fixed the camping calculation which used the wrong value for the building

        [New] Added a button to check all settings
    `,
    '1.0.1.0': `
        This version contains significant technical changes. Because of this, you might need to set up all your options again.

        [Fix] Fixes the untimely loading issue blocking MyHordes.

        [Improvement] Added an option on each external tool to choose whether it should refresh on tab change or not. If you were relying on this feature which was already in place, don't forget to go enable it in the options.
    `,
    '1.0.0.0': `
        This version contains significant technical changes. Because of this, you might need to set up all your options again.

        [Fix] Fixes the untimely loading issue blocking MyHordes.

        [Improvement] Added an option on each external tool to choose whether it should refresh on tab change or not. If you were relying on this feature which was already in place, don't forget to go enable it in the options.
    `,
    '1.0.0': `
        This version contains significant technical changes. Because of this, you might need to set up all your options again.

        [Fix] Fixes the untimely loading issue blocking MyHordes.

        [Improvement] Added an option on each external tool to choose whether it should refresh on tab change or not. If you were relying on this feature which was already in place, don't forget to go enable it in the options.
    `,
    '1.0.0-beta.73': `
        [Fix] Camping calculation display
    `,
    '1.0.0-beta.72': `
        [Fix] Script update link when the script isn't up to date
        [Fix] Camping calculator update for S16
        [Fix] Fixed the display of repairs in pandemonium
        [Fix] Fixed ration taking in the anti-abuse

        [Improvement] The script should no longer show several errors at once when multiple calls fail simultaneously
        [Improvement] Items findable in a building are now sorted by probability
    `,
    '1.0.0-beta.71': `
        [Fix] Fixed the display of extra info on a building

        [Improvement] Added methods to limit the number of calls to the MyHordes API
    `,
    '1.0.0-beta.70': `
        [Fix] Fixes to the display of constructions to repair in pandemonium

        [Improvement] Errors from MH are now handled and displayed better
        [Improvement] The extra info block now shows the items findable in the building
    `,
    '1.0.0-beta.69': `
        [Improvement] The filter to hide completed constructions no longer hides constructions that took damage
        [Improvement] Fixes to estimates
        [Improvement] The extra info block now shows whether the building is empty
    `,
    '1.0.0-beta.68': `
        [Fix] Copying the registry now removes extra spaces at the start of lines

        [Improvement] The various filters no longer take accents into account
        [Improvement] Visual improvement of the extra info block

        [New] Added a filter to hide completed constructions
    `,
    '1.0.0-beta.67': `
        [Fix] Fixed a bug saving the TDG's 0 value

        [New] A message will now be shown when the script loads if it isn't on its most recent version.
    `,
    '1.0.0-beta.66': `
        [Fix] Fixed a bug saving the TDG's 0 value

        [New] A message will now be shown when the script loads if it isn't on its most recent version.
    `,
    '1.0.0-beta.65': `
        [Fix] Fixed a bug saving the TDG's 0 value

        [New] A message will now be shown when the script loads if it isn't on its most recent version.
    `,
    '1.0.0-beta.64': `
        [Fix] Fixed a bug saving TDG values

        [Improvement] Attempt to improve tooltips to show a scrollbar for recipes
        [Improvement] The enhanced tooltip now shows the drop-off location for a shopping list item
        [Improvement] The shopping list embedded in the page is now sorted by priority and only shows items present on the cell
    `,
    '1.0.0-beta.63': `
        [Fix] Fixed a bug on escort options which weren't necessarily the right ones after a refresh
    `,
    '1.0.0-beta.62': `
        [Fix] Bug searching a construction's name
    `,
    '1.0.0-beta.61': `
        [Fix] Various display fixes for settings, particularly on mobile or small screens
    `,
    '1.0.0-beta.60': `
        [Improvement] Moved the translation bar which could overlap game elements
        [Improvement] Improved the settings display, particularly on mobile or on a screen small enough to cause scrolling within the settings
    `,
    '1.0.0-beta.59': `
        Warning, some changes may have affected your selected options, please make sure everything is in order!

        [Fix] Fixes the display of some images that didn't always show
        [Fix] Fixes taking the job into account in the built-in camping calculator

        [Improvement] Reorganized the menu in which options were starting to take up too much space
        [Improvement] Split some options apart (update in devastated town and sending the number of zombies killed / search fields)

        [New] Added an option to save TDG estimates in MHO, view saved values and copy them for the forum
        [New] Added an option to show a search field on the registry
        [New] Added an option to choose your escort options to apply when activating escort waiting
        [New] Added an option to notify the user in case of inactivity of more than 5 minutes if they haven't released the escort or haven't set themselves to wait for escort
    `,
    '1.0.0-beta.58': `
        [Fix] Fixes some behaviors of the anti-abuse counter

        [New] Added a registry copy button

        [Restored] Restored the option to send house upgrades. A new button will be created on the upgrades page
    `,
    '1.0.0-beta.57': `
        [Fix] Fixed the display of the update button on small screens if compact mode isn't enabled in the options
        [Fix] Fixes some behaviors of the anti-abuse counter
        [Fix] Should fix the image display which was sometimes broken

        [Improvement] The button to access the script's options is now enlarged on small screens
    `,
    '1.0.0-beta.56': `
        [Fix] Fixed the display of the number of zombies dead on the cell
    `,
    '1.0.0-beta.55': `
        [Fix] The number of remaining APAG charges was saved incorrectly
    `,
    '1.0.0-beta.54': `
        [New] Added an option to enable a compact mode on mobile for the external tools update button
    `,
    '1.0.0-beta.53': `
        [New] Added an option to enable a compact mode on mobile for the external tools update button
    `,
    '1.0.0-beta.52': `
        [Fix] Fixed the display of enhanced tooltips following the MyHordes update
        [Fix] Fixed a bug duplicating bank withdrawal lines in the anti-abuse tracking tool

        [Warning] House upgrades are no longer sent to MHO and GH following the MyHordes update. I'll try to find a way to restore this feature but with no guarantees.
    `,
    '1.0.0-beta.51': `
        [Fix] Fixed various behaviors

        [New] Added an option to show a bank withdrawal counter
    `,
    '1.0.0-beta.50': `
        [Fix] Fixed various behaviors

        [Improvement] Should now work with Greasemonkey

        [New] Added an option to automatically open the "Use an item from your bag" menu
    `,
    '1.0.0-beta.49': `
        [Fix] Typo
        [Fix] Display of the warning when the registry is incomplete
    `,
    '1.0.0-beta.48': `
        [Fix] The fence value is now correctly sent to GH
    `,
    '1.0.0-beta.47': `
        [Fix] Infinite loop when taken into escort (oops)
        [Fix] Display of missing pa so the construction doesn't get destroyed overnight
    `,
    '1.0.0-beta.46': `
        [Fix] Copying the BBH map works again
        [Fix] The size of help tooltips is decent again
    `,
    '1.0.0-beta.45': `
        [Fix] Removed console errors
        [Fix] The map no longer opened
    `,
    '1.0.0-beta.44': `
        [Improvement] Visual of the note shown when the digs option is enabled but the dig data is incomplete
    `,
    '1.0.0-beta.43': `
        [Fix] Added missing translations

        [Improvement] A note is shown on the map if the digs option is enabled but the dig data is incomplete (registry lines not loaded)
    `,
    '1.0.0-beta.42': `
        [Fix] MHO icon position

        [Improvement] During a GH update, the page is no longer fully reloaded, only its map

        [Removed] Following a discussion with the MyHordes team (itself following an intense discussion on the world forum), the extra citizen information feature - called "Omniscience++" or "O++" by the laziest among us - has been removed.
    `,
    '1.0.0-beta.41': `
        [Fix] Fixed the menu going behind MH's interface elements following changes on their side
    `,
    '1.0.0-beta.40': `
        [Improvement] Various translations and wording
        [Improvement] Merged the search field options into a single option

        [New] Added a camping simulator directly available on the cell
        [New] Added an option to show notes on a cell, from the MHO map
    `,
    '1.0.0-beta.39': `
        [MH][Improvement] Refreshing the shopping list should now work correctly
    `,
    '1.0.0-beta.38': `
        [MH][Fix] The link to the site was invalid

        [MH][Improvement] Spanish translations (thanks Bacchus)
        [MH][Improvement] Updating the shopping list from the "Tools" window has been removed and left exclusively to the site
    `,
    '1.0.0-beta.37': `
        [MH][Improvement] Spanish translations (thanks Bacchus)
        [MH][Improvement] Updating the shopping list from the "Tools" window has been removed and left exclusively to the site
    `,
    '1.0.0-beta.36': `
        [MH][Improvement] Added the manual's success chances to its associated tooltip
    `,
    '1.0.0-beta.35': `
        [MH][New] Added an option to filter message recipients
    `,
    '1.0.0-beta.34': `
        [MH][New] Added an option to receive browser notifications when the number of MH notifications changes
    `,
    '1.0.0-beta.33': `
        [MH][Fix] Fixed the link to the doc used in tampermonkey

        [MH][Improvement] Moved the site link to the very top of the options list (hopefully this time everyone will know it exists 😊)
    `,
    '1.0.0-beta.32': `
        [MH][Fix] Fixed styles that were overriding MH's bullet points in forums (sorry :( )

        [MH][Improvement] Added translations (English and German) - thanks Xochi, Crazy Unicorn, Nekomine!
    `,
    '1.0.0-beta.31': `
        [MH][Fix] Digs => searches

        [MH][Improvement] Item quantity in bags is now taken into account in the shopping list
    `,
    '1.0.0-beta.30': `
        [MH][Fix] The list of citizens present on the cell sent to MHO was empty if there was only one person on the cell
    `,
    '1.0.0-beta.29': `
        [MH][Improvement] Replaced the button to remove the external app id with an edit button
        [MH][Improvement] Visual fixes on the extra citizen information page

        [MH][New] Added an option to report your dig results to MHO. Reading and editing tools are available on the site
    `,
    '1.0.0-beta.28': `
        [MH][Fix] Fixed the external tools update when 0 APAG charges
    `,
    '1.0.0-beta.27': `
        [MH-beta][Fix] Fixed the item list: the Fat Serpent wasn't in it, which caused errors when updating with a fat serpent
        [MH][Fix] The built-in GH map is fixed (but no, it still doesn't include expeditions)

        [MH][Improvement] The enhanced citizen list, in town, is now better organized, and still sorted alphabetically. Trade-off: it takes slightly longer to load
        [MH][Improvement] Break Through is now part of the recorded AH
    `,
    '1.0.0-beta.26': `
        [MH-beta][Improvement] MHO now supports updating FataMorgana in beta
    `,
    '1.0.0-beta.25': `
        [MH-beta][Fix] Fixed sending information to GH
    `,
    '1.0.0-beta.24': `
        [Fix] Restored the API call URL which had disappeared (magic everywhere)

        [MH-beta] disabled calls to BBH & Fata. They'll be re-enabled if a compatible beta version exists. The options remain visible but have no effect
    `,
    '1.0.0-beta.23': `
        Added the script to the MH beta site - nothing new
    `,
    '1.0.0-beta.22': `
        Added the script to the MH beta site - nothing new
    `,
    '1.0.0-beta.21': `
        Added the script to the MH beta site - nothing new
    `,
    '1.0.0-beta.20': `
        [Fix] Various fixes to prevent crashes
    `,
    '1.0.0-beta.19': `
        [Fix] The script crashes if the user has no heroic actions
    `,
    '1.0.0-beta.18': `
        [Fix] The "Healthy Body" status was never sent to GH
    `,
    '1.0.0-beta.17': `
        [Fix] It was impossible to save the backpack in MHO if you had the same item twice in it (oops)
    `,
    '1.0.0-beta.16': `
        [New] Two new options are available to update GH: automatic update of heroic powers and update of house upgrades! Remember to enable them in your options!
    `,
    '1.0.0-beta.15': `
        [Fix] Sending the correct information to GH
    `,
    '1.0.0-beta.14': `
        [New] Ability to save extra information in MHO. Remember to check the associated options!
    `,
    '1.0.0-beta.13': `
        [Fix] Fixed the behavior when GH updates
    `,
    '1.0.0-beta.12': `
        [Fix] Fixed errors related to updating bag contents
    `,
    '1.0.0-beta.11': `
        [Fix] The button display following updates should be fixed!
    `,
    '1.0.0-beta.10': `
        [New] It's now possible to save your bag contents via the external tools update button. Bags can be viewed and edited from the citizen list on the MHO website.
        Don't forget to enable the associated option in your settings to make this update possible!

        [Translations] Thanks to isaaclw who provided us with some English translations! If you want to help with translation, feel free to join the discord, or contact me by DM
    `,
    '1.0.0-beta.09': `
        [New] It's now possible to save your bag contents via the external tools update button. Bags can be viewed and edited from the citizen list on the MHO website.
        Don't forget to enable the associated option in your settings to make this update possible!

        [Translations] Thanks to isaaclw who provided us with some English translations! If you want to help with translation, feel free to join the discord, or contact me by DM
    `,
    '1.0.0-beta.08': `
        [Fix] Various fixes trying to make the script work for iOS users.
        [Fix] Removed an item reported by the MH API that no longer exists
        [Fix] Fixed an error shown when updating external apps without having checked all of them (even though the update went fine)
    `,
    '1.0.0-beta.07': `
        [Fix] Fixed saving the exhausted cell state on GH
    `,
    '1.0.0-beta.06': `
        [Fix] Fixed saving the number of zombies killed on GH

        [Important] We changed the database structure. We didn't recover existing shopping lists. If you need to keep your shopping list, please contact us on the MHO discord so we can retrieve it for you.
    `,
    '1.0.0-beta.05': `
        [New] Interface to retrieve each citizen's progress (on the citizens page)
        [New] New option to send GH the number of zombies killed on the cell in order to place zombie markers

        [Important] We changed the database structure. We didn't recover existing shopping lists. If you need to keep your shopping list, please contact us on the MHO discord so we can retrieve it for you.
    `,
    '1.0.0-beta.04': `
        [Important] We changed the database structure. We didn't recover existing shopping lists. If you need to keep your shopping list, please contact us on the MHO discord so we can retrieve it for you.
    `,
    '1.0.0-beta.03': `
        [Important] We changed the database structure. We didn't recover existing shopping lists. If you need to keep your shopping list, please contact us on the MHO discord so we can retrieve it for you.
    `,
    '1.0.0-beta.02': `
        [Important] We changed the database structure. We didn't recover existing shopping lists. If you need to keep your shopping list, please contact us on the MHO discord so we can retrieve it for you.
    `,
    '1.0.0-beta.01': `
        [Important] We changed the database structure. We didn't recover existing shopping lists. If you need to keep your shopping list, please contact us on the MHO discord so we can retrieve it for you.
    `,
    '1.0.0-alpha.73': `
        [Fix] Fixed construction search
    `,
    '1.0.0-alpha.72': `
        [Removed] Removed the experimental feature preventing dangerous actions (cyanide / addiction)
    `,
    '1.0.0-alpha.71': `
        [Fix] Fixed the filter on constructions
    `,
    '1.0.0-alpha.70': `
        [New] Added the calculation of the number of zombies that will die of despair on a cell
        [New] It's no longer necessary to enter your external app id
    `,
    '1.0.0-alpha.69': `
        [New] Added the calculation of the number of zombies that will die of despair on a cell
        [New] It's no longer necessary to enter your external app id
    `,
    '1.0.0-alpha.68': `
        [New] Added the calculation of the number of zombies that will die of despair on a cell
        [New] It's no longer necessary to enter your external app id yourself
    `,
    '1.0.0-alpha.67': `
        [Fix] Trying to improve performance
    `,
    '1.0.0-alpha.66': `
        [New] Added a security certificate
    `,
    '1.0.0-alpha.65': `
        [Fix] Added an explanatory sentence to the field for adding an item to the shopping list

        [New] In the shopping list, added the ability to select a place to bring the item back to (bank or repatriation zone)
    `,
    '1.0.0-alpha.64': `
        [Fix] Added an explanatory sentence to the field for adding an item to the shopping list

        [New] In the shopping list, added the ability to select a place to bring the item back to (bank or repatriation zone)
    `,
    '1.0.0-alpha.63': `
        [Fix] Added an explanatory sentence to the field for adding an item to the shopping list

        [New] In the shopping list, added the ability to select a place to bring the item back to (bank or repatriation zone)
    `,
    '1.0.0-alpha.62': `
        [Improvement] After copying a map, the button text explicitly informs the user
    `,
    '1.0.0-alpha.61': `
        [Fix] Fixed the discord link which only worked once before unilaterally deciding to become unusable
    `,
    '1.0.0-alpha.60': `
        [New] Replaced the email link with a discord link
        [New] Interface additions in-game are now clearly identified as coming from MHO
    `,
    '1.0.0-alpha.59': `
        [Fix] The priority "aura" display no longer worked
    `,
    '1.0.0-alpha.58': `
        [Fix] Shopping list display in the page
        [Fix] Display of some icons in recipes
    `,
    '1.0.0-alpha.57': `
        [Fix] Shopping list display in the page
    `,
    '1.0.0-alpha.56': `
        [New] Spanish translation (Thanks Nekomine!)
    `,
    '1.0.0-alpha.55': `
        [New] Spanish translation (Thanks Nekomine!)
    `,
    '1.0.0-alpha.54': `
        [Fix] When no wishlist was saved, the wishlist screen didn't work
    `,
    '1.0.0-alpha.53': `
        [Fix] The positioning of the translation field no longer blocks the poll button
    `,
    '1.0.0-alpha.52': `
        [Fix] Item images

        [New] Added a button to remove your external app ID from MHO without having to go through the extension settings
        [New] Added the shopping list's last update date to the shopping list page
    `,
    '1.0.0-alpha.51': `
        [Fix] Server migration trying to stop quota issues (fingers crossed it keeps working after this...). The migration unfortunately doesn't cover camping and the building list yet
    `,
    '1.0.0-alpha.50': `
        [Fix] Server migration trying to stop quota issues (fingers crossed it keeps working after this...). The migration unfortunately doesn't cover camping and the building list yet
    `,
    '1.0.0-alpha.49': `
        [New] List of buildings and probabilities of items you can find in them, all under "Wiki" > "Buildings"

        [Experimental] Camping survival chance estimate. It's in "Tools" > "Camping"
    `,
    '1.0.0-alpha.48': `
        [Removed] Removed the estimate feature. The calculation method was changed as planned, making the feature ineffective
    `,
    '1.0.0-alpha.47': `
        [Improvement] Added bank stock and desired stock to the advanced tooltip
    `,
    '1.0.0-alpha.46': `
        [Improvement] Translations for the attack estimate feature (only a few days left to use it before it disappears)
    `,
    '1.0.0-alpha.45': `
        [New] New option to show the threshold (70% + 1pa) at which to repair constructions so they don't get destroyed in Pandemonium
    `,
    '1.0.0-alpha.44': `
        [Experimental] (Temporary) attack estimate feature
    `,
    '1.0.0-alpha.43': `
        [Experimental] (Temporary) attack estimate feature
    `,
    '1.0.0-alpha.42': `
        [Fix] Oops, I forgot to re-enable the map option, it was properly implemented but impossible to turn on ^^'
        [Fix] Trying to improve the end-of-dig notification feature for a while now, it seems more stable

        [Improvement] Added coffee PA to the enhanced tooltip
    `,
    '1.0.0-alpha.41': `
        [New] Reimplemented the map viewing feature, which had been removed.
        Maps are now rebuilt from data retrieved by clicking the "copy" button.
        So it's normal for your map's design not to be identical to your favorite tool's!
    `,
    '1.0.0-alpha.40': `
        [New] Reimplemented the map viewing feature, which had been removed.
        Maps are now rebuilt from data retrieved by clicking the "copy" button.
        So it's normal for your map's design not to be identical to your favorite tool's!
    `,
    '1.0.0-alpha.39': `
        [Temporary] Using English instead of Spanish until we have Spanish translations
    `,
    '1.0.0-alpha.38': `
        [Fix] Adding a shopping list item to this list from the shopping list page should now work correctly
    `,
    '1.0.0-alpha.37': `
        [Fix] Removed the option to copy maps from external tools following a Tampermonkey bug
        [Fix] Adding a shopping list item to this list from the shopping list page should now work correctly
    `,
    '1.0.0-alpha.36': `
        [Fix] Activating the script caused a background element of the site to disappear
    `,
    '1.0.0-alpha.35': `
        [Fix] When declining a permission, you couldn't access the site

        [Improvement] Added a link to the documentation in the script's description, so it's accessible before any installation
    `,
    '1.0.0-alpha.34': `
        [Fix] Sorting not always working
        [Fix] Button label display on Fata Morgana / Chrome
    `,
    '1.0.0-alpha.33': `
        [Improvement] If one of the external tools doesn't update properly, the details of successes and failures are shown

        [New] Added support for Violentmonkey
    `,
    '1.0.0-alpha.32': `
        [Fix] Retrieving the map from GH following the new version (but the map is still incomplete :'( )

        [Warning] Following the update to V2 of Gest'Hordes, updating via the script and the MHO site is no longer functional. We're actively working on a fix.
    `,
    '1.0.0-alpha.31': `
        [New] Added an item selection field with search in the shopping list
        [New] Added a feature to copy an external tool's map (full map or ruin map), then display it in MyHordes
    `,
    '1.0.0-alpha.30': `
        [Fix] Fixes major slowdowns across the whole app interface
    `,
    '1.0.0-alpha.29': `
        [Fix] Fixes major slowdowns across the whole app interface
    `,
    '1.0.0-alpha.28': `
        [Fix] Fixes the game menu bar display issue when the translation option is enabled

        [Improvement] Added German translations for the translation tool's display
    `,
    '1.0.0-alpha.27': `
        [Improvement] Improved the translation feature (copying a label, showing inexact results)
    `,
    '1.0.0-alpha.26': `
        [Improvement] Improved the translation feature (copying a label, showing inexact results)
    `,
    '1.0.0-alpha.25': `
        [Improvement] Added a feature to translate MyHordes elements
    `,
    '1.0.0-alpha.24': `
        [Improvement] Added a feature to translate MyHordes elements
    `,
    '1.0.0-alpha.23': `
        [Improvement] Added a feature to translate MyHordes elements
    `,
    '1.0.0-alpha.22': `
        [Improvement] Added a feature to translate MyHordes elements
    `,
    '1.0.0-alpha.21': `
        [Improvement] Added a feature to translate MyHordes elements
    `,
    '1.0.0-alpha.20': `
        [Improvement] Added English and German translations, thanks Katt and Shokolaw
    `,
    '1.0.0-alpha.19': `
        [Improvement] Redesigned settings for better readability

        [New] Added a search field to the constructions list
    `,
    '1.0.0-alpha.18': `
        [Fix] Typo

        [Improvement] Added "Camping item" info to the enhanced tooltip
    `,
    '1.0.0-alpha.17': `
        [New] Display of the number of zombies dead on the cell today
    `,
    '1.0.0-alpha.16': `
        [Fix] 500 error when loading the script while not in town
        [Fix] Behavior of the end-of-dig notification
    `,
    '1.0.0-alpha.15': `
        [Improvement] Added some item properties to the enhanced tooltips

        [New] Added an option to be notified at the end of a dig
    `,
    '1.0.0-alpha.14': `
        [Improvement] Added a "trashlist" level to the shopping list, shown in gray
        [Improvement] Changed the colors of shopping list elements
        [Improvement] Priority colors are now also shown on the item image in the built-in shopping list
        [Improvement] Display of some properties on item tooltips if the "show detailed tooltips" option is enabled

        [New] [experimental] Added an option to ask for confirmation before doing "dangerous" actions (using cyanide, using drugs if already drugged)
    `,
    '1.0.0-alpha.13': `
        [Fix] Fixed the script name display
    `,
    '1.0.0-alpha.12': `
        [Fix] Adding to the shopping list from the item list

        [Improvement] Settings display

        [New] Version display
        [New] Changelog display after an update
    `,
};
