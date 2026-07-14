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

            if (map.Days > 0)
            {
                town.Day = map.Days;
            }
            if (map.Wid > 0)
            {
                town.Width = map.Wid;
            }
            if (map.Hei > 0)
            {
                town.Height = map.Hei;
            }
            if (map.Season > 0)
            {
                town.Season = map.Season;
            }

            var phase = MapTownPhase(map.Phase);
            if (phase != null)
            {
                town.PhaseId = (int)phase;
            }

            var city = map.City;
            if (city != null)
            {
                town.IsChaos = city.Chaos;
                town.IsDevasted = city.Devast;
                town.IsDoorOpen = city.Door;
                town.WaterWell = city.Water;
                town.X = city.X;
                town.Y = city.Y;
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
