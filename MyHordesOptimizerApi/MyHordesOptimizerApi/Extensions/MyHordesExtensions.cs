using System.Collections.Generic;
using System.Text.RegularExpressions;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Extensions
{
    public static class MyHordesExtensions
    {
        /// <summary>
        /// Retire l'empreinte de build que MyHordes insère dans le nom de ses images
        /// (« pictos/r_santac.fc5dfc02.gif » → « pictos/r_santac.gif »).
        /// Indispensable avant de stocker un chemin d'image : les fichiers servis par le site sont
        /// ceux du dépôt local (public/img/hordes_img/), qui ne portent pas cette empreinte — et
        /// celle-ci change à chaque déploiement de leur côté.
        /// Un nom déjà dépourvu d'empreinte est renvoyé tel quel.
        /// </summary>
        public static string RemoveImageFingerprint(string img)
        {
            return string.IsNullOrEmpty(img) ? img : Regex.Replace(img, @"(.*)\.(.*)\.(.*)", "$1.$3");
        }

        /// <summary>
        /// Défense apportée par chaque niveau de maison, telle que définie par les fixtures du jeu
        /// (<c>CitizenHomeLevelDataService</c>). Relevé le 2026-07-28 : la suite est exactement n².
        /// </summary>
        private static readonly IReadOnlyDictionary<int, int> NiveauParDefense = new Dictionary<int, int>
        {
            [0] = 0, [1] = 1, [4] = 2, [9] = 3, [16] = 4, [25] = 5, [36] = 6, [49] = 7, [64] = 8
        };

        /// <summary>
        /// Déduit le niveau de la maison d'un citoyen de la défense qu'elle apporte
        /// (<c>baseDef</c>), ou <c>null</c> si la valeur est absente ou inconnue.
        /// </summary>
        /// <remarks>
        /// <para>
        /// <c>baseDef</c> vaut <c>getHome()-&gt;getPrototype()-&gt;getDefense()</c> : la défense du
        /// PROTOTYPE, donc fonction du seul niveau, sans les améliorations. La correspondance est
        /// bijective, et MyHordes la sert pour TOUS les citoyens d'une ville — le niveau n'a donc
        /// jamais eu à être saisi à la main.
        /// </para>
        /// <para>
        /// Une table explicite plutôt qu'une racine carrée : si le jeu ajoute un niveau 9 à 81, la
        /// table le signale en renvoyant null là où <c>Math.Sqrt</c> l'avalerait en silence. Une
        /// défense inconnue vaut « je ne sais pas », jamais un niveau inventé.
        /// </para>
        /// </remarks>
        public static int? NiveauDeMaisonDepuisDefense(int? defense)
        {
            if (!defense.HasValue)
            {
                return null;
            }
            return NiveauParDefense.TryGetValue(defense.Value, out var niveau) ? niveau : null;
        }

        /// <summary>
        /// Réduit un message ICU de MyHordes à sa forme par défaut, celle de la branche
        /// <c>other</c> — la seule utilisable sans contexte de genre.
        /// </summary>
        /// <remarks>
        /// <para>
        /// Les entrées genrées des fichiers de traduction du jeu ne sont pas des chaînes mais des
        /// messages ICU :
        /// <c>{ref__icu, select, on {{ref__gender, select, female {Lacérée…} other {Lacéré…}}} other {Lacéré(e)…}}</c>.
        /// Les recopier verbatim met le message lui-même en base, et le site l'affiche tel quel.
        /// </para>
        /// <para>
        /// MHO ne dispose d'aucune donnée de genre : on retient donc la branche <c>other</c> de
        /// PREMIER niveau, celle que le jeu affiche hors contexte genré (« Lacéré(e)… »), et non
        /// celle imbriquée dans <c>ref__gender</c> (« Lacéré… », forme masculine).
        /// </para>
        /// <para>
        /// Une chaîne qui n'est pas un message ICU est renvoyée telle quelle : la très grande
        /// majorité des libellés sont dans ce cas.
        /// </para>
        /// </remarks>
        public static string ResolveIcuDefaultForm(string message)
        {
            if (string.IsNullOrWhiteSpace(message))
            {
                return message;
            }
            var trimmed = message.Trim();
            if (trimmed.Length == 0 || trimmed[0] != '{' || !trimmed.Contains("select"))
            {
                return message;
            }

            // Profondeur 1 = l'intérieur de l'accolade ouvrante du message. C'est à ce niveau que
            // vit la branche `other` par défaut ; celles rencontrées plus profond appartiennent à
            // un `select` imbriqué (le genre) et ne doivent pas être retenues.
            var depth = 0;
            for (var i = 0; i < trimmed.Length; i++)
            {
                var c = trimmed[i];
                if (c == '{')
                {
                    depth++;
                    continue;
                }
                if (c == '}')
                {
                    depth--;
                    continue;
                }
                if (depth != 1 || c != 'o' || !EstMotOther(trimmed, i))
                {
                    continue;
                }
                var ouverture = trimmed.IndexOf('{', i);
                if (ouverture < 0)
                {
                    break;
                }
                var contenu = ExtraireBlocEquilibre(trimmed, ouverture);
                if (contenu == null)
                {
                    break;
                }
                // Le contenu peut être lui-même un message ICU (imbrication inverse) : on redescend.
                return ResolveIcuDefaultForm(contenu).Trim();
            }
            return message;
        }

        /// <summary>Vrai si le mot « other » commence à <paramref name="index"/> et forme un mot entier.</summary>
        private static bool EstMotOther(string texte, int index)
        {
            const string mot = "other";
            if (index + mot.Length > texte.Length || string.CompareOrdinal(texte, index, mot, 0, mot.Length) != 0)
            {
                return false;
            }
            if (index > 0 && char.IsLetterOrDigit(texte[index - 1]))
            {
                return false;
            }
            var suivant = index + mot.Length;
            return suivant >= texte.Length || !char.IsLetterOrDigit(texte[suivant]);
        }

        /// <summary>
        /// Renvoie le contenu de l'accolade ouverte à <paramref name="ouverture"/>, accolades
        /// internes comprises, ou null si elle n'est jamais refermée.
        /// </summary>
        private static string ExtraireBlocEquilibre(string texte, int ouverture)
        {
            var depth = 0;
            for (var i = ouverture; i < texte.Length; i++)
            {
                if (texte[i] == '{')
                {
                    depth++;
                }
                else if (texte[i] == '}')
                {
                    depth--;
                    if (depth == 0)
                    {
                        return texte.Substring(ouverture + 1, i - ouverture - 1);
                    }
                }
            }
            return null;
        }

        public static TownType GetTownType(this MyHordesMap map)
        {
            if (map.City.Hard == true)
            {
                return TownType.PANDE;
            }
            else if (map.Wid >= 25)
            {
                return TownType.RE;
            }
            else
            {
                return TownType.RNE;
            }
        }
    }
}
