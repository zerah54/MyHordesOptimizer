import {
    btn_id,
    mh_optimizer_map_window_id,
    mho_display_expeditions_id,
    mho_display_map_id,
    mho_store_notifications_id,
    repo_img_hordes_url
} from '../config/constants';

export function createStyles() {
    const params_style = `.param-has-children > div::after {`
        + `content: '▶︎';`
        + `margin-left: auto;`
        + `}`;

    const btn_style = `
    #${btn_id} {
        background-color: #5c2b20;
        border: 1px solid #f0d79e;
        outline: 1px solid #000;
        position: absolute;
        top: 10px;
        z-index: 997;
    }
    #${btn_id}.mho-btn-opened h1 span, #${btn_id}.mho-btn-opened h1 a, #${btn_id}.mho-btn-opened h1 img.close {
        display: inline;
    }
    #${btn_id}.mho-btn-opened div {
        display: block;
    }
    #${btn_id} h1 {
        height: auto;
        font-size: 8pt;
        text-transform: none;
        font-variant: small-caps;
        background: none;
        cursor: help;
        margin: 0 5px;
        padding: 0;
        line-height: 17px;
        color: #f0d79e;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    #${btn_id} h1 > div > img {
        vertical-align: -9%;
    }
    #${btn_id}.mho-btn-opened h1 {
        border-bottom: 1px solid #b37c4a;
        margin-bottom: 5px;
    }
    #${btn_id} h1 span, #${btn_id} h1 a, #${btn_id} h1 img.close {
        color: #f0d79e;
        cursor: help;
        font-family: Trebuchet MS,Arial,Verdana,sans-serif;
        letter-spacing: 1px;
        line-height: 17px;
        text-align: left;
        text-transform: none;
        margin-left: 1em;
        display: none;
    }
    #${btn_id} > div {
        display: none;
        margin: 0 5px 8px 5px;
        font-size: 0.9em;
        width: 350px;
    }
    #${btn_id} .mho-parameters-btn {
        margin-top: 0;
        text-align: center;
        display: block;
    }
    `;

    const mho_window_style = `
    .mho-window {
        opacity: 1;
        transition: opacity 1s ease;
        z-index: 999;
        padding: 0;
        position: fixed;
        min-width: 150px;
        min-height: 150px;
    }
    .mho-window:not(.fullsize) .mho-window-box {
        resize: both;
        overflow: auto;
    }
    .mho-window.fullsize {
        background: url(${repo_img_hordes_url}background/mask.png);
        height: 100%;
        width: 100%;
        resize: none;
    }
    .mho-window:not(.visible), #${mh_optimizer_map_window_id}:not(.visible) {
        opacity: 0;
        pointer-events: none;
    }
    .mho-window:not(.visible) .mho-window-box, .mho-window:not(.visible) #${mh_optimizer_map_window_id}-box {
        transform: scale(0) translateY(1000px);
    }
    .mho-window .mho-window-box {
        background: url(${repo_img_hordes_url}background/bg_content2.jpg) repeat-y 0 0/900px 263px,url(${repo_img_hordes_url}background/bg_content2.jpg) repeat-y 100% 0/900px 263px;
        border-radius: 8px;
        box-shadow: 0 0 10px #000;
        display: flex;
        flex-direction: row;
        position: absolute;
        top: 10px;
        bottom: 10px;
        right: 10px;
        left: 10px;
        transform: scale(1) translateY(0);
        transition: transform .5s ease;
    }
    #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box {
        background: url(${repo_img_hordes_url}background/bg_content2.jpg) repeat-y 0 0/900px 263px,url(${repo_img_hordes_url}background/bg_content2.jpg) repeat-y 100% 0/900px 263px;
        border-radius: 8px;
        box-shadow: 0 0 10px #000;
        position: absolute;
        transform: scale(1) translateY(0);
        transition: transform .5s ease;
        resize: both;
        overflow: auto;
        z-index: 9999;
    }
    .mho-window .mho-window-box .mho-window-overlay, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay {
        position: absolute;
        right: 6px;
        top: 6px;
        text-align: right;
    }
    .mho-window .mho-window-box .mho-window-overlay ul, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay ul {
        margin: 2px;
        padding: 0;
    }
    .mho-window .mho-window-box .mho-window-overlay ul li, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay ul li {
        cursor: pointer;
        display: inline-block;
    }
    .mho-window .mho-window-drag-handle {
        width: 18px;
        height: 100%;
    }
    .mho-window-content, #${mh_optimizer_map_window_id}-content {
        flex: 1;
        color: #fff;
        overflow: auto;
        background: url(${repo_img_hordes_url}background/box/panel_00.gif) 0 0 no-repeat,url(${repo_img_hordes_url}background/box/panel_02.gif) 100% 0 no-repeat,url(${repo_img_hordes_url}background/box/panel_20.gif) 0 100% no-repeat,url(${repo_img_hordes_url}background/box/panel_22.gif) 100% 100% no-repeat,url(${repo_img_hordes_url}background/box/panel_01.gif) 0 0 repeat-x,url(${repo_img_hordes_url}background/box/panel_10.gif) 0 0 repeat-y,url(${repo_img_hordes_url}background/box/panel_12.gif) 100% 0 repeat-y,url(${repo_img_hordes_url}background/box/panel_21.gif) 0 100% repeat-x,#7e4d2a;
        border-radius: 12px;
        padding: 8px;
   }
   `;

    const mho_window_style_tabs = `
    #tabs {
        color: #ddab76;
        font-size: 1.2rem;
        margin-bottom: 20px;
        position: relative;
        height: 25px;
        order-bottom: 1px solid #ddab76;
    }
    #tabs ul {
        display: flex;
        flex-wrap: wrap;
        padding: 0;
        background: url(${repo_img_hordes_url}background/tabs-header-plain.gif) 0 100% round;
        background-size: cover;
        height: 24px;
        margin-top: 2px;
        margin-right: 20px;
        padding-left: 0.5em;
    }
    #tabs > ul > li {
        cursor: pointer;
        display: inline-block;
        margin-top: auto;
        margin-bottom: auto;
    }
    #tabs > ul > li > div > img {
        margin-right: 0.5em;
    }
    #tabs > ul > li > div {
        background-image: url(${repo_img_hordes_url}background/tab.gif);
        background-position: 0 0;
        background-repeat: no-repeat;
        border-left: 1px solid #694023;
        border-right: 1px solid #694023;
        color: #f0d79e;
        cursor: pointer;
        float: right;
        font-family: Arial,sans-serif;
        font-size: 1rem;
        font-variant: small-caps;
        height: 21px;
        margin-left: 2px;
        margin-right: 0;
        margin-top: 3px;
        padding: 2px 4px 0;
        text-decoration: underline;
        white-space: nowrap;
    }
    #tabs > ul > li > div:hover {
        outline: 1px solid #f0d79e;
        text-decoration: underline;
    }
    #tabs > ul > li.selected {
        position: relative;
        top: 2px;
    }
    `;

    const tab_content_style = '.tab-content {'
        + 'position: absolute;'
        + 'bottom: 10px;'
        + 'left: 28px;'
        + 'right: 8px;'
        + 'top: 40px;'
        + 'overflow: auto;'
        + '}';

    const tab_content_item_list_style = '.tab-content > ul {'
        + 'display: flex;'
        + 'flex-wrap: wrap;'
        + 'padding: 0;'
        + 'margin: 0 0.5em;'
        + '}';

    const tab_content_item_list_item_style = '.tab-content > ul > li {'
        + 'min-width: 300px;'
        + 'flex-basis: min-content;'
        + 'padding: 0.125em 0.5em;'
        + 'margin: 0;'
        + '}';

    const tab_content_item_list_item_selected_style = '.tab-content > ul > li.selected {'
        + 'flex-basis: 100%;'
        + 'padding: 0.25em;'
        + 'margin: 0.25em 1px;'
        + '}';

    const tab_content_item_list_item_not_selected_properties_style = '.tab-content > ul > li:not(.selected) .properties {'
        + 'display: none;'
        + '}';

    const item_category = '.tab-content > ul div.mho-category {'
        + 'width: 100%;'
        + 'border-bottom: 1px solid;'
        + 'margin: 1em 0 0.5em;'
        + '}';

    const parameters_informations_ul_style = '#categories > ul, ul.parameters, #informations > ul {'
        + 'padding: 0;'
        + 'margin: 0;'
        + 'color: #f0d79e;'
        + '}';

    const li_style = '#categories > ul > li, ul.parameters > li, .tab-content ul > li, #informations ul > li {'
        + 'list-style: none;'
        + '}';

    const mho_table_style = '.mho-table {'
        + 'border-collapse: collapse;'
        + 'border-bottom: 1px solid #ddab76;'
        + '}';

    const mho_table_header_style = '.mho-header {'
        + 'font-size: 10pt;'
        + 'background: linear-gradient(0deg,#643b25 0,rgba(100,59,37,0) 50%,rgba(100,59,37,0)) !important;'
        + 'border-bottom: 2px solid #f0d79e;'
        + 'color: #fff;'
        + 'font-family: Trebuchet MS,Arial,Verdana,sans-serif;'
        + 'font-weight: 700;'
        + '}';

    const mho_table_row_style = '.mho-table tr:not(.mho-header) {'
        + 'background-color: #5c2b20;'
        + 'border-bottom: 1px solid #7e4d2a;'
        + '}';

    const mho_table_cells_style = '.mho-table tr th, .mho-table tr td {'
        + 'padding: 0.25em;'
        + '}';

    const mho_table_cells_td_style = '.mho-table tr td {'
        + 'border-left: 1px solid #7e4d2a;'
        + 'color: #f0d79e;'
        + 'font-size: 9pt;'
        + '}';

    const recipe_style = '.tab-content #recipes-list > li, .tab-content #notifications-list > li, #wishlist > li {'
        + 'min-width: 100% !important;'
        + 'display: flex;'
        + '}';

    const item_title_style = '.item-title {'
        + 'display: flex;'
        + 'justify-content: space-between;'
        + '}';

    const item_list_element_style = 'ul#item-list > li {'
        + 'background-color: #5c2b20;'
        + 'margin: 1px 1px;'
        + 'padding: 0.25em 0.5em;'
        + '}';

    const add_to_wishlist_button_img_style = '.add-to-wishlist > button > img {'
        + 'margin-right: 0;'
        + '}';

    const input_number_webkit_style = 'input.mho-input::-webkit-outer-spin-button, input.mho-input::-webkit-inner-spin-button {'
        + '-webkit-appearance: none;'
        + 'margin: 0;'
        + '}';

    const input_number_firefox_style = 'input.mho-input[type=number] {'
        + '-moz-appearance: textfield;'
        + '}';

    const wishlist_header = '#wishlist .mho-header, #wishlist > li {'
        + 'padding: 0 8px;'
        + 'margin: 0.125em 0;'
        + 'width: 100%;'
        + '}';

    const wishlist_even = '.tab-content #recipes-list > li:nth-child(even), .tab-content #notifications-list > li:nth-child(even), #wishlist > li:nth-child(even) {'
        + 'background-color: #5c2b20;'
        + '}';

    const wishlist_header_cell = '#wishlist .mho-header > div {'
        + 'display: inline-block;'
        + 'vertical-align: middle;'
        + '}'

    const wishlist_label = '#wishlist .label {'
        + 'width: calc(100% - 775px);'
        + 'min-width: 200px;'
        + 'padding: 0 4px;'
        + '}';

    const label_text = '.label_text {'
        + 'font-size: 1.2rem;'
        + 'font-variant: small-caps;'
        + '}';

    const wishlist_cols = '#wishlist .priority, #wishlist .depot, #wishlist .bank_count, #wishlist .bag_count, #wishlist .bank_needed, #wishlist .diff {'
        + 'width: 125px;'
        + 'padding: 0 4px;'
        + '}';

    const wishlist_delete = '#wishlist .delete {'
        + 'width: 25px;'
        + 'text-align: center;'
        + '}';

    const wishlist_in_app = '#wishlist-section ul {'
        + 'padding-left: 0;'
        + '}';

    const wishlist_in_app_item = '#wishlist-section ul > li {'
        + 'display: flex;'
        + 'justify-content: space-between;'
        + '}';

    const advanced_tooltip = `
        .mho-advanced-tooltip {
            margin-top: 0.5em;
            border-top: 1px solid;
            max-height: 400px;
            overflow-y: auto;
        }
        .mho-advanced-tooltip > table.recipes, #item-list > li.selected > .properties > table.recipes {
            border-collapse: collapse;
            width: 100%;
        }
        .mho-advanced-tooltip > table.recipes > tr, #item-list > li.selected > .properties > table.recipes > tr {
              border: dotted;
              border-width: 1px 0;
        }
        .mho-advanced-tooltip > table.recipes > tr:first-child, #item-list > li.selected > .properties > table.recipes > tr:first-child {
            border-top: none;
        }
        .mho-advanced-tooltip > table.recipes > tr:last-child, #item-list > li.selected > .properties > table.recipes > tr:last-child {
            border-bottom: none;
        }
        .mho-advanced-tooltip > table.recipes > tr > td.items > div, #item-list > li.selected > .properties > table.recipes > tr > td.items > div {
            display: flex;
            gap: 0.5em;
        }
        .mho-advanced-tooltip > table.recipes > tr > td:not(.results), #item-list > li.selected > .properties > table.recipes > tr > td:not(.results) {
            width: 0;
        }
        .mho-advanced-tooltip > table.recipes > tr > td.results > div, #item-list > li.selected > .properties > table.recipes > tr > td.results > div {
            flex-wrap: wrap;
        }
        div.tooltip.item:has(table.recipes) > div:first-of-type {
            width: 0 !important;
            min-width: 100% !important;
        }
        .mho-advanced-tooltip > table.recipes > tr > td.items > div > .item, #item-list > li.selected > .properties > table.recipes > tr > td.items > div > .item {
            background-color: #524053;
            padding: 0.5em;
            border-radius: 0.25em;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 0.25em;
        }
        .mho-advanced-tooltip > table.recipes > tr > td.items > div > .item.mho-recipe-provoking, #item-list > li.selected > .properties > table.recipes > tr > td.items > div > .item.mho-recipe-provoking {
            border: 1px dashed #ddab76;
        }
        div.tooltip.item:has(table.recipes) {
            min-width: 250px !important;
            max-width: 400px !important;
            width: auto !important;
        }
        .mho-frozen {
            pointer-events: all !important;
        }
        .mho-shift-hint {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            margin-right: 6px;
            opacity: 0.6;
            font-size: 0.75em;
            white-space: nowrap;
            flex-shrink: 0;
        }
        kbd.mho-shift-hint {
            border: 1px solid #f0d79e;
            border-radius: 3px;
            padding: 0 3px;
            font-family: inherit;
            line-height: 1.4;
            background: rgba(240,215,158,0.15);
        }
        img.mho-close-hint {
            margin-top: -6px;
        }
        .mho-close-hint {
            display: none;
        }
        .mho-frozen .mho-shift-hint {
            display: none;
        }
        .mho-frozen .mho-close-hint {
            display: initial;
        }
        .mho-tooltip-translations {
            display: flex;
            flex-direction: row;
            gap: 0.5em;
            flex-wrap: wrap;
            align-items: start;
            justify-content: start;
            border-bottom: 1px solid;
            margin: 0.25em 0;
            padding: 0.25em 0;
        }
        .mho-tooltip-translations .tooltip-translation {
            display: flex;
            flex-direction: row;
            gap: 0.5em;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: center;

            background-color: #5c2b20;
            border-radius: 0.25em;
            padding: 0.25em 0.5em;
        }
    `;

    const item_priority = `
        li.item[class^='priority_in'], li.item[class*=' priority_in'], img[class^='priority_in'], img[class*=' priority_in'] {
            box-shadow: inset 0 0 0.5em whitesmoke, 0 0 0.5em whitesmoke;
        }
        li.item[class^='priority_out'], li.item[class*=' priority_out'], img[class^='priority_out'], img[class*=' priority_out'] {
            box-shadow: inset 0 0 1em darkslategrey, 0 0 1em darkslategrey;
        }
        li.item.priority_trash, img.priority_trash {
            box-shadow: inset 0 0 0.5em black, 0 0 0.5em black;
        }`;

    const item_tags = `
        div.item-tag-food::after {
            background: url(${repo_img_hordes_url}status/status_haseaten.gif) 50%/contain no-repeat;
        }

        div.item-tag-load::after {
            background: url(${repo_img_hordes_url}item/item_pile.gif) 50%/contain no-repeat;
        }

        div.item-tag-hero::after {
            background: url(${repo_img_hordes_url}icons/star.gif) 50%/contain no-repeat;
        }

        div.item-tag-alcohol::after {
            background: url(${repo_img_hordes_url}status/status_drunk.gif) 50%/contain no-repeat;
        }

        div.item-tag-drug::after {
            background: url(${repo_img_hordes_url}status/status_drugged.gif) 50%/contain no-repeat;
        }

        div.item-tag.mho-item-tag-no-img {
            padding-left: 2px;
        }

        .mho-item-tag {
            min-height: 18px !important;
            height: unset !important;
        }
    `;

    const display_map_btn = `#${mho_display_map_id}, #${mho_store_notifications_id}, #${mho_display_expeditions_id} {`
        + 'background-color: rgba(62,36,23,.75);'
        + 'border-radius: 6px;'
        + 'color: #ddab76;'
        + 'cursor: pointer;'
        + 'font-size: 10px;'
        + 'padding: 3px 5px;'
        + 'transition: background-color .5s ease-in-out;'
        + 'display: flex;'
        + 'gap: 0.5em;'
        + '}';

    const mho_map_td = `.mho-map tr td {`
        + `border: 1px dotted;`
        + `width: 30px;`
        + `min-width: 30px;`
        + `height: 30px;`
        + `min-height: 30px;`
        + `text-align: center;`
        + `vertical-align: middle;`
        + `}`;

    const mho_ruin_td = `.mho-ruin tr td {`
        + `border: 1px dotted;`
        + `width: 25px;`
        + `min-width: 25px;`
        + `height: 25px;`
        + `min-height: 25px;`
        + `text-align: center;`
        + `vertical-align: middle;`
        + `}`;

    const dotted_background = '.dotted-background {'
        + `background-image: -moz-linear-gradient(45deg, #444 25%, transparent 25%),
                         -moz-linear-gradient(-45deg, #444 25%, transparent 25%),
                         -moz-linear-gradient(45deg, transparent 75%, #444 75%),
                         -moz-linear-gradient(-45deg, transparent 75%, #444 75%);`
        + `background-image: -webkit-gradient(linear, 0 100%, 100% 0, color-stop(.25, #444), color-stop(.25, transparent)),
                         -webkit-gradient(linear, 0 0, 100% 100%, color-stop(.25, #444), color-stop(.25, transparent)),
                         -webkit-gradient(linear, 0 100%, 100% 0, color-stop(.75, transparent), color-stop(.75, #444)),
                         -webkit-gradient(linear, 0 0, 100% 100%, color-stop(.75, transparent), color-stop(.75, #444));`
        + `background-image: -webkit-linear-gradient(45deg, #444 25%, transparent 25%),
                         -webkit-linear-gradient(-45deg, #444 25%, transparent 25%),
                         -webkit-linear-gradient(45deg, transparent 75%, #444 75%),
                         -webkit-linear-gradient(-45deg, transparent 75%, #444 75%);`
        + `background-image: -o-linear-gradient(45deg, #444 25%, transparent 25%),
                         -o-linear-gradient(-45deg, #444 25%, transparent 25%),
                         -o-linear-gradient(45deg, transparent 75%, #444 75%),
                         -o-linear-gradient(-45deg, transparent 75%, #444 75%);`
        + `background-image: linear-gradient(45deg, #444 25%, transparent 25%),
                         linear-gradient(-45deg, #444 25%, transparent 25%),
                         linear-gradient(45deg, transparent 75%, #444 75%),
                         linear-gradient(-45deg, transparent 75%, #444 75%);`
        + `-moz-background-size: 2px 2px;`
        + `background-size: 2px 2px;`
        + `-webkit-background-size: 2px 2px; /* override value for webkit */`
        + `background-position: 0 0, 1px 0, 1px -1px, 0px 1px;`
        + '}';

    let empty_bat_before_after = '.empty-bat:before, .empty-bat:after {'
        + 'position: absolute;'
        + 'content: "";'
        + 'background: black;'
        + 'display: block;'
        + 'width: 1px;'
        + 'height: 25px;'
        + '-webkit-transform: rotate(-45deg);'
        + 'transform: rotate(-45deg);'
        + 'left: 0;'
        + 'right: 0;'
        + 'top: 0;'
        + 'bottom: 0;'
        + 'margin: auto;'
        + '}';

    let empty_bat_after = '.empty-bat:after {'
        + '-webkit-transform: rotate(45deg);'
        + 'transform: rotate(45deg);'
        + '}';

    let camping_spaced_label = '.spaced-label:after {'
        + `content: '\\00a0:\\00a0'`
        + '}';

    let hidden = `
        .mho-hidden {
            display: none !important;
        }
    `;

    let new_changelog = `
        div.mho-new-changelog::before {
            position: absolute;
            top: -3px;
            left: -3px;
        }
        a.mho-new-changelog::before {
            position: relative;
            top: 0;
            left: 0;
        }
        .mho-new-changelog::before {
            content: '';
            width: 6px;
            aspect-ratio: 1;
            background: #4B107B;
            border-radius: 50%;
            box-shadow: 0px 0px 6px 3px #BF61CF;
            display: inline-block;
        }
        `;

    let new_version = `
        div.mho-new-version::before {
            position: absolute;
            top: -3px;
            left: -3px;
        }
        .mho-new-version::before {
            content: '';
            width: 8px;
            aspect-ratio: 1;
            background: #BF61CF;
            border-radius: 50%;
            box-shadow: 0px 0px 8px 4px #4B107B;
            display: inline-block;
        }
        `;

    let sort_arrow = `
        .mho-sort-arrow {
            display: inline-block;
            margin-left: 2px;
            opacity: 0.4;
            font-size: 10px;
            cursor: pointer;
            user-select: none;
            transition: opacity .15s;
        }

        .mho-sortable-cell {
            cursor: pointer;
            white-space: nowrap;
        }
    `;

    let multi_select = `
        .mho-checkbox-dropdown-panel {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 10;
            max-height: 200px;
            overflow-y: auto;
            padding: 4px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        .mho-checkbox-dropdown-panel > div {
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }

        .mho-dropdown-toggle {
            max-width: 200px;
        }

        #mho-filter-omniscience-stars {
            min-width: 110px;
        }
    `;

    let mho_filters = `
        .mho-filter-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5em;
            margin-bottom: 0.5em;
            align-items: flex-end;
        }

        .mho-filter-field {
            display: flex;
            flex-direction: column;
            gap: 2px;
            position: relative;
        }

        .mho-filter-label {
            display: block !important;
            width: 100%;
            font-size: 0.8em;
        }

        .mho-search-wrapper {
            position: relative;
        }

        .mho-search-input {
            padding-left: 24px;
            margin-bottom: 0;
        }

        .mho-search-icon {
            height: 24px;
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
        }
    `;

    let css = params_style + btn_style + mho_window_style + new_changelog + new_version
        + mho_window_style_tabs + tab_content_style + tab_content_item_list_style + tab_content_item_list_item_style + tab_content_item_list_item_selected_style + tab_content_item_list_item_not_selected_properties_style + item_category
        + parameters_informations_ul_style + li_style + recipe_style + input_number_webkit_style + input_number_firefox_style
        + mho_table_style + mho_table_header_style + mho_table_row_style + mho_table_cells_style + mho_table_cells_td_style + label_text
        + item_title_style + add_to_wishlist_button_img_style + advanced_tooltip + item_list_element_style
        + wishlist_label + wishlist_header + wishlist_header_cell + wishlist_cols + wishlist_delete + wishlist_in_app + wishlist_in_app_item + wishlist_even
        + item_priority + item_tags
        + display_map_btn + mho_map_td + mho_ruin_td + dotted_background + empty_bat_before_after + empty_bat_after + camping_spaced_label + hidden + sort_arrow + multi_select + mho_filters;

    let style = document.createElement('style');

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
}

////////////////////////////
// Appels outils externes //
////////////////////////////

/** Récupère la carte de GH */
