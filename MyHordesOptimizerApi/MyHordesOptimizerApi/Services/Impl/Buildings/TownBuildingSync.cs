using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Buildings
{
    /// <summary>Synchronise l'état des chantiers et la défense d'une ville (l'appelant fait le <c>SaveChanges</c>).</summary>
    public static class TownBuildingSync
    {
        /// <summary>Une liste absente de la réponse (<c>fields=</c> n'est pas un contrat) laisse ses lignes intactes ; seule une liste présente peut en retirer.</summary>
        public static void Replace(MhoContext db, int idTown, int idLastUpdateInfo, MyHordesCity? city, ILogger logger)
        {
            if (city is null)
            {
                return;
            }
            var buildingKeys = db.Buildings.Select(building => new { building.MhId, building.IdBuilding }).ToList()
                .Select(row => (row.MhId, Id: row.IdBuilding));
            var itemKeys = db.Items.Select(item => new { item.MhId, item.IdItem }).ToList()
                .Select(row => (row.MhId, Id: row.IdItem));
            var idBuildingByMhId = TownBuildingMapper.BuildLookup(buildingKeys,
                key => logger.LogWarning("Clé de chantier {Key} ambiguë dans le référentiel, la première est conservée.", key));
            var idItemByMhId = TownBuildingMapper.BuildLookup(itemKeys,
                key => logger.LogWarning("Clé d'objet {Key} ambiguë dans le référentiel, la première est conservée.", key));

            var rows = TownBuildingMapper.Map(city, idBuildingByMhId, idItemByMhId,
                mhId => logger.LogWarning("Chantier MyHordes {MhId} inconnu du référentiel, ignoré.", mhId));

            var existing = db.TownBuildings.Where(row => row.IdTown == idTown).ToDictionary(row => row.IdBuilding);
            var seen = new HashSet<int>();
            foreach (var row in rows)
            {
                if (!seen.Add(row.IdBuilding))
                {
                    continue;
                }
                row.IdLastUpdateInfo = idLastUpdateInfo;
                if (existing.TryGetValue(row.IdBuilding, out var current))
                {
                    current.IsBuilt = row.IsBuilt;
                    current.PaCurrent = row.PaCurrent;
                    current.ApRemaining = row.ApRemaining;
                    current.Life = row.Life;
                    current.MaxLife = row.MaxLife;
                    current.Def = row.Def;
                    current.Level = row.Level;
                    current.Difficulty = row.Difficulty;
                    current.ResourcesCurrent = row.ResourcesCurrent;
                    current.IdLastUpdateInfo = idLastUpdateInfo;
                }
                else
                {
                    row.IdTown = idTown;
                    db.TownBuildings.Add(row);
                }
            }
            db.TownBuildings.RemoveRange(existing.Values.Where(row =>
                !seen.Contains(row.IdBuilding) && (row.IsBuilt ? city.Buildings is not null : city.Chantiers is not null)));
        }

        /// <summary>Une ligne par ville ; sans <c>city.defense</c> dans la réponse, la ligne existante est laissée telle quelle.</summary>
        public static void ReplaceDefense(MhoContext db, int idTown, int idLastUpdateInfo, MyHordesDefense? defense)
        {
            if (defense is null)
            {
                return;
            }
            var row = db.TownDefenses.SingleOrDefault(existing => existing.IdTown == idTown);
            if (row is null)
            {
                row = new TownDefense { IdTown = idTown };
                db.TownDefenses.Add(row);
            }
            row.Total = defense.Total;
            row.Base = defense.Base;
            row.Buildings = defense.Buildings;
            row.Upgrades = defense.Upgrades;
            row.Items = defense.Items;
            row.ItemsMul = defense.ItemsMul;
            row.CitizenHomes = defense.CitizenHomes;
            row.CitizenGuardians = defense.CitizenGuardians;
            row.Watchmen = defense.Watchmen;
            row.Souls = defense.Souls;
            row.Temp = defense.Temp;
            row.Cadavers = defense.Cadavers;
            row.Bonus = defense.Bonus;
            row.IdLastUpdateInfo = idLastUpdateInfo;
        }
    }
}
