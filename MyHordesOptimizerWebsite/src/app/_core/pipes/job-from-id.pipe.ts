import { Pipe, PipeTransform } from '@angular/core';

import { JobEnum } from '../../_abstract_model/enum/job.enum';


@Pipe({
    name: 'jobFromId'
})
export class JobFromIdPipe implements PipeTransform {
    public transform(job_id?: string): JobEnum | undefined {
        if (!job_id) return undefined;
        return JobEnum.getByKey(job_id);
    }
}
