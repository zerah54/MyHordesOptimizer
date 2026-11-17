import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { ForumLine, ForumPostInput, ForumWatcher } from './nightwatch-forum-post.util';
import { CostSummary, StockLine } from './nightwatch-stock.util';
import { NightwatchWatcherRow } from './nightwatch.store';
import { NightwatchCitizenStateDTO, NightwatchItemUsage, NightwatchPlanContentDTO, NightwatchReferentialDTO, NightwatchWatcherDTO } from './nightwatch.types';

/** Icône de métier des citoyens dont le métier est inconnu. */
const DEFAULT_JOB_ICON: string = ':basic:';

/** Données du store nécessaires au message forum. */
export interface ForumInputSources {
    draft: NightwatchPlanContentDTO;
    rows: ReadonlyArray<NightwatchWatcherRow>;
    citizens: ReadonlyArray<NightwatchCitizenStateDTO>;
    stock_lines: ReadonlyArray<StockLine>;
    referential: NightwatchReferentialDTO | null;
    total_defense: number;
    cost: CostSummary;
    itemLabel: (item_id: number) => string;
    statusLabel: (key: string) => string;
}

/**
 * Lignes du bilan dont l'objet a l'usage donné.
 * @param {ForumInputSources} sources Données du store.
 * @param {NightwatchItemUsage} usage Usage dans le référentiel.
 * @returns {ForumLine[]} Lignes `libellé / besoin`.
 */
function linesOfUsage(sources: ForumInputSources, usage: NightwatchItemUsage): ForumLine[] {
    return sources.stock_lines
        .filter((line: StockLine): boolean => sources.referential?.items[line.item_id]?.usage === usage)
        .map((line: StockLine): ForumLine => ({ label: sources.itemLabel(line.item_id), qty: line.need }));
}

/**
 * Veilleur tel que rédigé dans le message.
 * @param {NightwatchWatcherDTO} watcher Veilleur du brouillon.
 * @param {ForumInputSources} sources Données du store.
 * @returns {ForumWatcher} Veilleur du message.
 */
function forumWatcher(watcher: NightwatchWatcherDTO, sources: ForumInputSources): ForumWatcher {
    const citizen: NightwatchCitizenStateDTO | undefined = sources.citizens.find((candidate: NightwatchCitizenStateDTO): boolean => candidate.userId === watcher.userId);
    const row: NightwatchWatcherRow | undefined = sources.rows.find((candidate: NightwatchWatcherRow): boolean => candidate.user_id === watcher.userId);
    const job: JobEnum | undefined = citizen?.jobUid === null || citizen?.jobUid === undefined ? undefined : JobEnum.getByKey<JobEnum>(citizen.jobUid);
    return {
        name: citizen?.name ?? row?.name ?? '?',
        job_icon: job === undefined ? DEFAULT_JOB_ICON : `:${job.value.forum_icon}:`,
        status_labels: watcher.statuses.filter((key: string): boolean => key !== 'notGhoul').map((key: string): string => sources.statusLabel(key)),
        defense: row?.defense ?? 0,
        items: Object.entries(watcher.items)
            .filter(([, quantity]: [string, number]): boolean => quantity > 0)
            .map(([item_id, quantity]: [string, number]): ForumLine => ({ label: sources.itemLabel(Number(item_id)), qty: quantity })),
        discourse: watcher.hasDiscourse,
        note: watcher.note ?? null
    };
}

/**
 * Données du message forum d'une proposition de veille.
 * @param {ForumInputSources} sources Données du store.
 * @returns {ForumPostInput} Entrée de `buildForumPost`.
 */
export function buildForumInput(sources: ForumInputSources): ForumPostInput {
    return {
        instructions: sources.draft.instructions ?? null,
        watchers: sources.draft.watchers.map((watcher: NightwatchWatcherDTO): ForumWatcher => forumWatcher(watcher, sources)),
        total_defense: sources.total_defense,
        cost: sources.cost,
        reparable_lines: linesOfUsage(sources, 'repair'),
        rechargeable_lines: linesOfUsage(sources, 'recharge')
    };
}
