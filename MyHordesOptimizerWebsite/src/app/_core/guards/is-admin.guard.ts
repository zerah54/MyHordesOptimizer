import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AdminService } from '../../_abstract_model/services/admin.service';

export const isAdminGuard: CanActivateFn = () => {
    const router: Router = inject(Router);
    const adminService: AdminService = inject(AdminService);

    return adminService.checkIsAdmin().pipe(
        map((is_admin: boolean) => {
            if (!is_admin) router.navigate(['/wiki/items']);
            return is_admin;
        })
    );
};
