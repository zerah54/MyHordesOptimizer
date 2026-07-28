using FluentAssertions;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    public class MhContractCoherenceTests
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
        public void ChaqueChampDemandeExisteDansLeDto(string callName)
        {
            var call = MhCallRegistry.All.Single(candidate => candidate.Name == callName);

            var violations = DtoFieldsValidator.Validate(call);

            violations.Should().BeEmpty(
                "les champs demandés à MyHordes doivent tous avoir une propriété pour les recevoir");
        }

        [Fact]
        public void RapportDeCouverture()
        {
            foreach (var call in MhCallRegistry.All)
            {
                var unrequested = DtoFieldsValidator.UnrequestedProperties(call);
                Console.WriteLine($"### {call.Name} ({call.Endpoint}) — " +
                                  $"{unrequested.Count} propriété(s) non demandée(s)");
                foreach (var path in unrequested)
                {
                    Console.WriteLine($"  - {path}");
                }
            }
        }
    }
}
