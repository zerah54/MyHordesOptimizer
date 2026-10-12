import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, InputSignal, OnInit, output, OutputEmitterRef, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports } from '../../_abstract_model/types/_types';
import { ClipboardService } from '../../_core/services/clipboard.service';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { ToolPreset, ToolPresetsService } from '../../_core/services/tool-presets.service';
import { buildShareUrl } from '../../_core/utilities/tool-snapshot.util';

/** Longueur maximale du nom d'un preset. */
const MAX_PRESET_NAME_LENGTH: number = 40;

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatTooltipModule];

/**
 * Partage et presets d'un outil : copie un lien portant la configuration courante, et range des
 * configurations nommées dans le navigateur. L'outil fournit son snapshot et applique celui qu'on lui renvoie.
 */
@Component({
    selector: 'mho-tool-presets',
    templateUrl: './tool-presets.component.html',
    styleUrls: ['./tool-presets.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class ToolPresetsComponent implements OnInit {
    /** Identifiant de l'outil, qui sépare ses presets de ceux des autres. */
    public readonly tool: InputSignal<string> = input.required<string>();
    /** Fournit la configuration courante de l'outil. */
    public readonly snapshot: InputSignal<() => Record<string, unknown>> = input.required<() => Record<string, unknown>>();
    /** Émet le snapshot du preset choisi ; l'outil le valide et l'applique. */
    public readonly apply: OutputEmitterRef<Record<string, unknown>> = output<Record<string, unknown>>();

    protected readonly max_name_length: number = MAX_PRESET_NAME_LENGTH;
    protected readonly presets: WritableSignal<ToolPreset[]> = signal([]);
    protected preset_name: string = '';

    private readonly presets_service: ToolPresetsService = inject(ToolPresetsService);
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly snackbar_service: SnackbarService = inject(SnackbarService);
    private readonly document: Document = inject(DOCUMENT);

    public ngOnInit(): void {
        this.presets.set(this.presets_service.list(this.tool()));
    }

    /** Copie le lien de la page portant la configuration courante. */
    protected copyLink(): void {
        this.clipboard.copy(buildShareUrl(this.document.location.href, this.snapshot()()), $localize`Le lien a bien été copié`);
    }

    /** Enregistre la configuration courante sous le nom saisi (remplace un preset de même nom). */
    protected save(): void {
        if (!this.presets_service.save(this.tool(), this.preset_name, this.snapshot()())) {
            this.snackbar_service.errorSnackbar($localize`La configuration n'a pas pu être enregistrée.`);
            return;
        }
        this.preset_name = '';
        this.presets.set(this.presets_service.list(this.tool()));
        this.snackbar_service.successSnackbar($localize`Configuration enregistrée`);
    }

    protected load(preset: ToolPreset): void {
        this.apply.emit(preset.snapshot);
    }

    protected remove(preset: ToolPreset): void {
        this.presets_service.delete(this.tool(), preset.name);
        this.presets.set(this.presets_service.list(this.tool()));
    }
}
