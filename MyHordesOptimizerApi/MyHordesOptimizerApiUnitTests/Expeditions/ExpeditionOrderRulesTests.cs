using FluentAssertions;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Expeditions;

namespace MyHordesOptimizerApiUnitTests.Expeditions
{
    public class ExpeditionOrderRulesTests
    {
        private const int Width = 25;
        private const int Height = 25;

        // System.Action : MyHordesOptimizerApi.Models a aussi un type Action.
        private static System.Action Validate(ExpeditionOrder order)
        {
            return () => ExpeditionOrderRules.Validate(order, Width, Height);
        }

        [Fact]
        public void TexteLibre_SansCase_Accepte()
        {
            Validate(new ExpeditionOrder { Text = "Rester groupés" }).Should().NotThrow();
        }

        [Fact]
        public void TexteLibre_SurUneCase_Accepte()
        {
            Validate(new ExpeditionOrder { Text = "Couvrir le groupe", X = 3, Y = 24 }).Should().NotThrow();
        }

        [Theory]
        [InlineData(3, null)]
        [InlineData(null, 3)]
        public void CaseIncomplete_Refuse(int? x, int? y)
        {
            Validate(new ExpeditionOrder { X = x, Y = y }).Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(-1, 0)]
        [InlineData(0, -1)]
        [InlineData(Width, 0)]
        [InlineData(0, Height)]
        public void CaseHorsDeLaCarte_Refuse(int x, int y)
        {
            Validate(new ExpeditionOrder { X = x, Y = y }).Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(ExpeditionOrderKinds.Pick)]
        [InlineData(ExpeditionOrderKinds.Drop)]
        public void RamasserDeposer_ObjetEtQuantite_Accepte(string kind)
        {
            Validate(new ExpeditionOrder { Kind = kind, X = 1, Y = 1, IdItem = 12, Quantity = 2 }).Should().NotThrow();
        }

        [Theory]
        [InlineData(ExpeditionOrderKinds.Pick, null, 2)]
        [InlineData(ExpeditionOrderKinds.Pick, 12, null)]
        [InlineData(ExpeditionOrderKinds.Drop, 12, 0)]
        [InlineData(ExpeditionOrderKinds.Drop, 12, ExpeditionOrderRules.MaxQuantity + 1)]
        public void RamasserDeposer_ParametreManquantOuHorsBornes_Refuse(string kind, int? itemId, int? quantity)
        {
            Validate(new ExpeditionOrder { Kind = kind, IdItem = itemId, Quantity = quantity }).Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Consommer_ObjetSeul_Accepte_AvecQuantite_Refuse()
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Use, IdItem = 4 }).Should().NotThrow();
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Use, IdItem = 4, Quantity = 1 }).Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Deblayer_NombreDeTas_Accepte_SansNombre_Refuse()
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Clear, Quantity = 3 }).Should().NotThrow();
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Clear }).Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(ExpeditionOrderKinds.Explore)]
        [InlineData(ExpeditionOrderKinds.Camp)]
        [InlineData(ExpeditionOrderKinds.Excavate)]
        public void ExplorerCamperExcaver_SansParametre_Accepte_AvecParametre_Refuse(string kind)
        {
            Validate(new ExpeditionOrder { Kind = kind, X = 2, Y = 2 }).Should().NotThrow();
            Validate(new ExpeditionOrder { Kind = kind, X = 2, Y = 2, IdItem = 1 }).Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData("hero_generic_rescue")]
        [InlineData("secondwind")]
        public void ActionHeroique_Connue_Accepte(string heroSkill)
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Hero, HeroSkill = heroSkill }).Should().NotThrow();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("apag")]
        public void ActionHeroique_AbsenteOuInconnue_Refuse(string? heroSkill)
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Hero, HeroSkill = heroSkill }).Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Attendre_LeGroupeOuUnCitoyen_Accepte()
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Wait }).Should().NotThrow();
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Wait, IdTargetUser = 42 }).Should().NotThrow();
        }

        [Fact]
        public void Attendre_UneAutreExpedition_Accepte()
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Wait, IdTargetExpedition = 7 }).Should().NotThrow();
        }

        [Fact]
        public void Attendre_UnCitoyenEtUneExpedition_Refuse()
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Wait, IdTargetUser = 42, IdTargetExpedition = 7 }).Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void TexteLibre_AvecParametreDeConsigneTypee_Refuse()
        {
            Validate(new ExpeditionOrder { Text = "x", IdTargetUser = 42 }).Should().Throw<MhoTechnicalException>();
            Validate(new ExpeditionOrder { Text = "x", IdTargetExpedition = 7 }).Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Explorer_AvecExpeditionAAttendre_Refuse()
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Explore, IdTargetExpedition = 7 }).Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void ConsigneTypee_AvecNote_Accepte()
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Explore, Note = "attendre que X l'ait explorée" }).Should().NotThrow();
        }

        [Fact]
        public void TexteLibre_AvecNote_Refuse()
        {
            Validate(new ExpeditionOrder { Text = "x", Note = "y" }).Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Note_TropLongue_Refuse()
        {
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Camp, Note = new string('a', ExpeditionOrderRules.MaxNoteLength) }).Should().NotThrow();
            Validate(new ExpeditionOrder { Kind = ExpeditionOrderKinds.Camp, Note = new string('a', ExpeditionOrderRules.MaxNoteLength + 1) }).Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void TypeInconnu_Refuse()
        {
            Validate(new ExpeditionOrder { Kind = "dig" }).Should().Throw<MhoTechnicalException>();
        }
    }
}
