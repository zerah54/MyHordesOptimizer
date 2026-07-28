using FluentAssertions;
using Newtonsoft.Json;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Vérifie que chaque champ demandé à MyHordes arrive RÉELLEMENT dans le DTO.
    /// </summary>
    /// <remarks>
    /// Complément indispensable de <see cref="MhContractCoherenceTests"/> : celui-ci prouve qu'un
    /// champ demandé a une propriété portant le bon nom, celui-ci prouve que la propriété a la bonne
    /// FORME et reçoit la valeur. C'est la différence entre une liste typée en objet — qui passe la
    /// vérification de nom et casse à la désérialisation — et un contrat réellement respecté.
    /// </remarks>
    public class MhContractRoundTripTests
    {
        public static TheoryData<string> CallNames()
        {
            var data = new TheoryData<string>();
            foreach (var call in MhCallRegistry.All)
            {
                data.Add(call.Name);
            }
            return data;
        }

        [Theory]
        [MemberData(nameof(CallNames))]
        public void ChaqueChampDemandeArriveDansLeDto(string callName)
        {
            var call = MhCallRegistry.All.Single(candidate => candidate.Name == callName);
            var payload = MhPayloadFactory.Build(call);

            var graph = JsonConvert.DeserializeObject(payload.ToString(), call.DtoType);

            graph.Should().NotBeNull("la charge doit être désérialisable dans le DTO déclaré");

            var missing = MhGraphInspector.FindUnmaterialisedPaths(call, graph!);

            missing.Should().BeEmpty(
                "tout champ demandé à MyHordes doit atterrir dans une propriété du DTO");
        }
    }
}
