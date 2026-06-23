import typescript from '@rollup/plugin-typescript';
import {readFileSync} from 'fs';

const banner = readFileSync('./src/header.txt', 'utf-8').trim();

export default {
    input: 'src/main.ts',
    output: {
        file: '../Scripts/Tampermonkey/my_hordes_optimizer.user.js',
        format: 'iife',
        banner,
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
        typescript({tsconfig: './tsconfig.json'}),
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
