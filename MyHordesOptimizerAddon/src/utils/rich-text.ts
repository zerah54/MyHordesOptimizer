/**
 * Texte mis en forme saisi sur le site (éditeur des consignes), affiché dans le jeu sans `innerHTML` : seules
 * les balises de mise en forme sont recréées, sans attribut hors d'une courte liste contrôlée. Un script, un
 * gestionnaire d'évènement ou un lien `javascript:` ne peut donc pas passer.
 */

/** Balises recréées telles quelles (sans attribut) */
const FORMAT_TAGS: ReadonlySet<string> = new Set<string>([
    'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'DEL', 'MARK', 'SPAN', 'CODE', 'PRE', 'BLOCKQUOTE',
    'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'LABEL', 'DIV'
]);

/** Contenu jamais recopié, même en texte */
const DROPPED_TAGS: ReadonlySet<string> = new Set<string>(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH']);

/** Propriétés de style gardées, et la forme de leur valeur */
const STYLE_RULES: ReadonlyMap<string, RegExp> = new Map<string, RegExp>([
    ['color', /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i],
    ['background-color', /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i],
    ['text-align', /^(left|right|center|justify)$/i],
    ['font-size', /^\d+(\.\d+)?(px|em|rem|%)$/i]
]);

const SAFE_URL: RegExp = /^https?:\/\//i;

function safeStyle(source: Element): string {
    const declarations: string[] = (source.getAttribute('style') ?? '')
        .split(';')
        .flatMap((declaration: string): string[] => {
            const separator: number = declaration.indexOf(':');
            if (separator < 0) return [];
            const property: string = declaration.slice(0, separator).trim().toLowerCase();
            const value: string = declaration.slice(separator + 1).trim();
            const rule: RegExp | undefined = STYLE_RULES.get(property);
            return rule?.test(value) ? [`${property}: ${value}`] : [];
        });
    return declarations.join('; ');
}

/** Copie contrôlée d'un élément ; `null` pour une balise non reconnue (son contenu est alors repris seul). */
function copyElement(source: Element, target_document: Document): Element | null {
    const tag: string = source.tagName.toUpperCase();
    let copy: Element | null = null;
    if (FORMAT_TAGS.has(tag)) {
        copy = target_document.createElement(tag.toLowerCase());
    } else if (tag === 'A') {
        const href: string = source.getAttribute('href') ?? '';
        if (!SAFE_URL.test(href)) return null;
        const link: HTMLAnchorElement = target_document.createElement('a');
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        copy = link;
    } else if (tag === 'IMG') {
        const src: string = source.getAttribute('src') ?? '';
        if (!SAFE_URL.test(src)) return null;
        const image: HTMLImageElement = target_document.createElement('img');
        image.src = src;
        image.alt = source.getAttribute('alt') ?? '';
        image.style.maxWidth = '100%';
        copy = image;
    } else if (tag === 'INPUT' && source.getAttribute('type') === 'checkbox') {
        /** Case des listes de tâches de l'éditeur : affichée, jamais modifiable */
        const checkbox: HTMLInputElement = target_document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.disabled = true;
        checkbox.checked = source.hasAttribute('checked');
        copy = checkbox;
    }
    if (!copy) return null;

    const style: string = safeStyle(source);
    if (style && copy instanceof HTMLElement) {
        copy.style.cssText = style;
    }
    return copy;
}

function copyChildren(source: Node, target: Node, target_document: Document): void {
    source.childNodes.forEach((child: ChildNode): void => {
        if (child.nodeType === Node.TEXT_NODE) {
            target.appendChild(target_document.createTextNode(child.textContent ?? ''));
            return;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) return;

        const element: Element = child as Element;
        if (DROPPED_TAGS.has(element.tagName.toUpperCase())) return;
        const copy: Element | null = copyElement(element, target_document);
        copyChildren(element, copy ?? target, target_document);
        if (copy) target.appendChild(copy);
    });
}

/** Ajoute à `container` le texte mis en forme `html`, réduit aux balises de mise en forme. */
export function appendRichText(container: HTMLElement, html: string | null | undefined): void {
    if (!html) return;
    const parsed: Document = new DOMParser().parseFromString(html, 'text/html');
    copyChildren(parsed.body, container, container.ownerDocument);
}
