using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;

namespace MyHordesOptimizerApiIntegrationTests.Fakes
{
    /// <summary>Remplace ZenHordes dans les tests : le vrai service limite à 100 requêtes par quart d'heure et ne doit jamais être sollicité.</summary>
    public sealed class FakeZenHordesRepository : IZenHordesRepository
    {
        public List<ZenHordesUpdateRequestDto> Calls { get; } = new();
        public Exception? ToThrow { get; set; }

        public Task UpdateAsync(ZenHordesUpdateRequestDto updateRequest)
        {
            Calls.Add(updateRequest);
            return ToThrow == null ? Task.CompletedTask : Task.FromException(ToThrow);
        }
    }
}
