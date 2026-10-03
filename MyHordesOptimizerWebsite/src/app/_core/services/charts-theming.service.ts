import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import Chart from 'chart.js/auto';

/** Rôles de couleur demandés par les graphiques. */
type ColorRole = 'text' | 'muted' | 'grid' | 'surface';

/** Jeton correspondant à chaque rôle. */
const TOKENS: Readonly<Record<ColorRole, string>> = {
    text: '--mho-text',
    muted: '--mho-text-muted',
    grid: '--mho-line',
    surface: '--mho-surface'
};

/** Nombre d'emplacements de la palette catégorielle (`--mho-chart-1` … `--mho-chart-6`). */
const SERIES_COUNT: number = 6;

@Injectable({ providedIn: 'root' })
export class ChartsThemingService {

    private readonly document: Document = inject(DOCUMENT);

    private readonly FALLBACK: string = 'rgba(255, 255, 255, 0.9)';

    /**
     * Sonde partagée : les jetons sont écrits en `light-dark()`, que
     * `getPropertyValue('--mho-text')` renvoie **tel quel** — Chart.js dessine sur un canevas et
     * ne sait pas résoudre une fonction CSS. Poser le jeton sur la propriété `color` d'un élément
     * puis lire son style calculé donne, lui, un `rgb()` résolu.
     */
    private probe: HTMLElement | null = null;

    /** Couleurs du thème mises en cache pour un rendu donné ; vidées à chaque changement. */
    private cache: Map<string, string> = new Map<string, string>();

    /** Applique au moteur ce qui vaut pour tous les graphiques : encre, grilles, bordures. */
    public defineColorsWithTheme(): void {
        this.cache.clear();

        Chart.defaults.color = this.color('text');
        // Grilles et axes seulement. La couleur de remplissage par défaut n'est volontairement pas
        // touchée : la changer désactive le greffon « colors » de Chart.js, et tout graphique qui
        // n'aurait pas ses couleurs explicites deviendrait monochrome sans prévenir.
        Chart.defaults.borderColor = this.color('grid');
    }

    /** Couleur d'un rôle du thème, résolue en `rgb()`. */
    public color(role: ColorRole): string {
        return this.resolve(TOKENS[role]);
    }

    /**
     * Couleur résolue d'un jeton quelconque du design system (`--mho-surface-2`, `--mho-accent`…),
     * pour les autres bibliothèques qui dessinent sur un canevas (graphe `vis-network` de la page
     * IRL). Même cache que les rôles, vidé au même moment.
     */
    public token(name: `--mho-${string}`): string {
        return this.resolve(name);
    }

    /**
     * Couleur de la série d'indice donné. Les emplacements sont attribués dans l'ordre et jamais
     * recyclés : au-delà de la palette, on repart au début plutôt que d'inventer une teinte, mais
     * un graphique qui en arrive là a trop de séries pour être lu.
     */
    public series(index: number): string {
        return this.resolve(`--mho-chart-${(index % SERIES_COUNT) + 1}`);
    }

    /** Même couleur que `series()`, en remplissage translucide. */
    public seriesFill(index: number, alpha: number = 0.35): string {
        return this.withAlpha(this.series(index), alpha);
    }

    /** Applique une opacité à une couleur déjà résolue (`rgb()` ou `rgba()`). */
    public withAlpha(color: string, alpha: number): string {
        const channels: RegExpMatchArray | null = color.match(/-?\d*\.?\d+/g);
        if (!channels || channels.length < 3) {
            return color;
        }
        return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
    }

    private resolve(token: string): string {
        const cached: string | undefined = this.cache.get(token);
        if (cached !== undefined) {
            return cached;
        }

        const probe: HTMLElement = this.getProbe();
        probe.style.color = `var(${token})`;
        const resolved: string = getComputedStyle(probe).color.trim() || this.FALLBACK;
        this.cache.set(token, resolved);
        return resolved;
    }

    private getProbe(): HTMLElement {
        if (!this.probe) {
            const probe: HTMLElement = this.document.createElement('span');
            // Hors flux et hors lecture d'écran : la sonde ne sert qu'à faire calculer une couleur.
            // `visibility: hidden` plutôt que `display: none` : la valeur calculée de `color` reste
            // garantie sur un élément simplement invisible.
            probe.style.position = 'absolute';
            probe.style.visibility = 'hidden';
            probe.style.pointerEvents = 'none';
            probe.setAttribute('aria-hidden', 'true');
            this.document.body.appendChild(probe);
            this.probe = probe;
        }
        return this.probe;
    }

}
