using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers;
using MyHordesOptimizerApi.Services.Interfaces;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.PreTowns
{
    /// <summary>Ordre d'exécution des mergers et invalidation de la liste de courses, partagés par la liaison et la duplication.</summary>
    public static class PreTownMergers
    {
        /// <summary>Mergers triés par <see cref="IPreTownMerger.Order"/> (tri stable), indépendamment de l'ordre d'enregistrement DI.</summary>
        public static IReadOnlyList<IPreTownMerger> Sorted(IEnumerable<IPreTownMerger> mergers) => mergers.OrderBy(m => m.Order).ToList();

        public static bool IsWishList(IPreTownMerger merger) => merger is WishListGroupMerger or WishListItemMerger;

        /// <summary>Contenu à copier vers <paramref name="toIdTown"/> : les citoyens simulés ne sortent pas des pré-villes.</summary>
        public static string? ContentFor(string? content, int toIdTown, string arrayName) =>
            PreTownIds.IsPreTownIdTown(toIdTown) ? content : StripSimulatedCitizens(content, arrayName);

        /// <summary>Retire de <paramref name="arrayName"/> (sans casse) les entrées de citoyens simulés (UserId &lt; 0) ; contenu intact si rien à retirer ou illisible.</summary>
        public static string? StripSimulatedCitizens(string? content, string arrayName)
        {
            if (content is null)
            {
                return null;
            }
            JObject json;
            try
            {
                json = JObject.Parse(content);
            }
            catch (JsonReaderException)
            {
                return content;
            }
            if (json.GetValue(arrayName, StringComparison.OrdinalIgnoreCase) is not JArray entries)
            {
                return content;
            }
            var simulated = entries.OfType<JObject>()
                .Where(e => e.GetValue("userId", StringComparison.OrdinalIgnoreCase) is JValue { Type: JTokenType.Integer } id && id.Value<long>() < 0)
                .ToList();
            if (simulated.Count == 0)
            {
                return content;
            }
            simulated.ForEach(e => e.Remove());
            return json.ToString(Formatting.None);
        }

        /// <summary>
        /// Les mergers de liste de courses écrivent sans passer par WishListService : on pose updater et date sur la ville
        /// cible pour que la lecture n'échoue pas (updater null) et que les clients ne restent pas en 304 (ETag).
        /// </summary>
        public static async Task TouchWishListAsync(MhoContext db, int idTown, int idUser)
        {
            var now = DateTime.UtcNow;
            await db.Towns.Where(t => t.IdTown == idTown)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.WishlistDateUpdate, (DateTime?)now).SetProperty(t => t.IdUserWishListUpdater, (int?)idUser));
        }
    }
}
