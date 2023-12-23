import { Clipboard } from '@angular/cdk/clipboard';
import { inject, Injectable } from '@angular/core';
import { SnackbarService } from './snackbar.service';

@Injectable({ providedIn: 'root' })
export class ClipboardService {

    private snackbar_service: SnackbarService = inject(SnackbarService);

    constructor(private clipboard: Clipboard) {
    }

    public copy(text: string, success: string): void {
        this.clipboard.copy(text);
        this.snackbar_service.successSnackbar(success);
    }
}
