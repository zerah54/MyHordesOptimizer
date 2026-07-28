using FluentAssertions;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    public class SurllParserTests
    {
        [Fact]
        public void Parse_ListeSimple_RenvoieUnChampParNom()
        {
            var result = SurllParser.Parse("id,name,count");

            result.Select(f => f.Name).Should().Equal("id", "name", "count");
            result.Should().OnlyContain(f => f.Fields.Count == 0);
        }

        [Fact]
        public void Parse_ChampImbrique_RattacheLesSousChamps()
        {
            var result = SurllParser.Parse("id,job.fields(uid,name)");

            result.Select(f => f.Name).Should().Equal("id", "job");
            result[1].Fields.Select(f => f.Name).Should().Equal("uid", "name");
        }

        [Fact]
        public void Parse_ImbricationSurDeuxNiveaux_ConserveLaHierarchie()
        {
            var result = SurllParser.Parse("map.fields(city.fields(name,water),days)");

            result.Should().HaveCount(1);
            var map = result[0];
            map.Name.Should().Be("map");
            map.Fields.Select(f => f.Name).Should().Equal("city", "days");
            map.Fields[0].Fields.Select(f => f.Name).Should().Equal("name", "water");
        }

        [Fact]
        public void Parse_ChampSuiviDUnFrereApresParenthese_NePerdPasLeFrere()
        {
            var result = SurllParser.Parse("job.fields(uid),dead,out");

            result.Select(f => f.Name).Should().Equal("job", "dead", "out");
            result[0].Fields.Select(f => f.Name).Should().Equal("uid");
        }

        [Fact]
        public void Parse_NomAvecTiret_EstUnSeulJeton()
        {
            var result = SurllParser.Parse("estimationsNext,regen-dir");

            result.Select(f => f.Name).Should().Equal("estimationsNext", "regen-dir");
        }

        [Fact]
        public void Parse_ChaineVide_RenvoieUneListeVide()
        {
            SurllParser.Parse("").Should().BeEmpty();
        }

        [Fact]
        public void Parse_ParentheseNonFermee_NeBouclePasEtRenvoieCeQuiEstLu()
        {
            var result = SurllParser.Parse("map.fields(days");

            result.Should().HaveCount(1);
            result[0].Fields.Select(f => f.Name).Should().Equal("days");
        }
    }
}
