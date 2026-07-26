using System;
using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Estimations
{
    public class MyHordesOptimizerEstimationService : IMyHordesOptimizerEstimationService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected ILogger<MyHordesOptimizerEstimationService> Logger { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected MhoContext DbContext { get; set; }

        public MyHordesOptimizerEstimationService(IServiceScopeFactory serviceScopeFactory,
            IUserInfoProvider userInfoProvider,
            ILogger<MyHordesOptimizerEstimationService> logger,
            IMapper mapper,
            MhoContext dbContext)
        {
            ServiceScopeFactory = serviceScopeFactory;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
            Mapper = mapper;
            DbContext = dbContext;
        }

        public void UpdateEstimations(int townId, EstimationRequestDto request)
        {
            townId = DbContext.ResolveTownId(townId);
            using var transaction = DbContext.Database.BeginTransaction();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(UserInfoProvider.GenerateLastUpdateInfo(), opt => opt.SetDbContext(DbContext)));
            DbContext.SaveChanges();

            var newEstimations = Mapper.Map<List<TownEstimation>>(request, opt =>
            {
                opt.SetLastUpdateInfoId(newLastUpdate.Entity.IdLastUpdateInfo);
                opt.SetTownId(townId);
            });
            var estimations = DbContext.TownEstimations.Where(x => x.Day == request.Day && x.IdTown == townId)
                .ToList();
            if (estimations.Any())
            {
                var planif = estimations.First(e => e.IsPlanif);
                planif.UpdateNoNullProperties(newEstimations.First(ne => ne.IsPlanif));
                DbContext.Update(planif);
                var estim = estimations.First(e => !e.IsPlanif);
                estim.UpdateNoNullProperties(newEstimations.First(ne => !ne.IsPlanif));
                DbContext.Update(estim);
            }
            else
            {
                DbContext.AddRange(newEstimations);
            }
            DbContext.SaveChanges();
            transaction.Commit();
        }

        public EstimationRequestDto GetEstimations(int townId, int day)
        {
            townId = DbContext.ResolveTownId(townId);
            var models = DbContext.TownEstimations.Where(x => x.Day == day && x.IdTown == townId)
                .ToList();
            if (models.Any())
            {
                var dto = Mapper.Map<EstimationRequestDto>(models);
                return dto;
            }
            else
            {
                return new EstimationRequestDto()
                {
                    Day = day
                };
            }
        }

        // Solveur déterministe (aucune probabilité, aucun aléatoire). On borne l'attaque réelle par des
        // INÉGALITÉS toujours vraies, jamais par une hypothèse de convergence.
        //
        // Mécanique du jeu (rules.yml : shift=10, spread=10, variance=48, offset 15/36) : le serveur tire
        // une valeur puis en dérive une bande cible [targetMin, targetMax] de largeur value*shift*factor/100.
        // La tour affiche cette bande ÉLARGIE par des offsets qui décroissent avec le nombre de citoyens,
        // souvent de façon UNILATÉRALE (une seule borne bouge). On ne peut donc PAS supposer qu'au plus
        // haut % la bande affichée vaut exactement [targetMin, targetMax].
        //
        // Invariant rigoureux, pour toute ligne q : min_q ≤ targetMin ≤ attaque ≤ targetMax ≤ max_q.
        //  ⟹ borne basse = max_q(min_q) ; borne haute = min_q(max_q).
        // Resserrement rigoureux du haut : targetMax-targetMin = value*shiftSpan (±1 d'arrondi) et
        // max_q-min_q ≥ targetMax-targetMin ⟹ attaque ≤ (min_q(max_q-min_q) + 1) / shiftSpan.
        // (Ce resserrement encaisse aussi le facteur d'âmes : bande et attaque sont scalées à l'identique.)
        public EstimationResultDto CalculateAttack(int townId, int dayAttack, bool beta = false, AttackDifficulty difficulty = AttackDifficulty.Normal)
        {
            var estimObj = GetEstimations(townId, dayAttack);
            var planifObj = GetEstimations(townId, dayAttack - 1);

            // Pool de contraintes = tour(J) + planificateur(J-1) AGRÉGÉS. Par essence, planif(J-1) renseigne
            // l'attaque du jour J : il lit la MÊME ZombieEstimation (mêmes targetMin/targetMax) que la tour(J),
            // seulement ARRONDIE au bloc (ceil(day/5)*5). Ses lignes sont donc des contraintes VALIDES (juste
            // plus grossières) : l'invariant min_q ≤ targetMin ≤ attaque ≤ targetMax ≤ max_q tient pour chacune.
            // On les met dans le même pool → sur une tour PARTIELLE (tout le monde n'est pas encore passé), les
            // niveaux du planif peuvent resserrer la fenêtre ; sur une tour complète, ils sont dominés (aucun
            // effet). Tour vide → il ne reste que le planif (ancien comportement de secours). Le slot J-1 garantit
            // l'alignement sur le même jour d'attaque : NE PAS agréger un autre jour (ce serait une autre attaque).
            int planifBlocks = (int)(Math.Ceiling(dayAttack / 5.0) * 5);
            var rows = ExtractRows(estimObj?.Estim, blocks: 1);
            rows.AddRange(ExtractRows(planifObj?.Planif, blocks: planifBlocks));

            // Difficulté : RNE/RE/PANDE = normal (le champ `hard` de MyHordes = type panda, NORMAL pour
            // l'estimation). Easy/Hard n'existent que sur villes CUSTOM, exposées par aucune API : à forcer
            // via le paramètre `difficulty` (défaut normal) en attendant les paramètres custom de ville.
            var config = difficulty switch
            {
                AttackDifficulty.Easy => EstimationSolverConfig.Easy,
                AttackDifficulty.Hard => EstimationSolverConfig.Hard,
                _ => EstimationSolverConfig.Normal,
            };

            double factor = dayAttack <= 15 ? 1.0 : (dayAttack <= 20 ? 0.75 : (dayAttack <= 30 ? 0.5 : (dayAttack <= 40 ? 0.25 : 0.15)));
            double ratioMin = dayAttack <= 3 ? 0.75 : config.MaxRatio;
            double ratioMax = dayAttack <= 1 ? 0.5 : (dayAttack <= 3 ? 0.75 : config.MaxRatio);
            int minGlobal = (int)Math.Round(ratioMin * Math.Pow(Math.Max(1, dayAttack - 1) * 0.75 + 2.5, 3), MidpointRounding.AwayFromZero);
            int maxGlobal = (int)Math.Round(ratioMax * Math.Pow(dayAttack * 0.75 + 3.5, 3), MidpointRounding.AwayFromZero);
            double shiftSpan = config.Shift * factor / 100.0;

            var result = new EstimationResultDto();
            result.Result ??= new EstimationValueDto();

            if (rows.Count == 0)
            {
                // Aucune estimation : on ne sait rien de plus que les bornes théoriques du jour.
                result.Result.Min = minGlobal;
                result.Result.Max = maxGlobal;
                return result;
            }

            int lower = rows.Max(row => row.Min);   // borne basse garantie (min de la ligne la plus haute)
            int upper = rows.Min(row => row.Max);   // borne haute garantie (invariant)

            // Raffinement RIGOUREUX de la ligne 0 % (planif à 0 citoyen). Une ligne affichée à 0 % ⟺ 0 citoyen
            // (quality = citizen_count/24, round(quality*100)=0 ⟺ 0 citoyen ; si un preset a un cc_offset>0 la
            // ligne 0 % n'apparaît jamais). Or à 0 citoyen calculate_offsets ne tourne pas (end=min(0,24)=0) :
            // les offsets AFFICHÉS sont donc EXACTEMENT les offsets STOCKÉS, qui sont garantis ≥ un plancher —
            // contrairement à toute autre ligne où l'offset peut avoir été réduit jusqu'à 0. Source
            // (PrepareZombieAttackEstimationAction) : off_min ∈ [round(f*5), round(f*26)], off_max = round(f*28)-off_min,
            // et en cas de rebound le "protect" force chaque offset ≥ protect (3 si jour≤30, sinon 1) tout en
            // conservant la somme. Plancher garanti = min(borne mt_rand, protect). On peut donc "dé-offset"
            // partiellement, le blocage floor/ceil du planif ne faisant que desserrer la borne :
            //   value ≥ targetMin ≥ (min - 0.5) / (1 - offMinFloor/100)
            //   value ≤ targetMax ≤ (max + 0.5) / (1 + offMaxFloor/100)
            // Valable pour TOUTES les difficultés : les offsets ne dépendent pas du mode d'attaque (seul `value`
            // change en hard, mais targetMin ≤ value ≤ targetMax reste vrai). Ne s'applique QU'À la ligne 0 %.
            int protect = dayAttack <= 30 ? 3 : 1;
            int offMinFloor = Math.Min((int)Math.Round(factor * 5, MidpointRounding.AwayFromZero), protect);
            int offMaxFloor = Math.Min((int)Math.Round(factor * 28, MidpointRounding.AwayFromZero)
                                     - (int)Math.Round(factor * 26, MidpointRounding.AwayFromZero), protect);
            foreach (var row in rows.Where(row => row.Percent == 0))
            {
                if (offMinFloor > 0)
                {
                    int refinedLower = (int)Math.Ceiling((row.Min - 0.5) / (1.0 - offMinFloor / 100.0));
                    if (refinedLower > lower)
                    {
                        lower = refinedLower;
                    }
                }
                if (offMaxFloor > 0)
                {
                    int refinedUpper = (int)Math.Floor((row.Max + 0.5) / (1.0 + offMaxFloor / 100.0));
                    if (refinedUpper > 0 && refinedUpper < upper)
                    {
                        upper = refinedUpper;
                    }
                }
            }

            // Resserrement du haut par la largeur de la bande la plus étroite. Pas en mode hard : l'attaque
            // y est un re-tirage uniforme dans la bande et peut atteindre targetMax (donc pas de resserrement).
            if (!config.RerollInBand && shiftSpan > 0)
            {
                int minWidth = rows.Min(row => row.Max - row.Min);
                int widthBound = (int)Math.Floor((minWidth + 1) / shiftSpan);
                if (widthBound < upper)
                {
                    upper = widthBound;
                }
            }

            // Bornes théoriques du jour : la VRAIE attaque (= mt_rand(minGlobal, maxGlobal)) est TOUJOURS dans
            // [minGlobal, maxGlobal], même quand la bande AFFICHÉE de la tour en sort (le deshift de MH ne rabat
            // qu'un seul côté et reverse l'excédent sur l'autre → l'affichage peut déborder, surtout aux bas %).
            // On intersecte donc la fenêtre avec ces bornes → resserre une tour éparse dont la bande a débordé,
            // sans jamais exclure la vraie attaque. UNIQUEMENT en difficulté Normal : minGlobal/maxGlobal
            // utilisent le ratio 1.1 ; en Easy/Hard (ratio 0.75/3.1, non exposé par l'API) ils seraient faux et
            // le clamp exclurait à tort la vraie attaque. Si Easy/Hard est un jour branché, les bornes seront
            // recalculées avec le bon ratio et ce clamp redeviendra valide.
            if (difficulty == AttackDifficulty.Normal)
            {
                lower = Math.Max(lower, minGlobal);
                upper = Math.Min(upper, maxGlobal);
            }

            if (upper < lower)
            {
                upper = lower; // garde-fou si les lignes sont incohérentes entre elles
            }

            // Affinage « paires d'offsets » (2026-07-26, validé banc pairbench : 250k sims × 5 régimes
            // sans violation, 6k énumérations complètes sans exclusion, 6 attaques réelles contenues).
            // Idée : la paire initiale (offMin0, offMax0) est ENTIÈRE, de somme round(f·(variance−2·shift))
            // (déplacée mais PRÉSERVÉE par deshift/protect), et la ligne 0 % du planif l'affiche TELLE
            // QUELLE (0 itération de réduction). On énumère donc paires initiales × bandes candidates
            // (targetMin, Δ) et on ne garde une valeur V que s'il EXISTE une combinaison satisfaisant
            // toutes les CONDITIONS NÉCESSAIRES (fenêtres d'inversion des arrondis par ligne, bornes et
            // monotonie décroissante PAR CÔTÉ, cônes de décroissance de la somme). Conditions nécessaires
            // uniquement ⟹ la vraie attaque n'est JAMAIS exclue ; le gain vit surtout à J13+ (jusqu'à
            // −65 % de largeur observé). Pas en mode hard (l'attaque re-tirée casse le lien Δ↔V).
            bool[] pairFeasible = null;
            int pairWindowStart = lower;
            if (!config.RerollInBand && shiftSpan > 0 && upper > lower)
            {
                // Les bandes affichées et l'attaque réelle sont scalées ×soulFactor (âmes rouges) : les
                // marges du filtre doivent couvrir ce facteur. Cap réel 1.2 (rules) pour RNE/RE ; 666 en
                // panda ⟹ marge large (s ≤ 5, ~100 âmes) pour PANDE/CUSTOM/type inconnu.
                int resolvedTownId = DbContext.ResolveTownId(townId);
                var townTypeId = DbContext.Towns.Where(town => town.IdTown == resolvedTownId)
                    .Select(town => town.TownTypeId).FirstOrDefault();
                double soulCap = townTypeId == (int)TownType.RNE || townTypeId == (int)TownType.RE ? 1.2 : 5.0;
                pairFeasible = ComputeOffsetPairFeasibility(rows, lower, upper, dayAttack, factor, shiftSpan, config, soulCap);
                if (pairFeasible != null)
                {
                    int feasibleLower = -1, feasibleUpper = -1;
                    for (int i = 0; i < pairFeasible.Length; i++)
                    {
                        if (pairFeasible[i])
                        {
                            if (feasibleLower < 0) feasibleLower = pairWindowStart + i;
                            feasibleUpper = pairWindowStart + i;
                        }
                    }
                    if (feasibleLower >= 0)
                    {
                        lower = feasibleLower;
                        upper = feasibleUpper;
                    }
                    else
                    {
                        pairFeasible = null; // données incohérentes : on garde la fenêtre invariante
                    }
                }
            }

            result.Result.Min = lower;
            result.Result.Max = upper;

            // Répartition : CHAQUE valeur de la fenêtre est une attaque possible → au moins une barre.
            // En plus (COMPLÉMENT indicatif), on rehausse les valeurs les plus vraisemblables par le nombre
            // de partages de shift qui reproduisent EXACTEMENT la bande observée au plus haut % [min100, max100].
            // Ce bonus culmine près de la vraie valeur quand la tour a convergé des deux côtés (J9 pic ≈ 820) ;
            // il est nul si la convergence est unilatérale (J10) → l'histogramme reste alors plat sur la fenêtre.
            // Bande OBSERVÉE au plus haut % (recalculée depuis les lignes, PAS depuis `lower` qui a pu être
            // remonté par le clamp bornes-du-jour) : le bonus doit se comparer à la vraie bande, pas à la fenêtre.
            int min100 = rows.Max(row => row.Min);     // = max_q(min_q)
            int max100 = rows.Min(row => row.Max);     // = min_q(max_q)
            bool weightByShift = !config.RerollInBand && shiftSpan > 0;
            int shiftSteps = weightByShift ? (int)Math.Round(config.Shift * factor * 100, MidpointRounding.AwayFromZero) : 0;

            var distribution = new List<int>();
            for (int value = lower; value <= upper; value++)
            {
                // Le jeu faisable des paires peut avoir des TROUS (ancrage discret) : on les exclut
                // aussi de l'histogramme, l'enveloppe [lower, upper] restant la fenêtre garantie.
                if (pairFeasible != null && !pairFeasible[value - pairWindowStart])
                {
                    continue;
                }
                int weight = 1; // valeur possible → présente au moins une fois
                if (weightByShift)
                {
                    for (int step = 0; step <= shiftSteps; step++)
                    {
                        double shiftMin = step / 10000.0;
                        int bandMin = (int)Math.Round(value * (1 - shiftMin), MidpointRounding.AwayFromZero);
                        int bandMax = (int)Math.Round(value * (1 + shiftSpan - shiftMin), MidpointRounding.AwayFromZero);
                        if (bandMin == min100 && bandMax == max100)
                        {
                            weight++;
                        }
                    }
                }
                for (int occurrence = 0; occurrence < weight; occurrence++)
                {
                    distribution.Add(value);
                }
            }

            result.minList = distribution;
            result.maxList = distribution.ToList();

            return result;
        }

        /// <summary>
        /// Ligne d'estimation renseignée. <see cref="CitizenCount"/> = nombre de citoyens montés (= nombre
        /// d'itérations de réduction d'offsets), déduit du % affiché : les paliers sont round(n·100/24)
        /// pour n = 0..24, tous distincts, donc l'inversion est EXACTE (−1 si % inconnu → ligne ignorée
        /// par le filtre de paires, mais conservée pour l'invariant). <see cref="Blocks"/> = arrondi bloc
        /// (1 = tour exacte ; planif = ceil(jourAttaque/5)·5, floor du min / ceil du max).
        /// </summary>
        private readonly record struct EstimationRow(int Percent, int CitizenCount, int Min, int Max, int Blocks);

        /// <summary>Paliers % affichés par la tour/planif, indexés par nombre de citoyens 0..24 (67 ↔ colonne SQL _68).</summary>
        private static readonly int[] BucketPercents = { 0, 4, 8, 13, 17, 21, 25, 29, 33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100 };

        /// <summary>Lignes (%min-max) effectivement renseignées, triées par % croissant.</summary>
        private static List<EstimationRow> ExtractRows(EstimationsDto? estim, int blocks)
        {
            var rows = new List<EstimationRow>();
            if (estim is null) return rows;
            foreach (var property in estim.GetType().GetProperties())
            {
                if (property.GetValue(estim) is not EstimationValueDto value) continue;
                if (value.Min <= 0 || value.Max <= 0) continue;
                if (!int.TryParse(property.Name.Replace("_", string.Empty), out int percent)) continue;
                rows.Add(new EstimationRow(percent, Array.IndexOf(BucketPercents, percent), value.Min, value.Max, blocks));
            }
            return rows.OrderBy(row => row.Percent).ToList();
        }

        // ================== Filtre « paires d'offsets » ==================
        // Toutes les conditions ci-dessous sont des SUR-APPROXIMATIONS (conditions nécessaires avec
        // marges d'arrondi explicites) : on n'élimine une valeur que si AUCUNE réalisation du jeu ne
        // peut produire les lignes observées. Validé par simulateur forward (port fidèle de
        // Prepare/EstimateZombieAttackAction) : 0 violation sur 250k tirages × 5 régimes de jour,
        // 0 exclusion de l'attaque réelle sur 6k énumérations complètes.

        private const double PairEps = 1e-9;

        /// <summary>
        /// Marque les valeurs de [lower, upper] admettant au moins une combinaison (bande, paire
        /// initiale, trajectoire d'offsets) compatible avec toutes les lignes. Null si inapplicable.
        /// soulCap = majorant du facteur d'âmes rouges (bande et attaque scalées à l'identique).
        /// </summary>
        private static bool[] ComputeOffsetPairFeasibility(List<EstimationRow> rows, int lower, int upper,
            int dayAttack, double factor, double shiftSpan, EstimationSolverConfig config, double soulCap)
        {
            var filterRows = rows.Where(row => row.CitizenCount >= 0).OrderBy(row => row.CitizenCount).ToList();
            if (filterRows.Count == 0)
            {
                return null;
            }
            var pairs = BuildInitialPairs(dayAttack, factor, config);
            var cones = new Dictionary<int, (double[] Lo, double[] Hi, double[] Cum)>();
            foreach (var (sum, _) in pairs)
            {
                if (!cones.ContainsKey(sum))
                {
                    cones[sum] = BuildConeTables(sum);
                }
            }

            // Marges : |Δ_brut − V_brut·shiftSpan| ≤ 1 (2 round()) devient, scalé ×s puis posé sur la
            // grille entière (±0.5 par extrémité de bande, ±0.5 sur round(Ṽ)) : ≤ s + 1 + 0.05.
            // Appartenance à la bande : V ≥ targetMin − (0.5s + 1), symétrique côté max.
            double deltaSlack = soulCap + 1.1;
            int bandSlack = (int)Math.Ceiling(0.5 * soulCap + 1.0);

            var feasible = new bool[upper - lower + 1];
            var windows = new double[filterRows.Count, 4];
            int deltaLow = Math.Max(1, (int)Math.Floor(lower * shiftSpan - deltaSlack));
            int deltaHigh = (int)Math.Ceiling(upper * shiftSpan + deltaSlack);
            for (int delta = deltaLow; delta <= deltaHigh; delta++)
            {
                int vLow = Math.Max(lower, (int)Math.Ceiling((delta - deltaSlack) / shiftSpan - PairEps));
                int vHigh = Math.Min(upper, (int)Math.Floor((delta + deltaSlack) / shiftSpan + PairEps));
                if (vLow > vHigh) continue;
                for (int targetMin = vLow - delta - bandSlack; targetMin <= vHigh + bandSlack; targetMin++)
                {
                    if (targetMin < 2) continue;
                    int targetMax = targetMin + delta;
                    int markLow = Math.Max(vLow, targetMin - bandSlack);
                    int markHigh = Math.Min(vHigh, targetMax + bandSlack);
                    if (markLow > markHigh) continue;
                    bool allMarked = true;
                    for (int value = markLow; value <= markHigh && allMarked; value++)
                    {
                        allMarked = feasible[value - lower];
                    }
                    if (allMarked) continue;
                    if (!TryFillRowWindows(filterRows, targetMin, targetMax, windows)) continue;
                    bool anyPair = false;
                    foreach (var (sum, offMin) in pairs)
                    {
                        if (BandPairIsFeasible(filterRows, windows, sum, offMin, cones[sum]))
                        {
                            anyPair = true;
                            break;
                        }
                    }
                    if (!anyPair) continue;
                    for (int value = markLow; value <= markHigh; value++)
                    {
                        feasible[value - lower] = true;
                    }
                }
            }
            return feasible;
        }

        /// <summary>
        /// Paires initiales (somme, offMin0) possibles. Sans rebound : somme = round(f·(variance−2·shift))
        /// EXACTE, offMin0 ∈ [round(f·(offsetMin−shift)), round(f·(offsetMax−shift))]. Avec rebound
        /// (deshift des offsets vs bornes du jour) : somme préservée à ±1 (round de la paire), chaque
        /// côté ramené ≥ protect. Union des deux cas — les offsets STOCKÉS sont toujours entiers.
        /// </summary>
        private static List<(int Sum, int OffMin)> BuildInitialPairs(int dayAttack, double factor, EstimationSolverConfig config)
        {
            int protect = dayAttack <= 30 ? 3 : 1;
            int baseSum = (int)Math.Round(factor * (config.Variance - 2 * config.Shift), MidpointRounding.AwayFromZero);
            int offMinLow = (int)Math.Round(factor * (config.OffsetMin - config.Shift), MidpointRounding.AwayFromZero);
            int offMinHigh = (int)Math.Round(factor * (config.OffsetMax - config.Shift), MidpointRounding.AwayFromZero);
            var pairs = new List<(int Sum, int OffMin)>();
            for (int sum = baseSum - 1; sum <= baseSum + 1; sum++)
            {
                int low = sum == baseSum ? Math.Min(offMinLow, protect) : protect;
                int high = sum == baseSum ? Math.Max(offMinHigh, sum - protect) : sum - protect;
                for (int offMin = Math.Max(0, low); offMin <= high; offMin++)
                {
                    pairs.Add((sum, offMin));
                }
            }
            return pairs;
        }

        /// <summary>
        /// Cônes de la somme d'offsets restante après n itérations de calculate_offsets, depuis une somme
        /// initiale exacte. Lo[n] : décroissance MAXIMALE (branche 25 % : les 2 côtés −spendable chacun,
        /// spendable = somme/(24−i)) ⟹ produit télescopique (24−n)(23−n)/(24·23). Hi[n] : décroissance
        /// MINIMALE (une seule réduction ≥ floor(spendable·250)/1000 ≥ spendable/4 − 0.001), avec 2 étapes
        /// « gratuites » (traversées de zéro, au plus une par côté), placées sur les plus gros facteurs
        /// (les dernières) pour MAJORER. Cum[n] = Σ spendable_i majoré = dépense max possible d'UN côté.
        /// </summary>
        private static (double[] Lo, double[] Hi, double[] Cum) BuildConeTables(int initialSum)
        {
            var lo = new double[25];
            var hi = new double[25];
            var cum = new double[25];
            for (int n = 0; n <= 24; n++)
            {
                lo[n] = n >= 23 ? 0 : initialSum * (24 - n) * (23 - n) / 552.0;
                double remaining = initialSum;
                for (int i = 0; i <= n - 3; i++)
                {
                    remaining = remaining * (1 - 0.25 / (24 - i)) + 0.001;
                }
                hi[n] = remaining;
            }
            for (int n = 1; n <= 24; n++)
            {
                cum[n] = cum[n - 1] + hi[n - 1] / (24 - (n - 1));
            }
            return (lo, hi, cum);
        }

        /// <summary>Facteur MINIMAL de somme d'offsets entre n1 et n2 itérations (décroissance max).</summary>
        private static double SumDecayMin(int n1, int n2)
        {
            return n1 >= 23 ? 0 : (double)((24 - n2) * (23 - n2)) / ((24 - n1) * (23 - n1));
        }

        /// <summary>
        /// Fenêtres d'offsets [aLo, aHi, bLo, bHi] par ligne pour une bande candidate, par inversion des
        /// arrondis : min = round(targetMin·(1−a/100)·soulFactor) (élargi du bloc planif), idem max.
        /// Le ±0.5 sur targetMin/targetMax = grille entière posée sur la bande SCALÉE (réelle-valuée).
        /// False si une fenêtre est vide (bande impossible, aucune paire à tester).
        /// </summary>
        private static bool TryFillRowWindows(List<EstimationRow> rows, int targetMin, int targetMax, double[,] windows)
        {
            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                double blocks = row.Blocks;
                double aLow = 100.0 * (1.0 - (row.Min + blocks - 0.5) / (targetMin - 0.5));
                double aHigh = 100.0 * (1.0 - (row.Min - 0.5) / (targetMin + 0.5));
                double bLow = 100.0 * ((row.Max - blocks + 0.5) / (targetMax + 0.5) - 1.0);
                double bHigh = 100.0 * ((row.Max + 0.5) / (targetMax - 0.5) - 1.0);
                if (Math.Max(aLow, 0) > aHigh + PairEps || Math.Max(bLow, 0) > bHigh + PairEps)
                {
                    return false;
                }
                windows[i, 0] = aLow;
                windows[i, 1] = aHigh;
                windows[i, 2] = bLow;
                windows[i, 3] = bHigh;
            }
            return true;
        }

        /// <summary>
        /// Existe-t-il une trajectoire d'offsets partant de (offMin0, sum−offMin0) compatible avec toutes
        /// les lignes ? Conditions nécessaires : fenêtres d'inversion, bornes par côté
        /// [max(0, X0−Cum[n]), X0], monotonie décroissante par côté (les offsets ne remontent jamais),
        /// cône de somme absolu + relatif entre lignes successives. La ligne 0 % (planif) ancre la paire
        /// EXACTEMENT (0 itération ⟹ offsets affichés = offsets stockés).
        /// </summary>
        private static bool BandPairIsFeasible(List<EstimationRow> rows, double[,] windows, int sum, int offMin0,
            (double[] Lo, double[] Hi, double[] Cum) cone)
        {
            double offMax0 = sum - offMin0;
            double aPrevHigh = offMin0, bPrevHigh = offMax0, sumPrevHigh = sum, sumPrevLow = 0;
            int nPrev = -1;
            for (int i = 0; i < rows.Count; i++)
            {
                int n = rows[i].CitizenCount;
                double aLow = Math.Max(Math.Max(windows[i, 0], offMin0 - cone.Cum[n]), 0);
                double aHigh = Math.Min(windows[i, 1], Math.Min(offMin0, aPrevHigh));
                if (aLow > aHigh + PairEps)
                {
                    return false;
                }
                double bLow = Math.Max(Math.Max(windows[i, 2], offMax0 - cone.Cum[n]), 0);
                double bHigh = Math.Min(windows[i, 3], Math.Min(offMax0, bPrevHigh));
                if (bLow > bHigh + PairEps)
                {
                    return false;
                }
                double sumLow = Math.Max(aLow + bLow, cone.Lo[n]);
                if (nPrev >= 0)
                {
                    sumLow = Math.Max(sumLow, sumPrevLow * SumDecayMin(nPrev, n));
                }
                double sumHigh = Math.Min(aHigh + bHigh, Math.Min(cone.Hi[n], sumPrevHigh));
                if (sumLow > sumHigh + PairEps)
                {
                    return false;
                }
                aPrevHigh = aHigh;
                bPrevHigh = bHigh;
                sumPrevHigh = sumHigh;
                sumPrevLow = sumLow;
                nPrev = n;
            }
            return true;
        }

        public EstimationTuple CreateTupleFromValue(string key, EstimationValueDto value)
        {
            if (value != null)
            {
                return new EstimationTuple(percent: int.Parse(key.Replace("_", "")), key: key, min: value.Min,
                    max: value.Max);
            }

            return new EstimationTuple(percent: int.Parse(key.Replace("_", "")), key: key, min: null,
                max: null);
        }
    }

    public class EstimationTuple
    {
        public int Percent { get; set; }
        public string Key { get; set; }
        public double? Min { get; set; }
        public double? Max { get; set; }

        public EstimationTuple(int percent, string key, double? min, double? max)
        {
            Percent = percent;
            Key = key;
            Min = min;
            Max = max;
        }
    }

    /// <summary>
    /// Constantes de la mécanique d'estimation d'attaque (MyHordes, config/app/rules.yml).
    /// Les constantes d'estimation (shift/spread/variance/offset) sont identiques pour tous les presets
    /// (default/small/remote/panda/custom) ; seule la difficulté des attaques varie.
    /// </summary>
    public sealed class EstimationSolverConfig
    {
        public double Shift { get; init; }      // estimation.shift
        public double Spread { get; init; }     // estimation.spread
        public double Variance { get; init; }   // estimation.variance
        public double OffsetMin { get; init; }  // estimation.offset.min
        public double OffsetMax { get; init; }  // estimation.offset.max
        public double MaxRatio { get; init; }   // difficulté : easy=0.75, normal=1.1, hard=3.1

        /// <summary>
        /// Mode « attaques sévères » : le nombre de zombies est un re-tirage uniforme dans
        /// [targetMin, targetMax] après calcul de la bande. On ne peut donc pas resserrer sous la
        /// bande cible (l'attaque n'est plus liée à la valeur qui a servi à la construire).
        /// </summary>
        public bool RerollInBand { get; init; }

        private const double EstimationShift = 10;
        private const double EstimationSpread = 10;
        private const double EstimationVariance = 48;
        private const double EstimationOffsetMin = 15;
        private const double EstimationOffsetMax = 36;

        public static EstimationSolverConfig Default => Normal;

        // RNE / RE / PANDE = normal. Easy / Hard n'existent que sur les villes CUSTOM et ne sont exposés
        // par aucune API : réservés à une future inférence (bornes des estimations) ou surcharge manuelle.
        public static EstimationSolverConfig Normal => Build(maxRatio: 1.1, rerollInBand: false);
        public static EstimationSolverConfig Easy => Build(maxRatio: 0.75, rerollInBand: false);
        public static EstimationSolverConfig Hard => Build(maxRatio: 3.1, rerollInBand: true);

        private static EstimationSolverConfig Build(double maxRatio, bool rerollInBand) => new()
        {
            Shift = EstimationShift,
            Spread = EstimationSpread,
            Variance = EstimationVariance,
            OffsetMin = EstimationOffsetMin,
            OffsetMax = EstimationOffsetMax,
            MaxRatio = maxRatio,
            RerollInBand = rerollInBand,
        };
    }
}