using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions.Models;
using MyHordesOptimizerApi.MappingProfiles;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    /// <summary>
    /// Arbre de compétences héros (Wiki > Pouvoirs) : import du référentiel (capacities.json -> HeroSkill) et
    /// contrat JSON de GET Fetcher/heroSkills (HeroSkill -> HeroSkillDto).
    /// </summary>
    public class HeroSkillMappingTests
    {
        private static readonly string[] Langues = { "fr", "en", "es", "de" };

        private static IMapper NewMapper()
        {
            var config = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<CodeModelMappingProfiles>();
                cfg.AddProfile<HeroSkillMappingProfiles>();
            }, NullLoggerFactory.Instance);
            return config.CreateMapper();
        }

        private static HeroSkill CompetenceDeLArbre()
        {
            return new HeroSkill
            {
                Name = "super_strategist_2",
                DaysNeeded = 40,
                Icon = "super_s2",
                LabelFr = "Stratégie", LabelEn = "Strategy", LabelEs = "Estrategia", LabelDe = "Strategie",
                Legacy = false,
                GroupSort = 0,
                Level = 2,
                GroupFr = "Stratégie", GroupEn = "Strategy", GroupEs = "Estrategia", GroupDe = "Strategie",
                BulletsFr = HeroSkillBullets.Serialize(new[] { "Veilleur pro", "Appareil photo (3 charges)" }),
                BulletsEn = HeroSkillBullets.Serialize(new[] { "Pro watchman", "Camera (3 charges)" }),
                BulletsEs = HeroSkillBullets.Serialize(new[] { "Vigilante pro", "Cámara (3 cargas)" }),
                BulletsDe = HeroSkillBullets.Serialize(new[] { "Profi-Wächter", "Kamera aus Vorkriegstagen (3 Ladungen)" })
            };
        }

        private static HeroSkill CompetenceHistorique()
        {
            return new HeroSkill
            {
                Name = "manipulator",
                DaysNeeded = 3,
                Icon = "small_falsify",
                LabelFr = "Tipp-Ex", LabelEn = "Tipp-Ex", LabelEs = "Tipp-Ex", LabelDe = "Tipp-Ex",
                DescriptionFr = "Falsifier", DescriptionEn = "Falsify", DescriptionEs = "Falsificar", DescriptionDe = "Fälschen",
                NbUses = 2,
                Legacy = true
            };
        }

        [Fact]
        public void Import_CompetenceDeLArbre_ReporteGroupeOrdreNiveauEtPucesAllemandes()
        {
            var code = new MyHordesHerosCapacitiesCodeModel
            {
                Name = "super_strategist_2",
                Title = "Strategie",
                Icon = "super_s2",
                UnlockAt = 40,
                Legacy = false,
                Group = "Strategie",
                Sort = 0,
                Level = 2,
                Bullets = new List<string> { "Profi-Wächter: Deine Überlebenschancen", "Kamera aus Vorkriegstagen (3 Ladungen)" }
            };

            var skill = NewMapper().Map<HeroSkill>(code);

            skill.Legacy.Should().BeFalse();
            skill.GroupDe.Should().Be("Strategie");
            skill.GroupSort.Should().Be(0);
            skill.Level.Should().Be(2);
            skill.DaysNeeded.Should().Be(40);
            HeroSkillBullets.Deserialize(skill.BulletsDe).Should().Equal(code.Bullets);
            // Traduits par l'import, pas par le profil.
            skill.GroupFr.Should().BeNull();
            skill.BulletsFr.Should().BeNull();
        }

        [Fact]
        public void Import_CompetenceHistorique_NaNiGroupeNiPuces()
        {
            var code = new MyHordesHerosCapacitiesCodeModel
            {
                Name = "manipulator",
                Title = "Tipp-Ex",
                Description = "Fälschen",
                Icon = "small_falsify",
                UnlockAt = 3,
                Legacy = true
            };

            var skill = NewMapper().Map<HeroSkill>(code);

            skill.Legacy.Should().BeTrue();
            skill.GroupDe.Should().BeNull();
            skill.GroupSort.Should().BeNull();
            skill.Level.Should().BeNull();
            skill.BulletsDe.Should().BeNull();
        }

        [Fact]
        public void Dto_CompetenceDeLArbre_ExposeGroupeEtPucesTraduits()
        {
            var dto = NewMapper().Map<HeroSkillDto>(CompetenceDeLArbre());

            dto.Legacy.Should().BeFalse();
            dto.DaysNeeded.Should().Be(40);
            dto.GroupSort.Should().Be(0);
            dto.Level.Should().Be(2);
            dto.Group.Should().NotBeNull();
            dto.Group.Should().Equal(new Dictionary<string, string>
            {
                { "fr", "Stratégie" }, { "en", "Strategy" }, { "es", "Estrategia" }, { "de", "Strategie" }
            });
            dto.Bullets.Keys.Should().BeEquivalentTo(Langues);
            dto.Bullets["fr"].Should().Equal("Veilleur pro", "Appareil photo (3 charges)");
            dto.Bullets["es"].Should().Equal("Vigilante pro", "Cámara (3 cargas)");
            dto.Bullets["de"].Should().Equal("Profi-Wächter", "Kamera aus Vorkriegstagen (3 Ladungen)");
        }

        [Fact]
        public void Dto_CompetenceHistorique_GroupeNulEtListesDePucesVides()
        {
            var dto = NewMapper().Map<HeroSkillDto>(CompetenceHistorique());

            dto.Legacy.Should().BeTrue();
            dto.Group.Should().BeNull();
            dto.GroupSort.Should().BeNull();
            dto.Level.Should().BeNull();
            dto.Bullets.Keys.Should().BeEquivalentTo(Langues);
            dto.Bullets.Values.Should().AllSatisfy(puces => puces.Should().NotBeNull().And.BeEmpty());
            // Champs existants inchangés.
            dto.Name.Should().Be("manipulator");
            dto.DaysNeeded.Should().Be(3);
            dto.NbUses.Should().Be(2);
            dto.Label["de"].Should().Be("Tipp-Ex");
            dto.Description["fr"].Should().Be("Falsifier");
        }

        [Fact]
        public void Dto_LigneNonReimportee_LegacyFauxEtHorsArbre()
        {
            // Colonnes ajoutées par 2026_09_24_heroskill_tree.sql, nulles jusqu'au prochain import.
            var skill = CompetenceHistorique();
            skill.Legacy = null;

            var dto = NewMapper().Map<HeroSkillDto>(skill);

            dto.Legacy.Should().BeFalse();
            dto.Group.Should().BeNull();
            dto.Bullets.Values.Should().AllSatisfy(puces => puces.Should().BeEmpty());
        }

        [Fact]
        public void Dto_TraductionDeGroupeManquante_RetombeSurLAllemand()
        {
            var skill = CompetenceDeLArbre();
            skill.GroupEs = null;

            var dto = NewMapper().Map<HeroSkillDto>(skill);

            dto.Group!["es"].Should().Be("Strategie");
        }

        [Fact]
        public void Puces_AllerRetourJson_ConserveTexteEtAccents()
        {
            var puces = new[] { "Rückkehr des Helden (9km)", "1 zusätzlicher Zonenkontrollpunkt wenn \"clean\"", "Cámara" };

            var json = HeroSkillBullets.Serialize(puces);

            json.Should().NotBeNull();
            HeroSkillBullets.Deserialize(json).Should().Equal(puces);
            HeroSkillBullets.Serialize(new string[0]).Should().BeNull();
            HeroSkillBullets.Deserialize(null).Should().NotBeNull().And.BeEmpty();
            HeroSkillBullets.Deserialize("").Should().BeEmpty();
        }

        [Fact]
        public void ContratJson_ProprietesEnCamelCase()
        {
            // Mêmes réglages que les contrôleurs : valeurs par défaut web d'ASP.NET Core (camelCase, clés de
            // dictionnaire inchangées, null écrits) et JsonStringEnumConverter (Program.cs).
            var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
            options.Converters.Add(new JsonStringEnumConverter());
            var mapper = NewMapper();

            using var historique = JsonDocument.Parse(JsonSerializer.Serialize(mapper.Map<HeroSkillDto>(CompetenceHistorique()), options));
            using var arbre = JsonDocument.Parse(JsonSerializer.Serialize(mapper.Map<HeroSkillDto>(CompetenceDeLArbre()), options));

            var h = historique.RootElement;
            h.GetProperty("name").GetString().Should().Be("manipulator");
            h.GetProperty("daysNeeded").GetInt32().Should().Be(3);
            h.GetProperty("nbUses").GetInt32().Should().Be(2);
            h.GetProperty("icon").GetString().Should().Be("small_falsify");
            h.GetProperty("label").GetProperty("fr").GetString().Should().Be("Tipp-Ex");
            h.GetProperty("description").GetProperty("de").GetString().Should().Be("Fälschen");
            h.GetProperty("legacy").GetBoolean().Should().BeTrue();
            h.GetProperty("group").ValueKind.Should().Be(JsonValueKind.Null);
            h.GetProperty("groupSort").ValueKind.Should().Be(JsonValueKind.Null);
            h.GetProperty("level").ValueKind.Should().Be(JsonValueKind.Null);
            foreach (var langue in Langues)
            {
                h.GetProperty("bullets").GetProperty(langue).GetArrayLength().Should().Be(0);
            }

            var a = arbre.RootElement;
            a.GetProperty("legacy").GetBoolean().Should().BeFalse();
            a.GetProperty("group").GetProperty("fr").GetString().Should().Be("Stratégie");
            a.GetProperty("groupSort").GetInt32().Should().Be(0);
            a.GetProperty("level").GetInt32().Should().Be(2);
            a.GetProperty("bullets").GetProperty("en")[1].GetString().Should().Be("Camera (3 charges)");
        }
    }
}
