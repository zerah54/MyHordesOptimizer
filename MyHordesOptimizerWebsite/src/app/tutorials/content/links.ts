/** Adresses reprises par plusieurs tutoriels. */
export const SCRIPT_DOWNLOAD_URL: string = 'https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js';
/** Sans langue dans le chemin : le site des modules de Firefox affiche celle du navigateur. */
export const FIREFOX_EXTENSION_URL: string = 'https://addons.mozilla.org/firefox/addon/mho-addon';
export const CHROME_EXTENSION_URL: string = 'https://chromewebstore.google.com/detail/myhordes-optimizer/jolghobcgphmgaiachbipnpiimmgknno';
export const DISCORD_SERVER_URL: string = 'https://discord.gg/ZQH7ZPWcCm';
export const DISCORD_BOT_INSTALL_URL: string = 'https://discord.com/oauth2/authorize?client_id=1140035117746765914';

/** Lien externe, ouvert dans un nouvel onglet. */
export function externalLink(url: string, label: string): string {
    return `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
}
