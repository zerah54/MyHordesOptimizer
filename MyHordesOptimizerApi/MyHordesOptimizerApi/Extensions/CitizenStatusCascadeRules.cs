using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Extensions
{
    /// <summary>
    /// Cascades de statuts portées à la main depuis CitizenHandler::inflictStatus/removeStatus/
    /// healWound/setAP/increaseThirstLevel — voir section 6 du spec
    /// (docs/superpowers/specs/2026-08-14-simulateur-pa-etats-om-design.md).
    /// </summary>
    public static class CitizenStatusCascadeRules
    {
        private static readonly string[] WoundFamily =
            { "tg_meta_wound", "wound1", "wound2", "wound3", "wound4", "wound5", "wound6" };

        // Source: CitizenHandler::isWounded (CitizenHandler.php:82-84) — dérivé des statuts, jamais un flag indépendant.
        public static bool IsWounded(HashSet<string> statuses) => WoundFamily.Any(statuses.Contains);

        // Source: CitizenHandler::inflictStatus (CitizenHandler.php:113-167)
        public static void Inflict(HashSet<string> statuses, string status)
        {
            if (status == "thirst1" || status == "thirst2") statuses.Remove("hydrated");
            if (status == "drunk" || status == "hungover") statuses.Remove("sober");
            if (status is "drugged" or "addict") statuses.Remove("clean");
            statuses.Add(status);
        }

        // Source: CitizenHandler::removeStatus + healWound (CitizenHandler.php:169-183, 101-105)
        public static void Remove(HashSet<string> statuses, string status)
        {
            if (Array.IndexOf(WoundFamily, status) >= 0)
            {
                foreach (var w in WoundFamily) statuses.Remove(w);
                return;
            }
            statuses.Remove(status);
        }

        // Source: CitizenHandler::setAP, bascule tired (CitizenHandler.php:458)
        public static void SyncTired(HashSet<string> statuses, int ap)
        {
            if (ap == 0) statuses.Add("tired");
            else statuses.Remove("tired");
        }

        // Source: CitizenHandler::increaseThirstLevel (CitizenHandler.php:185-200)
        // Retourne true si la mort par déshydratation est déclenchée.
        public static bool IncreaseThirstLevel(HashSet<string> statuses)
        {
            if (statuses.Contains("thirst2")) return true;

            if (statuses.Contains("thirst1"))
            {
                statuses.Remove("thirst1");
                Inflict(statuses, "thirst2");
            }
            else Inflict(statuses, "thirst1");

            return false;
        }
    }
}
