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

        // Extraits tels quels de Data/Heroes/capacities.json.
        private const string ExtraitCapacites = @"{
            ""manipulator"": {
                ""name"": ""manipulator"",
                ""title"": ""Tipp-Ex"",
                ""description"": ""Du kannst 2 Mal pro Partie einen Registereintrag unkenntlich machen. Dazu musst du nur auf das kleine Icon \""Fälschen\"" klicken. Dieses befindet sich links neben dem \""störenden\"" Registereintrag. ;-)"",
                ""icon"": ""small_falsify"",
                ""citizenProperties"": {
                    ""props.limit.log_manipulation"": 2
                },
                ""unlockAt"": 3,
                ""legacy"": true
            },
            ""super_strategist_2"": {
                ""sort"": 0,
                ""group"": ""Strategie"",
                ""title"": ""Strategie"",
                ""legacy"": false,
                ""icon"": ""super_s2"",
                ""name"": ""super_strategist_2"",
                ""bullets"": [
                    ""Profi-Wächter: Deine Überlebenschancen bei der Nachtwache reduzieren sich langsamer"",
                    ""Kamera aus Vorkriegstagen (3 Ladungen)"",
                    ""Unbegrenzt anonyme Foren-Posts verfassen"",
                    ""Eine zusätzliche Beschwerde pro Tag möglich""
                ],
                ""citizenProperties"": {
                    ""props.watch_defense"": 10,
                    ""features.blackboard"": true,
                    ""features.group_messages"": true,
                    ""features.building_recommendation"": true,
                    ""props.limit.anonymous.posts"": -1,
                    ""features.pro.watchman"": true,
                    ""props.limit.anonymous.complaint"": 5
                },
                ""level"": 2,
                ""unlockAt"": 40,
                ""grantsItems"": {
                    ""0"": ""water_#00"",
                    ""apag"": ""photo_3_#00""
                },
                ""itemTypesGrantedAsProfessionItems"": [
                    ""photo_2_#00"",
                    ""photo_3_#00""
                ]
            },
            ""super_recluse0"": {
                ""sort"": 4,
                ""group"": ""Ruhe"",
                ""title"": ""Ruhe"",
                ""legacy"": false,
                ""icon"": ""super_r0"",
                ""name"": ""super_recluse0"",
                ""bullets"": [
                    ""Rückkehr des Helden (9km)"",
                    ""Proficamper (auf 6 Campings begrenzt)"",
                    ""Manipulieren von Registereinträgen (max. 1)""
                ],
                ""unlocksActions"": [
                    ""hero_generic_return""
                ],
                ""citizenProperties"": {
                    ""features.pro.camper"": true,
                    ""props.limit.camping.pro"": 6,
                    ""props.limit.log_manipulation"": 1
                },
                ""level"": 0,
                ""unlockAt"": 0
            }
        }";

        [Fact]
        public void CompetenceHistorique_NaNiGroupeNiNiveauNiPuces()
        {
            var dico = JsonConvert.DeserializeObject<Dictionary<string, MyHordesHerosCapacitiesCodeModel>>(ExtraitCapacites);

            var capacite = dico!["manipulator"];

            capacite.Legacy.Should().BeTrue();
            capacite.Title.Should().Be("Tipp-Ex");
            capacite.Description.Should().Contain("\"Fälschen\"");
            capacite.UnlockAt.Should().Be(3);
            capacite.Group.Should().BeNull();
            capacite.Sort.Should().BeNull();
            capacite.Level.Should().BeNull();
            capacite.Bullets.Should().BeNull();
        }

        [Fact]
        public void CompetenceDeLArbre_LitGroupeOrdreNiveauEtPuces()
        {
            var dico = JsonConvert.DeserializeObject<Dictionary<string, MyHordesHerosCapacitiesCodeModel>>(ExtraitCapacites);

            var capacite = dico!["super_strategist_2"];

            capacite.Legacy.Should().BeFalse();
            capacite.Name.Should().Be("super_strategist_2");
            capacite.Icon.Should().Be("super_s2");
            capacite.Group.Should().Be("Strategie");
            capacite.Sort.Should().Be(0);
            capacite.Level.Should().Be(2);
            capacite.UnlockAt.Should().Be(40);
            capacite.Description.Should().BeNull();
            capacite.Bullets.Should().Equal(
                "Profi-Wächter: Deine Überlebenschancen bei der Nachtwache reduzieren sich langsamer",
                "Kamera aus Vorkriegstagen (3 Ladungen)",
                "Unbegrenzt anonyme Foren-Posts verfassen",
                "Eine zusätzliche Beschwerde pro Tag möglich");
        }

        [Fact]
        public void CompetenceDeLArbre_NiveauZeroEtGroupeNonNul()
        {
            // Niveau 0 et unlockAt 0 : lus comme 0, pas confondus avec une valeur absente.
            var dico = JsonConvert.DeserializeObject<Dictionary<string, MyHordesHerosCapacitiesCodeModel>>(ExtraitCapacites);

            var capacite = dico!["super_recluse0"];

            capacite.Group.Should().Be("Ruhe");
            capacite.Sort.Should().Be(4);
            capacite.Level.Should().Be(0);
            capacite.UnlockAt.Should().Be(0);
            capacite.Bullets.Should().HaveCount(3).And.Contain("Rückkehr des Helden (9km)");
        }
    }
}
