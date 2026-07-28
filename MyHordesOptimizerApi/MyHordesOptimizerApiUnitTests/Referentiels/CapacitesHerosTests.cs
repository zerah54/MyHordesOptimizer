using FluentAssertions;
using MyHordesOptimizerApi.Data.Heroes;
using Newtonsoft.Json;
using System.Collections.Generic;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// MyHordes a renommé « daysNeeded » en « unlockAt » et supprimé « action ».
    /// Sans ces tests, la régénération du référentiel remplirait DaysNeeded avec 0
    /// pour les 44 compétences, sans lever la moindre erreur.
    /// </summary>
    public class CapacitesHerosTests
    {
        [Fact]
        public void UnlockAt_EstLuDepuisLeJsonRegenere()
        {
            var json = @"{
                ""manipulator"": {
                    ""name"": ""manipulator"",
                    ""title"": ""Tipp-Ex"",
                    ""description"": ""Falsifier un registre"",
                    ""icon"": ""small_falsify"",
                    ""unlockAt"": 3,
                    ""legacy"": true
                }
            }";

            var dico = JsonConvert.DeserializeObject<Dictionary<string, MyHordesHerosCapacitiesCodeModel>>(json);

            dico.Should().ContainKey("manipulator");

            var capacite = dico!["manipulator"];

            capacite.UnlockAt.Should().Be(3);
            capacite.Legacy.Should().BeTrue();
            capacite.Name.Should().Be("manipulator");
            capacite.Title.Should().Be("Tipp-Ex");
            capacite.Icon.Should().Be("small_falsify");
        }

        [Fact]
        public void DaysNeeded_NExistePlusSurLeModele()
        {
            typeof(MyHordesHerosCapacitiesCodeModel)
                .GetProperty("DaysNeeded")
                .Should().BeNull("le champ amont a ete renomme unlockAt");
        }

        [Fact]
        public void Action_NExistePlusSurLeModele()
        {
            typeof(MyHordesHerosCapacitiesCodeModel)
                .GetProperty("Action")
                .Should().BeNull("le champ a disparu du referentiel amont");
        }

        [Fact]
        public void UnChampAmontInconnuNEmpechePasLaDeserialisation()
        {
            // Le référentiel régénéré porte quatorze champs de plus que le modèle n'en lit
            // (citizenProperties, chestSpace, grantsItems…). Newtonsoft doit les ignorer.
            var json = @"{
                ""manipulator"": {
                    ""name"": ""manipulator"",
                    ""unlockAt"": 3,
                    ""citizenProperties"": { ""props.limit.log_manipulation"": 2 },
                    ""grantsItems"": [ ""chest_hero_#00"" ],
                    ""chestSpace"": 1
                }
            }";

            var dico = JsonConvert.DeserializeObject<Dictionary<string, MyHordesHerosCapacitiesCodeModel>>(json);

            dico.Should().ContainKey("manipulator");
            dico!["manipulator"].UnlockAt.Should().Be(3);
        }
    }
}
