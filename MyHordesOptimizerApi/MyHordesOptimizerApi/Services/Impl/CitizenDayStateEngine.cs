using System;
using System.Collections.Generic;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.CitizenState;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl
{
    /// <summary>
    /// Moteur de simulation PA/PE/états d'un citoyen sur une journée — voir section 5 du spec
    /// (docs/superpowers/specs/2026-08-14-simulateur-pa-etats-om-design.md). Ne refuse jamais une
    /// étape par manque de points : applique l'effet, laisse l'appelant juger.
    /// </summary>
    public class CitizenDayStateEngine : ICitizenDayStateEngine
    {
        protected IMyHordesCodeRepository Repository { get; init; }
        protected ICitizenItemActionsProvider ItemActionsProvider { get; init; }

        public CitizenDayStateEngine(IMyHordesCodeRepository repository, ICitizenItemActionsProvider itemActionsProvider)
        {
            Repository = repository;
            ItemActionsProvider = itemActionsProvider;
        }

        public CitizenStateTrace Simulate(CitizenState start, IReadOnlyList<CitizenStateStep> steps)
        {
            var actions = Repository.GetActions();
            var metaResults = Repository.GetMetaResults();

            var trace = new CitizenStateTrace { StartingState = Clone(start) };
            var current = Clone(start);

            foreach (var step in steps)
            {
                if (current.IsDead) break;

                var description = step switch
                {
                    ItemActionStep itemStep => ApplyItemAction(current, itemStep, actions, metaResults),
                    MoveStep moveStep => ApplyMove(current, moveStep),
                    EquipShoesStep => ApplyEquipShoes(current, metaResults),
                    MountBikeStep => ApplyMountBike(current, metaResults),
                    DismountBikeStep => ApplyDismountBike(current, metaResults),
                    PickupDefenceCpItemStep => ApplyPickupDefenceCpItem(current),
                    BecomeGhoulStep => ApplyBecomeGhoul(current),
                    _ => throw new NotSupportedException($"Type d'étape non supporté : {step.GetType().Name}")
                };

                trace.Steps.Add(new CitizenStateStepResult { Description = description, StateAfter = Clone(current) });
            }

            return trace;
        }

        private string ApplyItemAction(CitizenState state, ItemActionStep step,
            Dictionary<string, MyHordesActionsCodeModel> actions,
            Dictionary<string, MyHordesMetaResultCodeModel> metaResults)
        {
            // Un item peut être rattaché à plusieurs variantes meta-exclusives (ex. drogues : "drug_1"
            // 1re prise du jour vs "drug_2" prises suivantes → addict garanti). Le moteur ne filtre
            // aucune autre condition "meta" (hors périmètre, voir spec sous-projet B), mais celle-ci
            // doit l'être : sinon "drug_addict" se déclenche dès le premier usage.
            var alreadyUsedDrugToday = state.HasUsedDrugToday;
            // Portage du gate "can_eat" (BeyondController.php:264 : !hasStatus('haseaten')) : un
            // second repas le même jour est purement et simplement indisponible dans le jeu, pas
            // juste inutile une fois l'AP au plafond — sinon l'engine applique quand même son effet.
            var alreadyEatenToday = state.Statuses.Contains("haseaten");
            // Palier de soif ("not_thirsty"/"drink_tl1"/"drink_tl2") : sans ce filtre, TOUTES les
            // variantes water_tl0/tl1/tl2 s'appliquaient d'un coup, et water_tl2 (drink_no_ap,
            // statusFrom=thirst2/statusTo=thirst1) infligeait "thirst1" à un citoyen même pas assoiffé.
            var isThirsty1 = state.Statuses.Contains("thirst1");
            var isThirsty2 = state.Statuses.Contains("thirst2");
            // Portage du gate "can_drink" (BeyondController.php) : le bonus PA d'une boisson ("hasdrunk")
            // n'est accordé qu'une fois par jour. Contrairement à "eat_ap"/"drug_1"/"drug_2", ce gate
            // n'existe pas comme meta d'action — "drink_ap_1" (PA) et "drink_ap_2" (désaltération)
            // partagent le même résultat d'action ; seul "drink_ap_1" doit être bloqué au 2nd usage.
            var alreadyDrankToday = state.Statuses.Contains("hasdrunk");

            foreach (var actionName in ItemActionsProvider.GetActionNames(step.ItemId))
            {
                if (!actions.TryGetValue(actionName, out var action)) continue;
                if (action.Meta.Contains("drug_2") && !alreadyUsedDrugToday) continue;
                if (action.Meta.Contains("drug_1") && alreadyUsedDrugToday) continue;
                if (action.Meta.Contains("drug_1") || action.Meta.Contains("drug_2")) state.HasUsedDrugToday = true;
                if (action.Meta.Contains("eat_ap") && alreadyEatenToday) continue;
                if (action.Meta.Contains("not_thirsty") && (isThirsty1 || isThirsty2)) continue;
                if (action.Meta.Contains("drink_tl1") && !isThirsty1) continue;
                if (action.Meta.Contains("drink_tl2") && !isThirsty2) continue;
                // Ex. boire : "water" (not_role_ghoul, désaltère) vs "water_g" (role_ghoul, blesse) —
                // même item, variantes mutuellement exclusives selon le rôle courant.
                if (action.Meta.Contains("role_ghoul") && !state.IsRoleGhoul) continue;
                if (action.Meta.Contains("not_role_ghoul") && state.IsRoleGhoul) continue;

                foreach (var resultKey in action.Result)
                {
                    var key = resultKey?.ToString();
                    if (key is null || !metaResults.TryGetValue(key, out var metaResult)) continue;
                    if (key == "drink_ap_1" && alreadyDrankToday) continue;

                    foreach (var atom in metaResult.AtomList)
                    {
                        ApplyStatusEffectAtom(state, atom);
                    }
                }
            }

            CitizenStatusCascadeRules.SyncTired(state.Statuses, state.Ap);

            return $"Item #{step.ItemId}";
        }

        private void ApplyStatusEffectAtom(CitizenState state, MetaResultAtom atom)
        {
            var effect = atom.AsStatusEffect();
            if (effect is null) return;

            // Un même atome peut porter un effet de point ET un effet de statut simultanément
            // (ex. eat_ap6 : pointType=Ap + statusTo="haseaten") : les deux doivent s'appliquer.
            if (effect.PointType is PointType pointType && effect.PointRelativeToMax is RelativeMaxPoint relativeToMax)
            {
                ApplyPointEffect(state, pointType, relativeToMax, effect.PointValue ?? 0, effect.PointCapAt, effect.PointExceedMax);
            }

            if (effect.StatusTo is not null)
            {
                CitizenStatusCascadeRules.Inflict(state.Statuses, effect.StatusTo);
            }

            if (effect.StatusFrom is not null)
            {
                CitizenStatusCascadeRules.Remove(state.Statuses, effect.StatusFrom);
            }

            if (effect.Role == "ghoul" && effect.RoleIsAdded is bool roleIsAdded)
            {
                state.IsRoleGhoul = roleIsAdded;
            }

            if (effect.StatusTo is not null || effect.StatusFrom is not null)
            {
                // Wounded n'est pas un flag indépendant : CitizenHandler::isWounded le dérive des statuts wound1..6
                // à chaque changement (ex. bandage qui purge la famille doit aussi lever Wounded).
                state.Wounded = CitizenStatusCascadeRules.IsWounded(state.Statuses);
            }
        }

        private static void ApplyPointEffect(CitizenState state, PointType pointType, RelativeMaxPoint relativeToMax,
            int pointValue, int? capAt, int? exceedMax)
        {
            switch (pointType)
            {
                case PointType.Ap:
                    var maxAp = CitizenPointRules.GetMaxAp(state.Wounded);
                    state.Ap = CitizenPointRules.ApplyPointEffect(state.Ap, maxAp, relativeToMax, pointValue, capAt, exceedMax);
                    break;
                case PointType.Sp:
                    var maxSp = CitizenPointRules.GetMaxSp(state.IsEclaireur, state.HasBike, state.HasShoes);
                    state.Sp = CitizenPointRules.ApplyPointEffect(state.Sp, maxSp, relativeToMax, pointValue, capAt, exceedMax);
                    break;
                default:
                    // Cp/Mp non rencontrés dans le jeu d'actions vérifié pour ce lot (section 2 du spec) :
                    // échec explicite plutôt qu'un effet silencieusement ignoré.
                    throw new NotSupportedException(
                        $"PointType {pointType} non géré par le moteur v1 (seuls Ap/Sp sont supportés).");
            }
        }

        private string ApplyMove(CitizenState state, MoveStep step)
        {
            var primary = CitizenMovementRules.GetPrimarySource(step.IsNearZone);
            var (ap, sp) = CitizenMovementRules.DeductWithFallback(state.Ap, state.Sp, primary, 1);
            state.Ap = ap;
            state.Sp = sp;
            CitizenStatusCascadeRules.SyncTired(state.Statuses, state.Ap);

            state.WalkingDistance++;
            if (state.WalkingDistance > 10)
            {
                state.WalkingDistance = 0;
                if (CitizenStatusCascadeRules.IncreaseThirstLevel(state.Statuses))
                {
                    state.IsDead = true;
                }
            }

            return step.IsNearZone ? "Déplacement (zone proche)" : "Déplacement (zone lointaine)";
        }

        // Source: equip_shoe_first/equip_bike_first/unequip_bike_first (actions.json) — seuls les effets
        // AP/SP sont rejoués ici, les tags de statut internes (tg_has_bike, etc.) ne sont pas modélisés
        // par ce moteur simplifié.
        private string ApplyEquipShoes(CitizenState state, Dictionary<string, MyHordesMetaResultCodeModel> metaResults)
        {
            state.HasShoes = true;
            ApplyNamedMetaResult(state, metaResults, "plus_1sp_e");
            return "Chausse ses baskets";
        }

        private string ApplyMountBike(CitizenState state, Dictionary<string, MyHordesMetaResultCodeModel> metaResults)
        {
            state.HasBike = true;
            ApplyNamedMetaResult(state, metaResults, "plus_2sp_e");
            return "Monte à vélo";
        }

        private string ApplyDismountBike(CitizenState state, Dictionary<string, MyHordesMetaResultCodeModel> metaResults)
        {
            state.HasBike = false;
            ApplyNamedMetaResult(state, metaResults, "minus_2sp");
            return "Descend du vélo";
        }

        private string ApplyPickupDefenceCpItem(CitizenState state)
        {
            state.HasDefenceCpItem = true;
            return "Ramasse un objet de défense de zone";
        }

        private string ApplyBecomeGhoul(CitizenState state)
        {
            state.IsRoleGhoul = true;
            return "Devient une goule";
        }

        private void ApplyNamedMetaResult(CitizenState state, Dictionary<string, MyHordesMetaResultCodeModel> metaResults, string key)
        {
            if (!metaResults.TryGetValue(key, out var metaResult)) return;
            foreach (var atom in metaResult.AtomList) ApplyStatusEffectAtom(state, atom);
        }

        private static CitizenState Clone(CitizenState state) => new CitizenState
        {
            Ap = state.Ap,
            Sp = state.Sp,
            Wounded = state.Wounded,
            IsEclaireur = state.IsEclaireur,
            HasBike = state.HasBike,
            HasShoes = state.HasShoes,
            WalkingDistance = state.WalkingDistance,
            IsDead = state.IsDead,
            Statuses = new HashSet<string>(state.Statuses),
            HasShield = state.HasShield,
            HasDefenceCpItem = state.HasDefenceCpItem,
            IsGuide = state.IsGuide,
            ZoneCitizenCount = state.ZoneCitizenCount,
            HasCleanPdcPerk = state.HasCleanPdcPerk,
            HasHydratedPdcPerk = state.HasHydratedPdcPerk,
            HasSoberPdcPerk = state.HasSoberPdcPerk,
            HasBaseZoneControlPerk = state.HasBaseZoneControlPerk,
            HasUsedDrugToday = state.HasUsedDrugToday,
            IsRoleGhoul = state.IsRoleGhoul,
        };
    }
}
