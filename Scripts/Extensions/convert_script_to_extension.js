const fs = require('fs');
const util = require('util');

const user_script_file_name = 'my_hordes_optimizer.user.js'
const target_dir = '../../Extensions/';
const source_dir = '../Tampermonkey/';
const source_file = source_dir + user_script_file_name;
const icons_dir = '../../MyHordesOptimizerWebsite/src/assets/img/logo/';

fs.readFile(source_file, 'utf-8', (source_file_err, file_content) => {
    if (source_file_err) {
        console.error(`Une erreur s'est produite lors de la lecture du fichier ${user_script_file_name} : \n`, source_file_err)
    } else {
        const file = splitFile(file_content);
        const header = file.header;
        const content = file.content;
        const header_data = extractHeaderData(header);
        constructFirefoxManifest(header_data, content);
        constructChromeManifest(header_data, content);
        constructOperaManifest(header_data, content);
    }
});

function splitFile(file_content) {
    const split = file_content.split('\r\n');
    const start_header_index = split.findIndex((row) => row.indexOf('==UserScript==') > -1)
    const end_header_index = split.findIndex((row) => row.indexOf('==/UserScript==') > -1)

    return {
        header: split.slice(start_header_index, end_header_index + 1).join('\r\n'),
        content: split.slice(end_header_index, split.length).join('\r\n')
    };
}

function extractHeaderData(header) {
    let data = {};
    data.name = '' + header.match(/\/\/ @name *(.*)\r\n/gm)[0].replace(/\/\/ @name *(.*)\r\n/gm, '$1');
    data.short_name = '' + header.match(/\/\/ @name *(.*)\r\n/gm)[0].replace(/\/\/ @name *(.*)\r\n/gm, '$1').replace(/[^A-Z]*/gm, '');
    data.version = header.match(/\/\/ @version *(.*)\r\n/gm)[0].replace(/\/\/ @version *(.*)\r\n/gm, '$1');
    data.description = header.match(/\/\/ @description *(.*)\r\n/gm)[0].replace(/\/\/ @description *(.*)\r\n/gm, '$1');
    data.author = header.match(/\/\/ @author *(.*)\r\n/gm)[0].replace(/\/\/ @author *(.*)\r\n/gm, '$1');
    data.homepage_url = header.match(/\/\/ @homepageURL *(.*)\r\n/gm)[0].replace(/\/\/ @homepageURL *(.*)\r\n/gm, '$1');
    data.matches = header.match(/\/\/ @match *(.*)\r\n/gm).map((row) => row.replace(/\/\/ @match *(.*)\r\n/gm, '$1'));
    data.connects = header.match(/\/\/ @connect *(.*)\r\n/gm).map((row) => row.replace(/\/\/ @connect *(.*)\r\n/gm, '$1'));
    return data;
}

async function constructFirefoxManifest(header_data) {
    const name = 'Firefox';
    copySourceFile(name);
    copyLogos(name);
    let manifest = await generateManifestV2(header_data);
    manifest.permissions.push('webRequest');
    manifest.background.scripts = ['main.js'];
    writeManifest(manifest, name);
}

async function constructChromeManifest(header_data) {
    const name = 'Chrome';
    copySourceFile(name);
    copyLogos(name);
    let manifest = await generateManifestV3(header_data);
    manifest.background.service_worker = 'main.js';
    writeManifest(manifest, name);
}

async function constructOperaManifest(header_data) {
    const name = 'Opera';
    copySourceFile(name);
    copyLogos(name);
    let manifest = await generateManifestV3(header_data);
    manifest.background.service_worker = 'main.js';
    writeManifest(manifest, name);
}

function copySourceFile(url_part) {
    fs.copyFile(source_file, target_dir + url_part + '/' + user_script_file_name, (err) => {
        if (err) throw err;
    });
}

function copyLogos(url_part) {
    fs.readdir(icons_dir, (err_dir, files) => {
        if (err_dir) {
            console.error(`Une erreur s'est produite lors de la lecture de la liste des fichiers : \n`, err_dir)
        } else {
            files
                .filter((file) => file.indexOf('dev') < 0 && file.indexOf('outlined') > -1)
                .forEach((file) => {
                    fs.copyFile(icons_dir + file, target_dir + url_part + '/assets/img/logo/' + file, (err) => {
                        if (err) throw err;
                    });
                });
        }
    });
}

function writeManifest(manifest, url_part) {
    console.log(`${url_part} manifest`, manifest);
    fs.writeFile(target_dir + url_part + '/manifest.json', JSON.stringify(manifest), (write_file_err) => {
            if (write_file_err) {
                console.error(`Erreur lors de la génération du fichier "${url_part}/manifest.json" : \n`, write_file_err);
            } else {
                console.log(`Le fichier "${url_part}/manifest.json" a bien été généré`);
            }
        }
    );
}

async function readIcons() {
    let icons = {};

    const readdir = util.promisify(fs.readdir);
    var file_names = await readdir(icons_dir);
    file_names
        .filter((file) => file.indexOf('dev') < 0 && file.indexOf('outlined') > -1)
        .forEach((file) => {
            let size = +file.replace(/logo_mho_(\d*)x.*/g, '$1');
            icons[+size] = 'assets/img/logo/' + file;
        });

    return icons;
}

async function generateManifestV3(header_data) {
    return {
        manifest_version: 3,
        name: header_data.name,
        short_name: header_data.short_name,
        version: header_data.version,
        description: header_data.description,
        author: header_data.author,
        homepage_url: header_data.homepage_url,
        icons: await readIcons(),
        background: {},
        content_scripts: [{
            matches: header_data.matches,
            js: [user_script_file_name]
        }],
        permissions: [
            'storage',
            'clipboardWrite',
            'notifications'
        ],
        host_permissions: header_data.connects.filter((url) => url !== '*'),
        browser_specific_settings: {
            gecko: {
                id: "{14876417-17c6-417d-80bb-b18c5b40c366}"
            }
        }
    };
}


async function generateManifestV2(header_data) {
    return {
        manifest_version: 2,
        name: header_data.name,
        short_name: header_data.short_name,
        version: header_data.version,
        description: header_data.description,
        author: header_data.author,
        homepage_url: header_data.homepage_url,
        icons: await readIcons(),
        background: {},
        content_scripts: [{
            matches: header_data.matches,
            js: [user_script_file_name]
        }],
        permissions: [
            'storage',
            'clipboardWrite',
            'notifications',
            ...header_data.connects.filter((url) => url !== '*')
        ],
        browser_specific_settings: {
            gecko: {
                id: "{14876417-17c6-417d-80bb-b18c5b40c366}"
            }
        }
    };
}
