import { AfterViewInit, Directive, ElementRef, inject, NgZone, OnDestroy, Renderer2 } from '@angular/core';

/**
 * Détecte la présence de scroll dans un conteneur et pose les classes `can-scroll-{up,down,
 * left,right}` sur l'hôte, uniquement pour les directions où il reste du contenu à faire
 * défiler. Le rendu visuel est laissé au CSS : sur la carte, ces classes déclenchent une
 * ombre portée sur les cases de bordure collées (cadre de coordonnées), qui indique le sens
 * du contenu masqué.
 */
@Directive({
    selector: '[cartoScrollAura]',
})
export class ScrollAuraDirective implements AfterViewInit, OnDestroy {

    private static readonly THRESHOLD: number = 1;

    private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
    private readonly renderer: Renderer2 = inject(Renderer2);
    private readonly zone: NgZone = inject(NgZone);

    private resizeObserver: ResizeObserver | null = null;
    private mutationObserver: MutationObserver | null = null;
    private frameRequested: boolean = false;
    private readonly scheduleUpdate: () => void = (): void => this.requestUpdate();

    public ngAfterViewInit(): void {
        this.zone.runOutsideAngular((): void => {
            const element: HTMLElement = this.elementRef.nativeElement;
            element.addEventListener('scroll', this.scheduleUpdate, {passive: true});

            this.resizeObserver = new ResizeObserver(this.scheduleUpdate);
            this.resizeObserver.observe(element);

            this.mutationObserver = new MutationObserver(this.scheduleUpdate);
            this.mutationObserver.observe(element, {childList: true, subtree: true});

            this.update();
        });
    }

    public ngOnDestroy(): void {
        this.elementRef.nativeElement.removeEventListener('scroll', this.scheduleUpdate);
        this.resizeObserver?.disconnect();
        this.mutationObserver?.disconnect();
    }

    private requestUpdate(): void {
        if (this.frameRequested) {
            return;
        }
        this.frameRequested = true;
        requestAnimationFrame((): void => {
            this.frameRequested = false;
            this.update();
        });
    }

    private update(): void {
        const element: HTMLElement = this.elementRef.nativeElement;
        const threshold: number = ScrollAuraDirective.THRESHOLD;

        this.toggleClass('can-scroll-up', element.scrollTop > threshold);
        this.toggleClass('can-scroll-down', element.scrollTop + element.clientHeight < element.scrollHeight - threshold);
        this.toggleClass('can-scroll-left', element.scrollLeft > threshold);
        this.toggleClass('can-scroll-right', element.scrollLeft + element.clientWidth < element.scrollWidth - threshold);
    }

    private toggleClass(className: string, enabled: boolean): void {
        if (enabled) {
            this.renderer.addClass(this.elementRef.nativeElement, className);
        } else {
            this.renderer.removeClass(this.elementRef.nativeElement, className);
        }
    }

}
