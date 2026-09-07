using System.Collections.Generic;
using MyHordesOptimizerApi.Models.CitizenState;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ICitizenStateSuggestionEngine
    {
        /// <summary>Ordre suggéré de consommation des objets du sac (par id), glouton sur un score de risque.</summary>
        List<int> SuggestOrder(CitizenState startingState, IReadOnlyList<int> bagItemIds);

        /// <summary>Un ordre "general" (composite) + un ordre par risque ("thirst", "wound") que le sac peut effectivement soulager. Clés stables, jamais des libellés affichables.</summary>
        List<SuggestedOrder> SuggestOrders(CitizenState startingState, IReadOnlyList<int> bagItemIds);
    }
}
