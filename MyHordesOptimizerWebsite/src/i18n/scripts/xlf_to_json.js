const fs = require('fs');
const xliff = require('xliff');

const source_dir = 'src/assets/i18n/xlf-files/';
const target_dir = 'src/assets/i18n/';

fs.readdir(source_dir, function (err_dir, files) {
    if (err_dir) {
        console.error(`Une erreur s'est produite lors de la lecture de la liste des fichiers : \n`, err_dir)
    } else {
        files.forEach((file, index) => {
            readFile(file, files.length, index);
        })
    }
})

function readFile(source_file_name, nb_files, file_index) {
    let language = source_file_name.split('.')[1];
    const target_file_name = language + '.json';
    fs.readFile(source_dir + source_file_name, 'utf-8', function (source_file_err, file_content) {
        if (source_file_err) {
            console.error(`Une erreur s'est produite lors de la lecture du fichier de traduction "${source_file_name}" : \n`, source_file_err)
        } else {
            parseTranslationsForLocalize(file_content, target_file_name, nb_files, file_index);
        }
    });
}

function parseTranslationsForLocalize(translations, target_file_name, nb_files, file_index) {
    xliff.xliff12ToJs(translations).then((result) => {
        const xliff_content = result.resources['ng2.template'];
        const final = Object.keys(xliff_content).reduce((result, current) => {
            try {
                if (typeof xliff_content[current].target === 'string') {
                    result[current] = xliff_content[current].target;
                } else if (!Array.isArray(xliff_content[current].target)) {
                    result[current] = '{$' + xliff_content[current].target.Standalone['id'] + '}';
                } else {
                    result[current] = xliff_content[current].target
                        .map((entry) => {
                            return typeof entry === 'string' ? entry : '{$' + entry.Standalone['id'] + '}';
                        })
                        .map((entry) => {
                            if (entry.indexOf('\r\n') > -1) {
                                entry = entry.replace('\r\n', '')
                            }
                            if (entry.indexOf('\r') > -1) {
                                entry = entry.replace('\r', '')
                            }
                            if (entry.indexOf('\n') > -1) {
                                entry = entry.replace('\n', '')
                            }

                            entry = entry
                                .replace('{{', '{$')
                                .replace('}}', '}');

                            return entry;
                        })
                        .join('');
                }

                result[current] = result[current]
                    .replace(/(  +)/gm, ' ')
                    .replace(/(^ )/gm, '');
            } catch (e) {
                console.error(e)
                console.error('xliff_content[current] : \n', xliff_content[current]);
            }

            return result;
        }, {});

        fs.writeFile(target_dir + target_file_name, JSON.stringify(final), function (write_file_err) {
                if (write_file_err) {
                    console.error(`Erreur lors de la génération du fichier "${target_file_name}" : \n`, write_file_err)
                } else {
                    console.log(`Le fichier "${target_file_name}" a bien été généré (${file_index + 1}/${nb_files})`)
                }
            }
        );
    });
}
