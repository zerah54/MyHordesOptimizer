using System;
using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Services.Impl.Items
{
    /// <summary>
    /// Retrouve l'objet MHO d'un objet MyHordes (banque, sol des zones) : par <c>uuid</c> (= <c>Item.Uid</c>),
    /// ou, sur une instance du jeu qui n'émet pas encore <c>uuid</c>, par id MyHordes (<c>MhId ?? IdItem</c>).
    /// </summary>
    public sealed class MyHordesItemResolver
    {
        private readonly Dictionary<string, Item> _byUid = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<int, Item> _byMhId = new();

        public MyHordesItemResolver(IEnumerable<Item> items)
        {
            var withoutMhId = new List<Item>();
            foreach (var item in items)
            {
                if (item.Uid != null)
                {
                    _byUid.TryAdd(item.Uid, item);
                }
                if (item.MhId.HasValue)
                {
                    _byMhId.TryAdd(item.MhId.Value, item);
                }
                else
                {
                    withoutMhId.Add(item);
                }
            }
            // Le MhId explicite prime sur l'IdItem d'une autre ligne.
            foreach (var item in withoutMhId)
            {
                _byMhId.TryAdd(item.IdItem, item);
            }
        }

        /// <summary>Un <c>uuid</c> inconnu ne retombe pas sur l'id : celui-ci désignerait un autre objet.</summary>
        public Item? Resolve(MyHordesItem source)
        {
            if (source.Uuid != null)
            {
                return _byUid.GetValueOrDefault(source.Uuid);
            }
            return source.Id.HasValue && _byMhId.TryGetValue(source.Id.Value, out var byMhId) ? byMhId : null;
        }
    }
}
