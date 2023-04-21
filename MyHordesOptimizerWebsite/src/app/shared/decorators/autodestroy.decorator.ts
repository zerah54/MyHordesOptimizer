export function AutoDestroy(component: any, key: string | symbol): void {
    /** On garde le OnDestroy original pour l'exécuter avant le reste */
    const originalOnDestroy: () => void = component.ngOnDestroy;

    component.ngOnDestroy = (): void => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (this) {
            if (originalOnDestroy) {
                /** Si il existe, on appel le OnDestroy original */
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                originalOnDestroy.call(this);
            }

            /** On détruit la suscription */
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this[key].next();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this[key].complete();
        }
    };
}
