import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable()
export class SnackbarService {

    constructor(private snackbar: MatSnackBar) {

    }

    public successSnackbar(message: string): void {
        this.snackbar.open(message, '', {
            panelClass: 'snackbar-success',
            duration: 5000
        });
    }

    public errorSnackbar(message: string): void {
        this.snackbar.open(message, '', {
            panelClass: 'snackbar-error',
            duration: 5000
        });
    }

    public warningSnackbar(message: string): void {
        this.snackbar.open(message, '', {
            panelClass: 'snackbar-warning',
            duration: 5000
        });
    }

    public informationSnackbar(message: string): void {
        this.snackbar.open(message, '', {
            panelClass: 'snackbar-information',
            duration: 5000
        });
    }

}
