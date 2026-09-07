using System;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApiUnitTests.Http.Fakes
{
    /// <summary>Fake entièrement contrôlé par le test : jamais de dépendance à une vraie BDD ou à un service métier.</summary>
    public class FakeETagVersionService : IETagVersionService
    {
        public Func<ETagResource, int?, int, string?> Compute { get; set; } = (_, _, _) => null;

        public string? GetVersion(ETagResource resource, int? id, int currentUserId) => Compute(resource, id, currentUserId);
    }
}
