import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express, { Express, NextFunction, Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
    const server: Express = express();
    const distFolder: string = join(process.cwd(), 'dist/MyHordesOptimizerWebsite/browser');
    const indexHtml: string = existsSync(join(distFolder, 'index.original.html'))
        ? join(distFolder, 'index.original.html')
        : join(distFolder, 'index.html');

    const commonEngine: CommonEngine = new CommonEngine();

    server.set('view engine', 'html');
    server.set('views', distFolder);


    // Example Express Rest API endpoints
    // server.get('/api/**', (req, res) => { });
    // Serve static files from /browser
    server.get('*.*', express.static(distFolder, {
        maxAge: '1y'
    }));
    // All regular routes use the Angular engine
    server.get('*', (req: Request, res: Response, next: NextFunction) => {
        const { protocol, originalUrl, baseUrl, headers } = req;

        commonEngine
            .render({
                bootstrap,
                documentFilePath: indexHtml,
                url: `${protocol}://${headers.host}${originalUrl}`,
                publicPath: distFolder,
                providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
            })
            .then((html: string) => res.send(html))
            .catch((err) => next(err));
    });

    return server;
}

function run(): void {
    const port: string | number = process.env['PORT'] || 4000;

    // Start up the Node server
    const server: Express = app();
    server.listen(port, () => {
        console.log(`Node Express server listening on http://localhost:${port}`);
    });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule: NodeJS.Module | undefined = __non_webpack_require__.main;
const moduleFilename: string = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
    run();
}

export default bootstrap;
