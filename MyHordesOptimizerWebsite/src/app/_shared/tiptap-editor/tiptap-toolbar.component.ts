import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, InputSignal, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_FORM_FIELD } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { Editor } from '@tiptap/core';
import { Level } from '@tiptap/extension-heading';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { ApiService } from '../../_abstract_model/services/api.service';
import { Item } from '../../_abstract_model/types/item.class';
import { normalizeString } from '../../_core/utilities/string.utils';
import { FilterFieldComponent } from '../filter-field/filter-field.component';
import { DEFAULT_ICONS, Emote, EMOTES, UNICODE_EMOJIS, UnicodeEmoji, UnicodeEmojiGroup } from './tiptap-emote-data';

/** Tailles de police proposees dans la barre d'outils, en pixels. */
const FONT_SIZES: readonly number[] = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];

/** Tailles reelles (em) des titres H1-H6, alignees sur le rendu par defaut du navigateur (aucune surcharge CSS sur .ProseMirror). */
const HEADING_PREVIEW_EM: Readonly<Record<Level, number>> = { 1: 2, 2: 1.5, 3: 1.17, 4: 1, 5: .83, 6: .67 };

@Component({
    selector: 'mho-tiptap-toolbar',
    templateUrl: './tiptap-toolbar.component.html',
    styleUrls: ['./tiptap-toolbar.component.scss'],
    imports: [MatIconModule, MatMenuModule, MatSelectModule, MatTabsModule, FilterFieldComponent],
    // Sans ce viewProviders, mat-select remonte l'injecteur jusqu'au mat-form-field ANCETRE
    // (celui qui heberge mho-tiptap-editor) et dimensionne son overlay sur cette largeur-la.
    viewProviders: [{ provide: MAT_FORM_FIELD, useValue: null }],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiptapToolbarComponent implements OnInit {
    public editor: InputSignal<Editor> = input.required();

    protected readonly fontSizes: readonly number[] = FONT_SIZES;
    protected readonly headingLevels: readonly Level[] = [1, 2, 3, 4, 5, 6];
    protected readonly emotes: readonly Emote[] = EMOTES;
    protected readonly defaultIcons: readonly Emote[] = DEFAULT_ICONS;
    protected readonly unicodeEmojiGroups: readonly UnicodeEmojiGroup[] = UNICODE_EMOJIS;
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();

    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    private items: Item[] = [];
    protected readonly filteredItems: WritableSignal<Item[]> = signal([]);

    public ngOnInit(): void {
        this.api.getItems()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((items: Item[]): void => {
                this.items = items;
                this.filteredItems.set(items);
            });
    }

    protected onItemFilterChange(filter_value: string): void {
        if (!filter_value) {
            this.filteredItems.set(this.items);
            return;
        }
        this.filteredItems.set(this.items.filter((item: Item): boolean =>
            normalizeString(item.label[this.locale]).indexOf(normalizeString(filter_value)) > -1));
    }

    protected insertItem(item: Item, src: string): void {
        const label: string = item.label[this.locale];
        this.editor().chain().focus().setImage({ src, alt: label, title: label }).run();
    }

    protected toggleBold(): void {
        this.editor().chain().focus().toggleBold().run();
    }

    protected toggleItalic(): void {
        this.editor().chain().focus().toggleItalic().run();
    }

    protected toggleUnderline(): void {
        this.editor().chain().focus().toggleUnderline().run();
    }

    protected toggleStrike(): void {
        this.editor().chain().focus().toggleStrike().run();
    }

    protected toggleBulletList(): void {
        this.editor().chain().focus().toggleBulletList().run();
    }

    protected toggleOrderedList(): void {
        this.editor().chain().focus().toggleOrderedList().run();
    }

    protected setAlign(align: 'left' | 'center' | 'right' | 'justify'): void {
        this.editor().chain().focus().setTextAlign(align).run();
    }

    protected onHeadingChange(level: '0' | Level): void {
        if (level === '0') {
            this.editor().chain().focus().setParagraph().run();
        } else {
            this.editor().chain().focus().toggleHeading({ level }).run();
        }
    }

    protected headingPreviewEm(level: Level): number {
        return HEADING_PREVIEW_EM[level];
    }

    protected setLink(): void {
        const href: string | null = window.prompt('URL du lien');
        if (href) {
            this.editor().chain().focus().extendMarkRange('link').setLink({ href }).run();
        }
    }

    protected onFontSizeChange(size: '' | number): void {
        if (size) {
            this.editor().chain().focus().setFontSize(`${size}px`).run();
        } else {
            this.editor().chain().focus().unsetFontSize().run();
        }
    }

    protected toggleCodeBlock(): void {
        this.editor().chain().focus().toggleCodeBlock().run();
    }

    protected toggleBlockquote(): void {
        this.editor().chain().focus().toggleBlockquote().run();
    }

    protected insertEmote(emote: Emote): void {
        this.editor().chain().focus().setImage({ src: emote.src, alt: emote.tag, title: emote.tag }).run();
    }

    protected insertUnicodeEmoji(emoji: UnicodeEmoji): void {
        this.editor().chain().focus().insertContent(emoji.char).run();
    }

    protected onHighlightColorChange(event: Event): void {
        const color: string = (event.target as HTMLInputElement).value;
        this.editor().chain().focus().setHighlight({ color }).run();
    }

    protected onTextColorChange(event: Event): void {
        const color: string = (event.target as HTMLInputElement).value;
        this.editor().chain().focus().setColor(color).run();
    }

    protected clearFormat(): void {
        this.editor().chain().focus().unsetAllMarks().clearNodes().run();
    }

    protected toggleTaskList(): void {
        this.editor().chain().focus().toggleTaskList().run();
    }

    protected insertHorizontalRule(): void {
        this.editor().chain().focus().setHorizontalRule().run();
    }

    protected insertTable(): void {
        this.editor().chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
}
