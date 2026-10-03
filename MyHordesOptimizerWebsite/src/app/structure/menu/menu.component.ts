import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    inject,
    LOCALE_ID,
    model,
    ModelSignal,
    OnInit,
    Signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Theme } from '../../_abstract_model/interfaces';
import { AdminService } from '../../_abstract_model/services/admin.service';
import { Imports } from '../../_abstract_model/types/_types';
import { ThemeMode, ThemePreference, ThemeService } from '../../_core/services/theme.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { ThanksComponent } from '../../thanks/thanks.component';
import { TownChipComponent } from '../header/town-chip/town-chip.component';
import { buildSidenavLinks, resolveSidenavLabel, resolveSidenavPath, SidenavLinks } from './sidenav-links';

const angular_common: Imports = [CommonModule, NgTemplateOutlet, RouterLink, RouterLinkActive];
const components: Imports = [TownChipComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatDividerModule, MatIconModule, MatListModule, MatMenuModule, MatTooltipModule];

@Component({
    selector: 'mho-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements OnInit {
    public sidenavContainer: ModelSignal<MatSidenavContainer> = model.required();
    /** Conservé pour `checkIsAdmin()` : c'est ce menu qui déclenche la vérification au
     *  démarrage, l'entrée Administration ayant rejoint le menu utilisateur de l'en-tête. */
    private readonly adminService: AdminService = inject(AdminService);
    private readonly theme_service: ThemeService = inject(ThemeService);
    /** Clair / Sombre / Auto, indépendant de la famille de couleurs. */
    protected readonly theme_mode: Signal<ThemeMode> = this.theme_service.mode;
    protected themes: Theme[] = [
        { label: $localize`Par défaut`, class: '' },
        { label: $localize`Rose`, class: 'pink' },
        { label: $localize`Brun`, class: 'brown' },
    ];
    /** Entrée cochée dans le menu : dérivée de la préférence du service, `''` = « Par défaut ». */
    protected readonly selected_theme: Signal<Theme | undefined> = computed((): Theme | undefined => {
        const preference: ThemePreference = this.theme_service.preference();
        const wanted: string = preference === 'auto' ? '' : preference;
        return this.themes.find((theme: Theme): boolean => theme.class === wanted);
    });
    /** La liste des langues disponibles */
    protected language_list: Language[] = [
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français', default: true },
        { code: 'es', label: 'Español' },
        { code: 'de', label: 'Deutsch' }
    ];
    /** La langue sélectionnée pour l'affichage de l'application */
    protected site_language: Language | undefined;
    /** Arborescence partagée avec la recherche globale (voir `sidenav-links.ts`). */
    protected routes: SidenavLinks[] = buildSidenavLinks(inject(TownContextService));
    private readonly locale_id: string = inject(LOCALE_ID);
    private readonly document: Document = inject<Document>(DOCUMENT);
    private readonly town_context: TownContextService = inject(TownContextService);
    private readonly router: Router = inject(Router);
    private readonly change_detector: ChangeDetectorRef = inject(ChangeDetectorRef);
    private readonly dialog: MatDialog = inject(MatDialog);
    protected readonly myhordes_url: string = environment.myhordes_url;
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    public ngOnInit(): void {
        /** Si il y a une langue enregistrée, on l'utilise, sinon on utilise le français */
        const used_locale: string = this.locale_id;
        /** Si dans la liste des langues supportées on trouve la langue ci-dessus, on l'utilise, sinon on utilise le français */
        this.site_language = this.language_list.some((language: Language) => used_locale === language.code)
            ? this.language_list.find((language: Language) => used_locale === language.code)
            : this.language_list.find((language: Language) => language.default);

        this.defineThemes();
        this.adminService.checkIsAdmin().subscribe();

        this.openGroupOfCurrentRoute();
        this.router.events
            .pipe(filter((event: unknown): boolean => event instanceof NavigationEnd), takeUntilDestroyed(this.destroy_ref))
            .subscribe((): void => this.openGroupOfCurrentRoute());

        setTimeout(() => {
            this.resizeSidenav();
        });
    }

    /**
     * Ouvre le groupe qui contient la route courante, et ne touche pas aux autres.
     *
     * Cette méthode repliait aussi tous les autres groupes, du temps où les 22 entrées dépliées
     * débordaient de la fenêtre. La liste défile désormais, la contrainte a disparu, et refermer
     * un groupe que l'utilisateur venait d'ouvrir défaisait son clic sous ses yeux.
     *
     * `markForCheck()` est indispensable : l'application est **zéro-zone**, et ces propriétés sont
     * de simples champs d'objet mutés depuis un abonnement au routeur. Sans lui, rien ne prévient
     * Angular — le modèle s'ouvrait, la vue restait fermée, et le clic suivant partait de l'état
     * inverse de celui qu'on voyait. C'est ce décalage qui donnait des clics « sans effet » puis
     * deux groupes ouverts d'un coup.
     */
    private openGroupOfCurrentRoute(): void {
        const url: string = this.router.url;
        this.routes
            .filter((group: SidenavLinks): boolean => this.containsUrl(group, url))
            .forEach((group: SidenavLinks): void => {
                group.expanded = true;
                this.toggleDisplayChildren(group);
            });
        this.change_detector.markForCheck();
    }

    /** Vrai si l'entrée, ou l'une de ses descendantes, correspond à l'URL courante. */
    private containsUrl(route: SidenavLinks, url: string): boolean {
        const path: string | undefined = route.children ? undefined : this.resolvePath(route);
        if (path) {
            const absolute: string = path.startsWith('/') ? path : `/${path}`;
            if (url === absolute || url.startsWith(`${absolute}/`) || url.startsWith(`${absolute}?`)) {
                return true;
            }
        }
        return (route.children ?? []).some((child: SidenavLinks): boolean => this.containsUrl(child, url));
    }

    protected toggleDisplayChildren(route: SidenavLinks): void {
        if (route.children && route.children.length > 0) {
            route.children?.forEach((child: SidenavLinks) => {
                child.displayed = route.expanded || false;
                if (!child.displayed) {
                    child.expanded = child.displayed;
                }
                this.toggleDisplayChildren(child);
            });
            this.resizeSidenav();
        }
    }

    /** `''` = « Par défaut » : suit les thèmes saisonniers, c'est le service qui les résout. */
    protected changeTheme(new_theme: Theme): void {
        this.theme_service.setPreference((new_theme.class === '' ? 'auto' : new_theme.class) as ThemePreference);
    }

    /** Repris du footer, supprimé : la boîte de dialogue des remerciements reste accessible. */
    protected openThanks(): void {
        this.dialog.open(ThanksComponent, { width: '50%', minWidth: '250px' });
    }

    /** Le mode ne dépend que de `color-scheme` : la bascule est immédiate, sans rechargement. */
    protected changeMode(new_mode: ThemeMode): void {
        this.theme_service.setMode(new_mode);
    }

    /**
     * Change la langue sélectionnée
     *
     * @param {Language} new_language
     */
    protected changeLanguage(new_language: Language): void {
        this.site_language = new_language;
        localStorage.setItem('mho-locale', new_language.code);
        setTimeout(() => {
            this.reloadPage();
        });
    }

    /** Extrait pour rester substituable en test (`location.reload` n'est ni espionnable ni redéfinissable
     *  sous Chrome Headless). */
    private reloadPage(): void {
        this.document.location.reload();
    }

    /** Résout le lien d'une entrée en tenant compte du contexte d'observation. */
    protected resolvePath(route: SidenavLinks): string | undefined {
        return resolveSidenavPath(route, this.town_context);
    }

    /** Résout le libellé : la section ville prend le nom de la ville observée en mode observateur. */
    protected resolveLabel(route: SidenavLinks): string {
        return resolveSidenavLabel(route, this.town_context);
    }

    private resizeSidenav(): void {
        const sidenavContainer: MatSidenavContainer = this.sidenavContainer();
        sidenavContainer.autosize = true;
        this.sidenavContainer.set(sidenavContainer);
        setTimeout((): void => {
            this.sidenavContainer.set(sidenavContainer);
        });
    }

    /**
     * Complète la liste proposée. Elle ne fait plus qu'AFFICHER : « Par défaut » applique
     * déjà le thème saisonnier du jour (voir {@link ThemeService.currentSeason}), sans rien
     * écrire dans le stockage local — c'est ce qui laissait auparavant un utilisateur sur
     * « noel » une fois la saison passée, jusqu'à ce qu'un `changeTheme()` différé le corrige.
     * Hors production, les deux thèmes restent proposés toute l'année pour pouvoir les relire.
     */
    private defineThemes(): void {
        const season: string | null = this.theme_service.season();

        if (season === 'noel' || !environment.production) {
            this.themes.push({ label: $localize`Noël`, class: 'noel' });
        }

        if (season === 'halloween' || !environment.production) {
            this.themes.push({ label: $localize`Halloween`, class: 'halloween' });
        }
    }




}

interface Language {
    code: string;
    label: string;
    default?: boolean;
}
