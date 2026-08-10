using System.Collections.Generic;
using FluentAssertions;
using MyHordesOptimizerApi.MappingProfiles.Items;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Une action qui exige un outil porte un meta "have_&lt;propriété&gt;" (ou "..._hd" pour la
    /// variante professionnelle) — la propriété requise se déduit du référentiel importé, sans
    /// table de correspondance codée en dur.
    /// </summary>
    public class ItemOpenerResolverTests
    {
        private static readonly List<string> KnownProperties = new()
        {
            "can_opener", "box_opener", "parcel_opener", "weapon", "fragile"
        };

        [Fact]
        public void UnMetaHaveCorrespondantAUnePropriete_RenvoieCettePropriete()
        {
            var meta = new List<string> { "not_profession_tech", "have_can_opener", "is_not_wounded_hands" };

            ItemOpenerResolver.ResolveRequiredProperty(meta, KnownProperties)
                .Should().Be("can_opener");
        }

        [Fact]
        public void UnMetaHaveHdCorrespondantAUnePropriete_RenvoieLaProprieteSansLeSuffixe()
        {
            var meta = new List<string> { "profession_tech", "have_box_opener_hd", "is_not_wounded_hands" };

            ItemOpenerResolver.ResolveRequiredProperty(meta, KnownProperties)
                .Should().Be("box_opener");
        }

        [Fact]
        public void UnMetaNotHave_NEstPasTraiteCommeUneExigence()
        {
            var meta = new List<string> { "profession_tech", "not_have_can_opener_hd", "min_1_cp" };

            ItemOpenerResolver.ResolveRequiredProperty(meta, KnownProperties)
                .Should().BeNull();
        }

        [Fact]
        public void UnMetaHaveSansProprieteCorrespondante_EstIgnore()
        {
            var meta = new List<string> { "have_battery", "is_not_wounded_hands" };

            ItemOpenerResolver.ResolveRequiredProperty(meta, KnownProperties)
                .Should().BeNull();
        }

        [Fact]
        public void AucunMetaHave_RenvoieNull()
        {
            var meta = new List<string> { "is_not_wounded_hands", "room_for_item" };

            ItemOpenerResolver.ResolveRequiredProperty(meta, KnownProperties)
                .Should().BeNull();
        }
    }
}
