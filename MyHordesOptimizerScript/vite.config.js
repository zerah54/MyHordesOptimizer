import angular from '@vitejs/plugin-angular';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    angular(),
    monkey({
      name: 'MyHordes Optimizer',
      description: 'Optimizer for MyHordes - Documentation & fonctionnalités : https://myhordes-optimizer.web.app/, rubrique Tutoriels',
      version: '1.0.0-beta.40',
      author: 'Zerah',

      icon: 'https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_16x16.png',
      icon64: 'https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_64x64.png',

      // @downloadURL  https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
      // @updateURL    https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
      homepageURL: 'https://myhordes-optimizer.web.app/tutorials/script/installation',
      supportURL: 'lenoune38@gmail.com',

      match: '*://myhordes.de/*',
      // match: '*://myhordes.eu/*',
      // match: '*://myhord.es/*',
      // match: '*://myhordes.localhost/*',
      // match: '*://staging.myhordes.de/*',
      // match: 'https://bbh.fred26.fr/*',
      // match: 'https://gest-hordes2.eragaming.fr/*',
      // match: 'https://fatamorgana.md26.eu/*'
    })
  ],
  // autres configurations de Vite

});
