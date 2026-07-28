using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordes.Contract;
using Newtonsoft.Json;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    public class DtoFieldsValidatorTests
    {
        private sealed class FakeLeaf
        {
            [JsonProperty("uid")]
            public string? Uid { get; set; }
        }

        private sealed class FakeRoot
        {
            [JsonProperty("id")]
            public int? Id { get; set; }

            [JsonProperty("children")]
            public List<FakeLeaf>? Children { get; set; }

            [JsonProperty("byKey")]
            public IDictionary<string, FakeLeaf>? ByKey { get; set; }

            [JsonProperty("legacyField")]
            public string? LegacyField;

            [MhBare]
            [JsonProperty("rewards")]
            public IDictionary<string, FakeLeaf>? Rewards { get; set; }

            [MhUnavailableOn(MhEndpoints.Towns)]
            [JsonProperty("sp")]
            public int? Sp { get; set; }
        }

        private static MhCall Call(string fields, string endpoint = MhEndpoints.Map)
            => new("test", endpoint, typeof(FakeRoot), fields);

        [Fact]
        public void Validate_TousLesChampsExistent_AucuneViolation()
        {
            DtoFieldsValidator.Validate(Call("id,children.fields(uid)")).Should().BeEmpty();
        }

        [Fact]
        public void Validate_TraverseLesDictionnaires()
        {
            DtoFieldsValidator.Validate(Call("byKey.fields(uid)")).Should().BeEmpty();
        }

        [Fact]
        public void Validate_ResoutAussiLesChampsPublics()
        {
            DtoFieldsValidator.Validate(Call("legacyField")).Should().BeEmpty();
        }

        [Fact]
        public void Validate_ChampInconnu_RemonteLeCheminComplet()
        {
            var violations = DtoFieldsValidator.Validate(Call("id,children.fields(nope)"));

            violations.Should().ContainSingle()
                .Which.Should().Contain("children.nope");
        }

        [Fact]
        public void Validate_ChampMhBareAvecSousChamps_EstUneViolation()
        {
            var violations = DtoFieldsValidator.Validate(Call("rewards.fields(uid)"));

            violations.Should().ContainSingle()
                .Which.Should().Contain("rewards").And.Contain("nu");
        }

        [Fact]
        public void Validate_ChampMhBareDemandeNu_EstConforme()
        {
            DtoFieldsValidator.Validate(Call("rewards")).Should().BeEmpty();
        }

        [Fact]
        public void Validate_ChampIndisponibleSurCetEndpoint_EstUneViolation()
        {
            var violations = DtoFieldsValidator.Validate(Call("sp", MhEndpoints.Towns));

            violations.Should().ContainSingle()
                .Which.Should().Contain("sp").And.Contain(MhEndpoints.Towns);
        }

        [Fact]
        public void Validate_ChampIndisponibleAilleurs_EstConforme()
        {
            DtoFieldsValidator.Validate(Call("sp", MhEndpoints.Map)).Should().BeEmpty();
        }

        [Fact]
        public void UnrequestedProperties_ListeCeQuiNEstPasDemande()
        {
            var unrequested = DtoFieldsValidator.UnrequestedProperties(Call("id"));

            unrequested.Should().Contain("children").And.Contain("sp");
            unrequested.Should().NotContain("id");
        }

        [Fact]
        public void UnrequestedProperties_NeDescendPasSousUnChampDemandeNu()
        {
            // Demandé nu, MyHordes renvoie son jeu de champs par défaut : on ne peut pas affirmer
            // que les sous-propriétés sont absentes.
            var unrequested = DtoFieldsValidator.UnrequestedProperties(Call("children"));

            unrequested.Should().NotContain("children");
            unrequested.Should().NotContain("children.uid");
        }

        [Fact]
        public void UnrequestedProperties_SArreteAuPremierNiveauNonDemande()
        {
            // `children` n'est pas demandé : le signaler suffit, inutile de lister ses descendants.
            var unrequested = DtoFieldsValidator.UnrequestedProperties(Call("id"));

            unrequested.Should().Contain("children");
            unrequested.Should().NotContain("children.uid");
        }

        [Fact]
        public void UnrequestedProperties_DescendSousUnChampDemandeAvecSousChamps()
        {
            // Ici les sous-champs sont explicites : ce qui n'y figure pas est bien non demandé.
            var unrequested = DtoFieldsValidator.UnrequestedProperties(Call("byKey.fields(uid)"));

            unrequested.Should().NotContain("byKey.uid");
            unrequested.Should().Contain("children");
        }
    }
}
