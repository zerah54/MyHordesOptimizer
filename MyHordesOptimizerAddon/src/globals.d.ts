// ==========================================================================
// Ambient declarations.
//
// 1) Userscript-manager / WebExtension APIs (GM.*, GM_info, browser, chrome)
//    — provided at runtime by Tampermonkey/Greasemonkey or the browser
//    extension itself. Never declared anywhere in regular code, so they
//    must be declared ambiently for TypeScript.
//
// 2) Permissive DOM augmentations. The original script is plain
//    pre-TypeScript JavaScript and treats DOM elements/styles loosely
//    (arbitrary property reads/writes, numbers assigned to style
//    properties, etc.) — all valid at runtime. Rather than rewriting
//    hundreds of call sites (and risking behavioural changes), these
//    declarations widen the relevant DOM interfaces to match how the
//    code actually uses them.
//
// This file has no top-level import/export, so it is a global script
// (not a module) and every `declare` below is visible everywhere
// without needing an explicit import.
// ==========================================================================

declare const GM: {
    getValue: (key: string, defaultValue?: any) => Promise<any>;
    setValue: (key: string, value: any) => Promise<void>;
    [key: string]: any;
};
declare const GM_info: any;

declare function GM_notification(details: any): void;

declare const browser: any;
declare const chrome: any;

interface Element {
    [key: string]: any;
}

interface EventTarget {
    [key: string]: any;
}

interface Node {
    [key: string]: any;
}

interface CSSStyleDeclaration {
    [key: string]: any;
}

interface Navigator {
    userLanguage?: string;
    msMaxTouchPoints?: number;
}

interface Error {
    status?: number;
}
