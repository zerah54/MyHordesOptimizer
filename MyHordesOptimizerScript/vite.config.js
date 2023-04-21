import {defineConfig, splitVendorChunkPlugin} from 'vite';
import monkey from 'vite-plugin-monkey';
import {dependencies} from './package.json';

function renderChunks(deps) {
  let chunks = {};
  Object.keys(deps).forEach((key) => {
    if ([].includes(key)) return;
    chunks[key] = [key];
  });
  return chunks;
}

export default defineConfig({
  plugins: [monkey({
    entry: 'src/main.ts',
    userscript: {
      name: 'MyHordes Optimizer Dev',
      description: 'Optimizer for MyHordes - Documentation & fonctionnalités : https://myhordes-optimizer.web.app/, rubrique Tutoriels',
      version: '1.0.0-beta.45',
      author: 'Zerah',
      namespace: 'myhordes-optimizer',

      icon: 'https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_16x16.png',
      icon64: 'https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_64x64.png',

      downloadURL: 'https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js',
      updateURL: 'https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js',
      homepageURL: 'https://myhordes-optimizer.web.app/tutorials/script/installation',
      supportURL: 'https://discord.gg/ZQH7ZPWcCm',

      match: [
        '*://myhordes.de/*',
        '*://myhordes.eu/*',
        '*://myhord.es/*',
        '*://myhordes.localhost/*',
        '*://staging.myhordes.de/*',
        'https://bbh.fred26.fr/*',
        'https://gest-hordes2.eragaming.fr/*',
        'https://fatamorgana.md26.eu/*'
      ]
    }
  }), // angular(),
    splitVendorChunkPlugin()], build: {
    sourcemap: false, rollupOptions: {
      output: {
        manualChunks: {
          vendor: [], ...renderChunks(dependencies),
        },
      },
    },
  },
})
