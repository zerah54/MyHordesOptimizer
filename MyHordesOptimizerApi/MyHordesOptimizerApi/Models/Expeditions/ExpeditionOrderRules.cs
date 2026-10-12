using MyHordesOptimizerApi.Exceptions;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    /// <summary>Consignes typées (<see cref="ExpeditionOrder.Kind"/>) ; null = texte libre.</summary>
    public static class ExpeditionOrderKinds
    {
        public const string Pick = "pick";
        public const string Drop = "drop";
        public const string Use = "use";
        public const string Clear = "clear";
        public const string Explore = "explore";
        public const string Excavate = "excavate";
        public const string Camp = "camp";
        public const string Hero = "hero";
        public const string Wait = "wait";
    }

    /// <summary>
    /// Forme d'une consigne, vérifiée à chaque enregistrement : case dans la carte, paramètres attendus par son
    /// type et aucun autre. L'état de la case (bâtiment enseveli, ruine explorable, zone excavée) n'est pas vérifié : la carte
    /// change, et une consigne déjà posée ne doit pas empêcher d'enregistrer les autres consignes de la partie.
    /// L'existence de l'objet et du citoyen visés se vérifie en base (ExpeditionService).
    /// </summary>
    public static class ExpeditionOrderRules
    {
        public const int MaxQuantity = 99;

        /// <summary>Actions héroïques proposées : valeurs <c>action</c> de HeroicActionEnum, côté site.</summary>
        public static readonly IReadOnlySet<string> HeroActions = new HashSet<string>(StringComparer.Ordinal)
        {
            "hero_generic_rescue",
            "hero_generic_punch",
            "secondwind",
            "luckyfind",
            "cheatdeath",
            "hero_generic_return",
            "brothers"
        };

        [Flags]
        private enum Params
        {
            None = 0,
            Item = 1,
            Quantity = 2,
            Hero = 4,
            Target = 8
        }

        public static void Validate(ExpeditionOrder order, int mapWidth, int mapHeight)
        {
            if (order.X.HasValue != order.Y.HasValue)
            {
                throw new MhoTechnicalException("Une consigne vise une case entière : x et y vont ensemble.");
            }
            if (order.X.HasValue && (order.X.Value < 0 || order.X.Value >= mapWidth || order.Y!.Value < 0 || order.Y.Value >= mapHeight))
            {
                throw new MhoTechnicalException($"La case [{order.X};{order.Y}] de la consigne est hors de la carte.");
            }
            switch (order.Kind)
            {
                case null:
                    Expect(order, required: Params.None, optional: Params.None);
                    break;
                case ExpeditionOrderKinds.Pick:
                case ExpeditionOrderKinds.Drop:
                    Expect(order, required: Params.Item | Params.Quantity, optional: Params.None);
                    break;
                case ExpeditionOrderKinds.Use:
                    Expect(order, required: Params.Item, optional: Params.None);
                    break;
                case ExpeditionOrderKinds.Clear:
                    Expect(order, required: Params.Quantity, optional: Params.None);
                    break;
                case ExpeditionOrderKinds.Explore:
                case ExpeditionOrderKinds.Excavate:
                case ExpeditionOrderKinds.Camp:
                    Expect(order, required: Params.None, optional: Params.None);
                    break;
                case ExpeditionOrderKinds.Hero:
                    Expect(order, required: Params.Hero, optional: Params.None);
                    if (!HeroActions.Contains(order.HeroSkill!))
                    {
                        throw new MhoTechnicalException($"Action héroïque inconnue : {order.HeroSkill}.");
                    }
                    break;
                case ExpeditionOrderKinds.Wait:
                    Expect(order, required: Params.None, optional: Params.Target);
                    break;
                default:
                    throw new MhoTechnicalException($"Type de consigne inconnu : {order.Kind}.");
            }
            if (order.Quantity.HasValue && (order.Quantity.Value < 1 || order.Quantity.Value > MaxQuantity))
            {
                throw new MhoTechnicalException($"La quantité d'une consigne va de 1 à {MaxQuantity}.");
            }
        }

        private static void Expect(ExpeditionOrder order, Params required, Params optional)
        {
            var present = Params.None;
            if (order.IdItem.HasValue) present |= Params.Item;
            if (order.Quantity.HasValue) present |= Params.Quantity;
            if (!string.IsNullOrEmpty(order.HeroSkill)) present |= Params.Hero;
            if (order.IdTargetUser.HasValue) present |= Params.Target;
            var missing = required & ~present;
            var unexpected = present & ~(required | optional);
            if (missing != Params.None || unexpected != Params.None)
            {
                throw new MhoTechnicalException($"Paramètres incohérents pour une consigne « {order.Kind ?? "texte"} » (manquants : {missing}, en trop : {unexpected}).");
            }
        }
    }
}
