using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using Newtonsoft.Json.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    public class MetaResultItemZoneEffectTests
    {
        [Fact]
        public void UnAtomeItemEffect_SeDecodeAvecSaCibleDeTransformation()
        {
            var atom = new MetaResultAtom
            {
                Atom = MetaResultAtomExtensions.ItemEffectAtomType,
                Payload = JObject.Parse("""{"morphSource": true, "morphSourceType": "metal_bad_#00", "breakSource": null}""")
            };

            var effect = atom.AsItemEffect();

            effect.Should().NotBeNull();
            effect!.MorphSourceType.Should().Be("metal_bad_#00");
            effect.BreakSource.Should().BeNull();
        }

        [Fact]
        public void UnAtomeItemEffect_DecodeUnBreakSourceVrai()
        {
            var atom = new MetaResultAtom
            {
                Atom = MetaResultAtomExtensions.ItemEffectAtomType,
                Payload = JObject.Parse("""{"morphSource": true, "morphSourceType": null, "breakSource": true}""")
            };

            atom.AsItemEffect()!.BreakSource.Should().BeTrue();
        }

        [Fact]
        public void UnAtomeZoneEffect_SeDecodeAvecSaPlageDeKills()
        {
            var atom = new MetaResultAtom
            {
                Atom = MetaResultAtomExtensions.ZoneEffectAtomType,
                Payload = JObject.Parse("""{"zombieMin": 11, "zombieMax": 20, "zombieKillRange": 1}""")
            };

            var effect = atom.AsZoneEffect();

            effect.Should().NotBeNull();
            effect!.ZombieMin.Should().Be(11);
            effect.ZombieMax.Should().Be(20);
            effect.ZombieKillRange.Should().Be(1);
            effect.Escape.Should().BeNull();
        }

        [Fact]
        public void UnAtomeZoneEffect_DecodeUneVarianteRepulsion()
        {
            var atom = new MetaResultAtom
            {
                Atom = MetaResultAtomExtensions.ZoneEffectAtomType,
                Payload = JObject.Parse("""{"escape": 300, "escapeRange": 1}""")
            };

            var effect = atom.AsZoneEffect();

            effect!.Escape.Should().Be(300);
            effect.EscapeRange.Should().Be(1);
            effect.ZombieMin.Should().BeNull();
        }

        [Fact]
        public void UnAtomeDUnAutreType_NeSeDecodePasEnItemEffet()
        {
            var atom = new MetaResultAtom { Atom = MetaResultAtomExtensions.StatusEffectAtomType, Payload = null };

            atom.AsItemEffect().Should().BeNull();
            atom.AsZoneEffect().Should().BeNull();
        }
    }
}
