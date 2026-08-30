using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class CitizenItemActionsProvider : ICitizenItemActionsProvider
    {
        protected MhoContext DbContext { get; init; }

        public CitizenItemActionsProvider(MhoContext dbContext)
        {
            DbContext = dbContext;
        }

        public IReadOnlyList<string> GetActionNames(int itemId)
        {
            return DbContext.Items
                .Where(item => item.IdItem == itemId)
                .SelectMany(item => item.ActionNames.Select(action => action.Name))
                .ToList();
        }
    }
}
