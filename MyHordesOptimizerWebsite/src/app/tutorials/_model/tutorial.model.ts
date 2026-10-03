import { AccordionItem } from '../../_shared/accordion/accordion.component';

/**
 * Groupe de rubriques d'un tutoriel : un intertitre facultatif, un texte avant et après, et les
 * rubriques dépliables. Les textes sont du HTML simple (paragraphes, listes, liens, gras, italique),
 * affiché par `[innerHTML]` et converti au format du forum de MyHordes pour le partage.
 */
export interface TutorialSection {
    title?: string;
    intro?: string;
    items: AccordionItem[];
    outro?: string;
}

/** Page de tutoriel : titre, introduction facultative et groupes de rubriques. */
export interface TutorialPage {
    title: string;
    lead?: string;
    sections: TutorialSection[];
}

/** Clé de la page dans les données de route (`Route.data`). */
export const TUTORIAL_ROUTE_DATA_KEY: string = 'tutorial';
