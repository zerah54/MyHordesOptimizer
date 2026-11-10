using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Repository.Impl;
using Newtonsoft.Json.Linq;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>Catalogue d'objets construit depuis les vrais fichiers de <c>Data/Items</c>.</summary>
    public static class RealItemCatalog
    {
        /// <summary>
        /// Un objet par uid de item-actions.json ∪ item-properties.json, plus les objets produits ou
        /// transformés par meta-results.json (sans action ni propriété, ex. <c>money_#00</c>), avec <c>Img = uid</c>.
        /// </summary>
        public static List<ItemWithoutRecipeDto> Build()
        {
            var repository = new MyHordesCodeRepository();
            var actions = repository.GetItemsActions();
            var properties = repository.GetItemsProperties();
            var itemEffects = repository.GetMetaResults().Values
                .SelectMany(metaResult => metaResult.AtomList)
                .Select(atom => atom.AsItemEffect())
                .OfType<ItemEffectPayload>()
                .ToList();
            var producedUids = itemEffects
                .SelectMany(effect => effect.Spawn ?? new JArray())
                .Select(entry => entry[0]![0]!.Value<string>()!)
                .Concat(itemEffects.Select(effect => effect.MorphSourceType).OfType<string>());

            return actions.Keys.Union(properties.Keys).Union(producedUids)
                .Select(uid => new ItemWithoutRecipeDto
                {
                    Uid = uid,
                    Img = uid,
                    Actions = actions.GetValueOrDefault(uid) ?? new List<string>(),
                    Properties = properties.GetValueOrDefault(uid) ?? new List<string>(),
                })
                .ToList();
        }
    }
}
