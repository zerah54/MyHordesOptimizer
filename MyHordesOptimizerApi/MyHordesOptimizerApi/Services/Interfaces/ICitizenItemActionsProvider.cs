using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ICitizenItemActionsProvider
    {
        /// <summary>Codes d'action (clés de actions.json) portés par un item, vide si l'item est inconnu.</summary>
        IReadOnlyList<string> GetActionNames(int itemId);
    }
}
