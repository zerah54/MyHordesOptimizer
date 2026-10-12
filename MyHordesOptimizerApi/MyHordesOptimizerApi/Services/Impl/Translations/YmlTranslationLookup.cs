using MyHordesOptimizerApi.Models.Translation;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Translations
{
    public static class YmlTranslationLookup
    {
        /// <summary>
        /// Cherche la traduction brute d'une clé allemande dans les fichiers d'une langue, pour un domaine donné.
        /// </summary>
        /// <param name="domaine">
        /// Préfixe du fichier (<c>items</c> pour <c>items+intl-icu.fr.yml</c>). Une même clé existe souvent
        /// dans plusieurs domaines avec des sens différents : le domaine est celui que le jeu utilise pour afficher la donnée.
        /// </param>
        /// <returns>La valeur brute (ICU non résolu), ou null si aucun fichier du domaine ne contient la clé.</returns>
        public static string? Find(Dictionary<string, List<YmlTranslationFileModel>> translations, string langue, string cleAllemande, string domaine)
        {
            if (!translations.TryGetValue(langue, out var fichiers))
            {
                return null;
            }
            return fichiers
                .Where(fichier => Path.GetFileName(fichier.Name).StartsWith(domaine + "+"))
                .FirstOrDefault(fichier => fichier.Translations.ContainsKey(cleAllemande))
                ?.Translations[cleAllemande];
        }
    }
}
