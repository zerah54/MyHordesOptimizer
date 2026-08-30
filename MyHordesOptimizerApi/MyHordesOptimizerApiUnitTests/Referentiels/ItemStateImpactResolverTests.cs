using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Dérive, pour chaque objet, si le consommer affecte PA/PE/statuts — à partir des vraies
    /// actions.json/meta-results.json (via MyHordesCodeRepository), pas d'une liste codée en dur.
    /// Sert à filtrer le catalogue pour le simulateur PA/PE (sous-projet B).
    /// </summary>
    public class ItemStateImpactResolverTests
    {
        private readonly MyHordesCodeRepository _repository = new();

        [Fact]
        public void GetImpactfulItemUids_ActionEatSixAp_EstIncluse()
        {
            var item = new ItemWithoutRecipeDto { Uid = "eat_item", Actions = new[] { "eat_6ap" } };

            var uids = ItemStateImpactResolver.GetImpactfulItemUids(new[] { item }, _repository.GetActions(), _repository.GetMetaResults());

            uids.Should().Contain("eat_item");
        }

        [Fact]
        public void GetImpactfulItemUids_ActionBandage_EstIncluse()
        {
            var item = new ItemWithoutRecipeDto { Uid = "bandage_item", Actions = new[] { "bandage" } };

            var uids = ItemStateImpactResolver.GetImpactfulItemUids(new[] { item }, _repository.GetActions(), _repository.GetMetaResults());

            uids.Should().Contain("bandage_item");
        }

        [Fact]
        public void GetImpactfulItemUids_ActionOuvertureSansEffetDePoint_NEstPasIncluse()
        {
            // "can" : ouvre une conserve, consomme l'objet, ne touche ni aux PA/PE ni aux statuts.
            var item = new ItemWithoutRecipeDto { Uid = "can_item", Actions = new[] { "can" } };

            var uids = ItemStateImpactResolver.GetImpactfulItemUids(new[] { item }, _repository.GetActions(), _repository.GetMetaResults());

            uids.Should().NotContain("can_item");
        }

        [Fact]
        public void GetImpactfulItemUids_AucuneAction_NEstPasIncluse()
        {
            var item = new ItemWithoutRecipeDto { Uid = "empty_item", Actions = new string[0] };

            var uids = ItemStateImpactResolver.GetImpactfulItemUids(new[] { item }, _repository.GetActions(), _repository.GetMetaResults());

            uids.Should().NotContain("empty_item");
        }

        [Fact]
        public void GetImpactfulItemUids_UneSeuleActionParmiPlusieursAUnImpact_IncluLObjet()
        {
            var item = new ItemWithoutRecipeDto { Uid = "mixed_item", Actions = new[] { "can", "eat_6ap" } };

            var uids = ItemStateImpactResolver.GetImpactfulItemUids(new[] { item }, _repository.GetActions(), _repository.GetMetaResults());

            uids.Should().Contain("mixed_item");
        }
    }
}
