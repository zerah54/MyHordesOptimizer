
export function AutoDestroy(component: any, key: string | symbol): void {
    /** On garde le OnDestroy original pour l'exécuter avant le reste */
    const originalOnDestroy: () => void = component.ngOnDestroy;

    component.ngOnDestroy = function () {
      if (originalOnDestroy) {
        /** Si il existe, on appel le OnDestroy original */
        originalOnDestroy.call(this);
      }

      /** On détruit la suscription */
      this[key].next();
      this[key].complete();
    }
  }
