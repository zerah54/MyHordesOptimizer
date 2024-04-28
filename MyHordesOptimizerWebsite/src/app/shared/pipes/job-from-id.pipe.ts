import { Pipe, PipeTransform } from '@angular/core';
import { JobEnum } from '../../_abstract_model/enum/job.enum';


@Pipe({
    name: 'jobFromId',
    standalone: true,
})
export class JobFromIdPipe implements PipeTransform {
    transform(job_id?: string): JobEnum | undefined {
        if (!job_id) return undefined;
        return JobEnum.getByKey(job_id);
    }
}
