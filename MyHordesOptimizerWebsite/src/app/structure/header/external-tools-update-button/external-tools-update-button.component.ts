import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, InputSignal, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, timer } from 'rxjs';

import {
    ExternalToolId,
    ExternalToolsUpdateJobStateDTO,
    ExternalToolUpdateErrorDTO,
    ExternalToolUpdateStateDTO,
    ExternalToolUpdateStatus
} from '../../../_abstract_model/dto/external-tools-update-state.dto';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { SnackbarService } from '../../../_core/services/snackbar.service';

interface ToolDisplay {
    id: ExternalToolId;
    /** Nom propre : jamais traduit */
    name: string;
    icon: string;
}

interface ToolBadge {
    name: string;
    icon: string;
    status: ExternalToolUpdateStatus;
    tooltip: string;
}

/** Délai après lequel un succès complet rend la main au libellé normal */
const SUCCESS_RESET_MS: number = 5000;

const TOOLS: ToolDisplay[] = [
    { id: 'myHordesOptimizer', name: 'MyHordes Optimizer', icon: 'img/logo/logo_mho_64x64.png' },
    { id: 'gestHordes', name: 'Gest\'Hordes', icon: 'img/external-tools/gh.gif' },
    { id: 'fataMorgana', name: 'Fata Morgana', icon: 'img/external-tools/fata.gif' },
    { id: 'bigBrothHordes', name: 'BigBroth\'Hordes', icon: 'img/external-tools/bbh.gif' }
];

const material_modules: Imports = [MatButtonModule, MatIconModule, MatTooltipModule];

@Component({
    selector: 'mho-external-tools-update-button',
    imports: [...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './external-tools-update-button.component.html',
    styleUrl: './external-tools-update-button.component.scss'
})
export class ExternalToolsUpdateButtonComponent {
    /** Variante icône seule, utilisée sous le point de rupture xs */
    public readonly isCompact: InputSignal<boolean> = input<boolean>(false);

    protected readonly tools_state: WritableSignal<ExternalToolUpdateStateDTO[]> = signal<ExternalToolUpdateStateDTO[]>([]);

    protected readonly badges: Signal<ToolBadge[]> = computed(() => {
        return this.tools_state()
            .map((state: ExternalToolUpdateStateDTO) => {
                const display: ToolDisplay | undefined = TOOLS.find((tool: ToolDisplay) => tool.id === state.tool);
                if (!display) {
                    return null;
                }
                return {
                    name: display.name,
                    icon: display.icon,
                    status: state.status,
                    tooltip: this.buildTooltip(display.name, state)
                };
            })
            .filter((badge: ToolBadge | null): badge is ToolBadge => badge !== null);
    });

    private readonly town_service: TownService = inject(TownService);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    /** Retour au libellé normal après un succès : annulé par un nouveau clic */
    private reset_subscription: Subscription | null = null;
    private is_running: boolean = false;

    protected update(): void {
        if (this.is_running) {
            return;
        }

        this.reset_subscription?.unsubscribe();
        this.reset_subscription = null;
        this.is_running = true;
        this.tools_state.set([]);

        this.town_service.updateExternalTools()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (state: ExternalToolsUpdateJobStateDTO) => {
                    this.is_running = state.isRunning;
                    this.tools_state.set(state.tools ?? []);
                },
                error: () => {
                    this.is_running = false;
                    this.tools_state.set([]);
                    this.snackbar.errorSnackbar($localize`:@@mho_external_tools_update_start_failed:La mise à jour des outils externes n'a pas pu être lancée`);
                },
                complete: () => this.onFollowEnded()
            });
    }

    /**
     * Le suivi peut s'arrêter sur son garde-fou de deux minutes alors que le traitement continue
     * côté serveur : les outils encore en cours sont alors présentés comme dépassés.
     */
    private onFollowEnded(): void {
        if (this.is_running) {
            this.tools_state.update((tools: ExternalToolUpdateStateDTO[]) => tools.map((tool: ExternalToolUpdateStateDTO) => {
                if (tool.status !== 'pending') {
                    return tool;
                }
                return {
                    ...tool,
                    status: 'error',
                    errors: [{ unit: 'job', message: $localize`:@@mho_external_tools_update_timeout:Délai dépassé` }]
                };
            }));
            this.is_running = false;
        }

        const has_error: boolean = this.tools_state().some((tool: ExternalToolUpdateStateDTO) => tool.status === 'error');
        if (has_error) {
            return;
        }
        this.reset_subscription = timer(SUCCESS_RESET_MS)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => this.tools_state.set([]));
    }

    private buildTooltip(name: string, state: ExternalToolUpdateStateDTO): string {
        if (state.status === 'pending') {
            return `${name} : ${$localize`:@@mho_external_tools_update_pending:mise à jour en cours`}`;
        }
        if (state.status === 'success') {
            return `${name} : ${$localize`:@@mho_external_tools_update_success:à jour`}`;
        }
        const messages: string = state.errors.map((error: ExternalToolUpdateErrorDTO) => `${error.unit} : ${error.message}`).join('\n');
        return `${name} : ${$localize`:@@mho_external_tools_update_error:échec`}\n${messages}`;
    }
}
