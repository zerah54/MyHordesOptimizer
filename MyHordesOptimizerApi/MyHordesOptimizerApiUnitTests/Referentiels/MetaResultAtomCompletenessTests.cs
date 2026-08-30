using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Garde-fou : tout type d'atome présent dans <c>meta-results.json</c> doit être soit
    /// <see cref="MetaResultAtomExtensions.StatusEffectAtomType"/> (décodé), soit dans
    /// <see cref="MetaResultAtomExtensions.KnownIgnoredAtomTypes"/> (volontairement ignoré en v1).
    /// Une réextraction qui introduit un nouveau type d'atome fait échouer ce test au lieu d'être
    /// silencieusement ignorée.
    /// </summary>
    public class MetaResultAtomCompletenessTests
    {
        [Fact]
        public void ToutTypeDAtomeDuFichierReel_EstDecodeOuExplicitementIgnore()
        {
            var repository = new MyHordesCodeRepository();
            var results = repository.GetMetaResults();

            var typesRencontres = results.Values
                .SelectMany(r => r.AtomList)
                .Select(a => a.Atom)
                .Distinct()
                .ToList();

            var typesInconnus = typesRencontres
                .Where(t => t != MetaResultAtomExtensions.StatusEffectAtomType
                    && t != MetaResultAtomExtensions.ItemEffectAtomType
                    && t != MetaResultAtomExtensions.ZoneEffectAtomType
                    && !MetaResultAtomExtensions.KnownIgnoredAtomTypes.Contains(t))
                .ToList();

            typesInconnus.Should().BeEmpty(
                "chaque type d'atome de meta-results.json doit être décodé (StatusEffect) ou " +
                "explicitement listé dans KnownIgnoredAtomTypes — sinon un futur effet passerait " +
                "inaperçu du moteur de simulation");
        }
    }
}
