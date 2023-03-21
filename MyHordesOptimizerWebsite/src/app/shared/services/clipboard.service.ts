import { Clipboard } from '@angular/cdk/clipboard';
import { Injectable } from '@angular/core';
import { SnackbarService } from './snackbar.service';

@Injectable()
export class ClipboardService {

    constructor(private clipboard: Clipboard, private snackbar_service: SnackbarService) {
    }

    public copy(text: string, success: string): void {
        this.clipboard.copy(text);
        this.snackbar_service.successSnackbar(success);
    }
}
