import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import {readFileSync} from 'fs';
import * as sass from "sass";

const banner = readFileSync('./src/header.txt', 'utf-8').trim();

function cssAsRawString() {
    return {
        name: 'css-as-raw-string',
        transform(code, id) {
            if (!id.endsWith('.scss')) {
                return null;
            }
            return {
                code: `export default ${JSON.stringify(sass.compile(id).css)};`,
                map: { mappings: '' }
            };
        }
    };
}

export default {
    input: 'src/main.ts',
    output: {
        file: '../Scripts/Tampermonkey/my_hordes_optimizer.user.js',
        format: 'iife',
        // Le bandeau ==UserScript== n'est PAS passé via `output.banner` : terser (ci-dessous)
        // le supprimerait avec les autres commentaires. Il est injecté par le `preamble` de
        // terser, qui n'est pas soumis au stripping. Voir le plugin de minification.
        // No outer variable name needed for a userscript IIFE
        generatedCode: {constBindings: true},
    },
    // Disabled: the original script contains functions that are never
    // called (e.g. addWarning, filterItems, saveParameters) or only
    // called from commented-out lines (e.g. blockUsersPosts,
    // createDisplayMapButton). Tree-shaking would silently strip these
    // from the bundle even though they're intentionally kept in the
    // source for future use / reference. Disabling it guarantees the
    // bundle is a 1:1 content match with the original, dead code included.
    treeshake: false,
    plugins: [
        cssAsRawString(),
        typescript({tsconfig: './tsconfig.json'}),
        // Minification. `format.comments: false` retire tous les commentaires ; le bandeau
        // ==UserScript== est réinjecté via `preamble`, non soumis à ce retrait, et doit donc
        // rester en tête (sans lui le script ne s'installe pas). `keep_fnames` préserve les
        // noms de fonctions, dont `runSafely` se sert (`init.name`) pour dire quelle
        // initialisation a échoué.
        terser({
            format: {comments: false, preamble: banner},
            keep_fnames: true,
        }),
    ],
    onwarn(warning, warn) {
        // Suppress circular-dependency warnings inherent in a monolithic-script
        // migration (all modules share the same runtime state object).
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        // Suppress "use of eval" if any dynamic eval patterns remain in the
        // original code.
        if (warning.code === 'EVAL') return;
        warn(warning);
    },
};
