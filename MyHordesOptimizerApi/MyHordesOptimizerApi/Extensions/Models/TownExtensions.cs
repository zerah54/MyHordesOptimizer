using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Extensions.Models
{
    /// <summary>
    /// Point unique de mise à jour des champs de Town depuis MyHordes.
    /// Le même MyHordesMap est renvoyé par /json/me (fetcher, maj outils externes)
    /// et par /json/map (import) : toute évolution des champs de la ville se fait ici,
    /// plus jamais dans un des flux individuellement.
    /// </summary>
    public static class TownExtensions
    {
        public static void UpdateFromMapDetails(this Town town, MyHordesMap map)
        {
            if (map == null)
            {
                return;
            }

            // Toutes les écritures sont gardées : un champ que MyHordes n'a pas transmis ne doit
            // jamais écraser ce qui est déjà connu en base. Les chaînes `fields=` diffèrent d'une
            // source à l'autre (/json/me et /json/map ne demandent pas la même chose) et ne font
            // pas partie du contrat.
            // Constat sur l'option d'API externe. `ApiDisabled` arrive À LA PLACE des données :
            // toutes les écritures ci-dessous seront donc sans effet, c'est cohérent.
            var apiExterne = DeduireApiExterne(map);
            if (apiExterne.HasValue)
            {
                town.HasExternalApi = apiExterne;
            }

            if (map.Days > 0)
            {
                town.Day = map.Days.Value;
            }
            if (map.Wid > 0)
            {
                town.Width = map.Wid.Value;
            }
            if (map.Hei > 0)
            {
                town.Height = map.Hei.Value;
            }
            if (map.Season > 0)
            {
                town.Season = map.Season;
            }
            if (!string.IsNullOrEmpty(map.Language))
            {
                // La langue de la VILLE, désormais préférée au `locale` du joueur qui synchronise :
                // celui-ci n'en était qu'une approximation (« ≈ la langue de sa ville »), fausse dès
                // qu'un joueur d'une autre langue s'y trouve. Le repli sur le locale subsiste là où
                // la charge ne porte pas `language`.
                town.Language = map.Language;
            }

            var phase = MapTownPhase(map.Phase);
            if (phase != null)
            {
                town.PhaseId = (int)phase;
            }

            var city = map.City;
            if (city != null)
            {
                if (city.Chaos.HasValue)
                {
                    town.IsChaos = city.Chaos.Value;
                }
                if (city.Devast.HasValue)
                {
                    town.IsDevasted = city.Devast.Value;
                }
                if (city.Door.HasValue)
                {
                    town.IsDoorOpen = city.Door.Value;
                }
                if (city.Water.HasValue)
                {
                    town.WaterWell = city.Water.Value;
                }
                if (city.X.HasValue)
                {
                    town.X = city.X.Value;
                }
                if (city.Y.HasValue)
                {
                    town.Y = city.Y.Value;
                }
                if (!string.IsNullOrEmpty(city.Name))
                {
                    town.Name = city.Name;
                }
                var type = MapTownType(city.Type);
                if (type != null)
                {
                    town.TownTypeId = (int)type;
                }
            }
        }

        public static TownType? MapTownType(string? type)
        {
            if (string.IsNullOrWhiteSpace(type))
            {
                return null;
            }
            return type.ToLowerInvariant() switch
            {
                "small" => TownType.RNE,
                "remote" => TownType.RE,
                "panda" => TownType.PANDE,
                "custom" => TownType.CUSTOM,
                _ => null
            };
        }

        /// <summary>
        /// Met à jour les trois rôles de ville — Chaman, Guide de l'Outre-Monde, Responsable de la
        /// catapulte — depuis une charge de carte.
        /// </summary>
        /// <remarks>
        /// <para>
        /// SÉPARÉE de <see cref="UpdateFromMapDetails"/>, et c'est délibéré : cette méthode-là
        /// garde chacune de ses écritures, parce qu'un champ absent y signifie « non transmis ».
        /// Ici c'est l'inverse. MyHordes n'émet le rôle que si son dernier porteur est VIVANT
        /// (<c>if ($latest &amp;&amp; $latest-&gt;getAlive())</c>) : son absence veut dire « plus
        /// personne », et doit donc effacer la valeur connue. Les deux sémantiques ne peuvent pas
        /// cohabiter dans la même boucle d'écriture.
        /// </para>
        /// <para>
        /// CONSÉQUENCE : à n'appeler QUE depuis une source dont la chaîne <c>fields=</c> demande
        /// les trois rôles, aujourd'hui le seul <c>/json/me</c>. <c>/json/map</c> ne les demande
        /// pas : l'y brancher effacerait les trois colonnes à chaque import de ville.
        /// </para>
        /// </remarks>
        public static void UpdateRolesFromMapDetails(this Town town, MyHordesMap map)
        {
            if (map == null)
            {
                return;
            }
            town.IdShaman = map.Shaman;
            town.IdGuide = map.Guide;
            town.IdCata = map.Cata;
        }

        /// <summary>
        /// Ce que la réponse de carte apprend sur l'option d'API externe de la ville :
        /// <c>true</c> si les données sont là, <c>false</c> si le jeu a répondu <c>ApiDisabled</c>,
        /// <c>null</c> si elle n'apprend rien.
        /// </summary>
        /// <remarks>
        /// Règle unique, partagée entre l'écriture en base et le DTO envoyé au site : les deux
        /// doivent dire la même chose. <c>UnknownMap</c> tombe volontairement dans le <c>null</c> —
        /// il signale un identifiant inconnu, pas une ville muette, et n'autorise donc aucune
        /// conclusion sur l'option.
        /// </remarks>
        public static bool? DeduireApiExterne(MyHordesMap? map)
        {
            if (map == null)
            {
                return null;
            }
            if (string.IsNullOrEmpty(map.Error))
            {
                return true;
            }
            return map.Error == "ApiDisabled" ? false : null;
        }

        public static TownPhase? MapTownPhase(string? phase)
        {
            if (string.IsNullOrWhiteSpace(phase))
            {
                return null;
            }
            return phase.ToLowerInvariant() switch
            {
                "alpha" => TownPhase.ALPHA,
                "beta" => TownPhase.BETA,
                "import" => TownPhase.IMPORT,
                "native" => TownPhase.NATIVE,
                _ => null
            };
        }
    }
}
