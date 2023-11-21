import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { ArrayItemDetailsPipe } from './array-item-details.pipe';
import { CitizensFromShortPipe } from './citizens-from-short.pipe';
import { ColumnIdPipe } from './column-id.pipe';
import { DebugLogPipe } from './debug-log.pipe';
import { FilterRuinsByKmPipe } from './filter-ruins-by-km.pipe';
import { ItemDetailsPipe } from './item-details.pipe';
import { ItemsGroupByCategory } from './items-group-by-category.pipe';
import { CustomKeyValuePipe } from './key-value.pipe';

const pipes: Components = [
    ArrayItemDetailsPipe, CitizensFromShortPipe, ItemDetailsPipe, FilterRuinsByKmPipe, CustomKeyValuePipe, ItemsGroupByCategory, DebugLogPipe, ColumnIdPipe
];

@NgModule({
    imports: [...pipes],
    exports: [
        ...pipes
    ],
    providers: [
        ...pipes
    ]
})

export class PipesModule {
}
