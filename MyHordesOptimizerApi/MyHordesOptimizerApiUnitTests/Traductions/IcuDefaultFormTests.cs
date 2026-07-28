using FluentAssertions;
using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApiUnitTests.Traductions
{
    /// <summary>
    /// Les entrées genrées des fichiers de traduction du jeu sont des messages ICU, pas des
    /// chaînes. Recopiées verbatim, elles se retrouvaient affichées telles quelles sur le site.
    /// </summary>
    public class IcuDefaultFormTests
    {
        // Reproduit à l'identique `Schamane` de translations/game+intl-icu.fr.yml, sauts de ligne
        // et indentation compris : c'est sous cette forme que la chaîne arrive.
        private const string ChamanIcu = "\n            {ref__icu, select,\n                on {\n"
            + "                    {ref__gender, select,\n"
            + "                        female {Chamane}\n"
            + "                        other {Chaman}\n"
            + "                    }\n                }\n            other {Chaman}\n            }\n        ";

        private const string LacereIcu = "\n            {ref__icu, select,\n                on {\n"
            + "                    {ref__gender, select,\n"
            + "                        female {Lacérée… dévorée… pendant l’attaque de la nuit}\n"
            + "                        other {Lacéré… dévoré… pendant l’attaque de la nuit}\n"
            + "                    }\n                }\n"
            + "            other {Lacéré(e)… dévoré(e)… pendant l’attaque de la nuit}\n            }\n        ";

        [Fact]
        public void MessageIcu_RetientLaBrancheOtherDePremierNiveau()
        {
            // Et non celle imbriquée dans ref__gender, qui est la forme MASCULINE : sans donnée de
            // genre, retenir « Lacéré… » ferait afficher un masculin à tout le monde.
            MyHordesExtensions.ResolveIcuDefaultForm(LacereIcu)
                .Should().Be("Lacéré(e)… dévoré(e)… pendant l’attaque de la nuit");
        }

        [Fact]
        public void MessageIcu_DontLesDeuxBranchesCoincident()
        {
            MyHordesExtensions.ResolveIcuDefaultForm(ChamanIcu).Should().Be("Chaman");
        }

        [Fact]
        public void ChaineOrdinaire_EstRenvoyeeTelleQuelle()
        {
            // La très grande majorité des libellés. Aucune normalisation ne doit leur être appliquée.
            MyHordesExtensions.ResolveIcuDefaultForm("Déshydratation").Should().Be("Déshydratation");
        }

        [Fact]
        public void ChaineAvecAccoladesMaisSansSelect_EstRenvoyeeTelleQuelle()
        {
            // Un paramètre de substitution simple n'est pas un message à réduire.
            const string message = "{count} zombies";
            MyHordesExtensions.ResolveIcuDefaultForm(message).Should().Be(message);
        }

        [Fact]
        public void MessageTronque_EstRenvoyeTelQuel_PlutotQueDeLeverOuDeRendreVide()
        {
            // Robustesse : une entrée mal formée ne doit pas faire échouer tout un import de
            // référentiel. On préfère la chaîne d'origine, visiblement fautive, à une exception.
            const string message = "{ref__icu, select, other {jamais refermé";
            MyHordesExtensions.ResolveIcuDefaultForm(message).Should().Be(message);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ValeurVide_EstRenvoyeeTelleQuelle(string? message)
        {
            MyHordesExtensions.ResolveIcuDefaultForm(message).Should().Be(message);
        }

        [Fact]
        public void SelectSansBrancheOther_EstRenvoyeTelQuel()
        {
            // Rien à retenir sans branche par défaut : on ne devine pas.
            const string message = "{ref__gender, select, female {Chamane} male {Chaman}}";
            MyHordesExtensions.ResolveIcuDefaultForm(message).Should().Be(message);
        }
    }
}
