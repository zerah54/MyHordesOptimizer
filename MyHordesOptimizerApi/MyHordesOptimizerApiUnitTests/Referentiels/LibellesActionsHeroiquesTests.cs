using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// L'addon envoie le libellé affiché par le jeu, pas le nom technique de l'action.
    /// La trouvaille en a quatre (hero_generic_find, _lucky, _lucky2, _lucky3), chacun
    /// remplaçant le précédent selon le niveau de héros : sans les quatre, l'action
    /// n'est reconnue que pour une partie des joueurs.
    /// </summary>
    public class LibellesActionsHeroiquesTests
    {
        [Theory]
        [InlineData("fr", "Trouvaille")]
        [InlineData("fr", "Trouvaille (améliorée)")]
        [InlineData("fr", "Impressionnante trouvaille")]
        [InlineData("fr", "Incroyable trouvaille")]
        [InlineData("en", "Seeker")]
        [InlineData("en", "Lucky Find")]
        [InlineData("en", "Impressive find")]
        [InlineData("en", "Incredible find")]
        [InlineData("de", "Fund")]
        [InlineData("de", "Schönes Fundstück")]
        [InlineData("de", "Beeindruckendes Fundstück")]
        [InlineData("de", "Erstaunliches Fundstück")]
        [InlineData("es", "Hallazgo")]
        [InlineData("es", "Hallazgo perfeccionado")]
        [InlineData("es", "Hallazgo milagroso")]
        public void LesQuatreNiveauxDeTrouvailleSontReconnus(string locale, string label)
        {
            ActionHeroicType.LuckyFind.IsEquivalentToLabel(locale, label)
                .Should().BeTrue($"« {label} » ({locale}) est un des libellés de la trouvaille");
        }

        [Theory]
        [InlineData("fr", "Sauvetage", ActionHeroicType.Rescue)]
        [InlineData("en", "Vicious Uppercut", ActionHeroicType.Uppercut)]
        [InlineData("de", "Zweite Lunge", ActionHeroicType.SecondWind)]
        [InlineData("es", "Vencer a la muerte", ActionHeroicType.CheatDeath)]
        [InlineData("fr", "Retour du Héros", ActionHeroicType.HeroicReturn)]
        [InlineData("fr", "Camaraderie", ActionHeroicType.BrotherInArms)]
        public void LesActionsAUnSeulLibelleRestentReconnues(string locale, string label, ActionHeroicType expected)
        {
            expected.IsEquivalentToLabel(locale, label)
                .Should().BeTrue();
        }

        [Theory]
        [InlineData("fr", "Sauvetage")]
        [InlineData("fr", "Second souffle")]
        public void UnLibelleDUneAutreActionNeMatchePasLaTrouvaille(string locale, string label)
        {
            ActionHeroicType.LuckyFind.IsEquivalentToLabel(locale, label)
                .Should().BeFalse();
        }
    }
}
