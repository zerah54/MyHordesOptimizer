// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { xliff12ToJs } from 'xliff';

export async function xliffToJson(translations: unknown): Promise<Record<string, string>> {
    // eslint-disable-next-line @typescript-eslint/typedef
    const parserResult = await xliff12ToJs(translations, {
        captureSpacesBetweenElements: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xliffContent: Record<string, any> = parserResult.resources['ng2.template'];

    return Object.keys(xliffContent).reduce((result: Record<string, string>, current: string) => {
        const translation: string | unknown[] = xliffContent[current].target;
        if (typeof translation === 'string') {
            result[current] = translation;
        } else if (Array.isArray(translation)) {
            result[current] = translation
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((entry: any) =>
                    typeof entry === 'string' ? entry : `{{${entry.Standalone.id}}}`,
                )
                .map((entry: string) => entry.replace('{{', '{$').replace('}}', '}'))
                .join('');
        } else {
            throw new Error('Could not parse XLIFF: ' + JSON.stringify(translation));
        }
        return result;
    }, {});
}
