using AutoMapper;
using AutoMapper.Internal;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Data.Camping;
using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class CampingService : ICampingService
    {
        /// <summary>Rang du groupe Repos (« Ruhe ») dans l'arbre des capacités héroïques.</summary>
        public const int RecluseGroupSort = 4;

        /// <summary>Plafond des chances de camping sans capacité qui le relève (<c>CampingChanceCap</c> par défaut).</summary>
        private const double DefaultCampingCap = 0.9;
        private const string ProCamperProperty = "features.pro.camper";
        private const string ProCamperLimitProperty = "props.limit.camping.pro";
        private const string CampingCapProperty = "props.limit.camping.cap";

        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }

        protected IMyHordesCodeRepository MyHordesCodeRepository { get; private set; }
        protected MyHordesCampingBonusModel CampingBonus { get; private set; }
        protected List<MyHordesCampingResultModel> CampingResults { get; private set; }
        protected IMapper Mapper { get; private set; }

        /// <summary>Niveaux du groupe Repos (0 à 3) de l'arbre actuel, lus seulement si un campeur en a un.</summary>
        private readonly Lazy<IReadOnlyDictionary<int, MyHordesHerosCapacitiesCodeModel>> _recluseCapacities;

        public CampingService(IServiceScopeFactory serviceScopeFactory, IMyHordesCodeRepository myHordesCodeRepository, IMapper mapper)
        {
            ServiceScopeFactory = serviceScopeFactory;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
            CampingBonus = MyHordesCodeRepository.GetCampingBonus();
            CampingResults = MyHordesCodeRepository.GetCampingResults();
            _recluseCapacities = new Lazy<IReadOnlyDictionary<int, MyHordesHerosCapacitiesCodeModel>>(() => MyHordesCodeRepository.GetHeroCapacities()
                .Where(capacity => !capacity.Legacy && capacity.Sort == RecluseGroupSort && capacity.Level.HasValue)
                .GroupBy(capacity => capacity.Level!.Value)
                .ToDictionary(group => group.Key, group => group.First()));
        }

        public CampingOddsDto CalculateCamping(CampingParametersDto campingParametersDto)
        {
            return GetCampingOdds(campingParametersDto, GetZoneImprovement(campingParametersDto));
        }

        public CampingGroupResultDto CalculateGroup(CampingGroupParametersDto group)
        {
            var count = group.Campers.Count;
            var probabilities = new int[count, count];
            var odds = new List<CampingOddsDto>(count);
            for (var camper = 0; camper < count; camper++)
            {
                for (var rank = 0; rank < count; rank++)
                {
                    var camperOdds = GetCampingOdds(ToCampingParameters(group, group.Campers[camper], rank), group.ImprovementLevel);
                    probabilities[camper, rank] = camperOdds.BoundedProbability;
                    if (camper == rank)
                    {
                        odds.Add(camperOdds);
                    }
                }
            }

            var bestOrder = CampingOrder.Best(probabilities);
            return new CampingGroupResultDto
            {
                Odds = odds,
                ExpectedSurvivors = odds.Sum(camperOdds => camperOdds.BoundedProbability) / 100.0,
                BestOrder = bestOrder.ToList(),
                BestExpectedSurvivors = bestOrder.Select((camper, rank) => probabilities[camper, rank]).Sum() / 100.0
            };
        }

        public CampingBonusDto GetBonus()
        {
            var campingBonusDto = Mapper.Map<CampingBonusDto>(CampingBonus);
            return campingBonusDto;
        }

        public List<CampingResultDto> GetResults()
        {
            var campingResultsDto = Mapper.Map<List<CampingResultDto>>(CampingResults);
            return campingResultsDto;
        }

        /// <summary>
        /// Paramètres d'un campeur du groupe caché au rang <paramref name="rank"/> : ceux cachés avant
        /// lui s'ajoutent à la foule. Sans bâtiment, la zone vaut le bonus du désert, sans limite de places.
        /// </summary>
        private CampingParametersDto ToCampingParameters(CampingGroupParametersDto group, CampingGroupCamperDto camper, int rank)
        {
            var hasBuilding = group.RuinBonus.HasValue || group.RuinBuryCount > 0;
            var (proCamper, r4) = camper.RecluseLevel.HasValue
                ? GetRecluseCamping(camper.RecluseLevel.Value, camper.Campings)
                : (camper.ProCamper, camper.R4);
            return new CampingParametersDto
            {
                TownType = group.TownType,
                Job = camper.Job ?? string.Empty,
                Distance = group.Distance,
                Campings = camper.Campings,
                ProCamper = proCamper,
                HiddenCampers = group.HiddenCampers + rank,
                Objects = camper.Objects,
                Vest = camper.Vest,
                Tomb = camper.Tomb,
                Zombies = group.Zombies,
                Night = group.Night,
                Devastated = group.Devastated,
                Phare = group.Phare,
                RuinBonus = hasBuilding ? (group.RuinBonus ?? 0) : CampingBonus.DesertBonus,
                RuinBuryCount = group.RuinBuryCount,
                RuinCapacity = hasBuilding ? group.RuinCapacity : -1,
                R4 = r4
            };
        }

        /// <summary>
        /// Ce que le niveau de Repos donne au camping, comme dans MyHordes (<c>CitizenHandler::getCampingValues</c>) :
        /// Campeur pro tant que les campings déjà faits restent sous la limite du niveau, et le plafond des chances
        /// (99 % au niveau 4, porté ici par <c>R4</c>).
        /// </summary>
        private (bool ProCamper, bool R4) GetRecluseCamping(int recluseLevel, int campings)
        {
            if (recluseLevel <= 0 || !_recluseCapacities.Value.TryGetValue(recluseLevel - 1, out var capacity) || capacity.CitizenProperties == null)
            {
                return (false, false);
            }

            var properties = capacity.CitizenProperties;
            var proCamper = properties.TryGetValue(ProCamperProperty, out var enabled) && enabled.Type == JTokenType.Boolean && enabled.Value<bool>();
            var limit = properties.TryGetValue(ProCamperLimitProperty, out var limitToken) && limitToken.Type == JTokenType.Integer ? limitToken.Value<int>() : 0;
            var cap = properties.TryGetValue(CampingCapProperty, out var capToken) && capToken.Type is JTokenType.Float or JTokenType.Integer
                ? capToken.Value<double>()
                : DefaultCampingCap;
            return (proCamper && campings < limit, cap >= 0.99);
        }

        private int GetZoneImprovement(CampingParametersDto campingParameters)
        {
            return (campingParameters.Improve * CampingBonus.Improve) + (campingParameters.ObjectImprove * CampingBonus.ObjectImprove);
        }

        private CampingOddsDto GetCampingOdds(CampingParametersDto campingParameters, int zoneImprovement)
        {
            var values = GetCampingValues(campingParameters, zoneImprovement);
            var probability = values.Sum(chancePair => chancePair.Value);
            var odds = new CampingOddsDto();
            odds.Details = values;
            odds.BoundedProbability = Math.Max(0, Math.Min(probability, GetMaxBoundedProbability(campingParameters)));
            odds.Probability = probability;
            odds.Label = CampingResults.Find(result => result.Strict ? odds.BoundedProbability < result.Probability : odds.BoundedProbability <= result.Probability).Label;
            return odds;
        }

        private int GetMaxBoundedProbability(CampingParametersDto campingParameters)
        {
            if (campingParameters.Job == "survivalist")
            {
                return 100;
            }

            return campingParameters.R4 ? 99 : 90;
        }

        private Dictionary<string, int> GetCampingValues(CampingParametersDto campingParameters, int zoneImprovement)
        {

            var campChances = getCampChancesDependingOnNbPreviousCampings(campingParameters.TownType == TownType.PANDE, campingParameters.ProCamper);

            var chance = new Dictionary<string, int>() {
                {"previous", campChances[Math.Min(Math.Max(campingParameters.Campings, 0), campChances.Length - 1)]},
                {"tomb", campingParameters.Tomb ? CampingBonus.Tomb : 0},
                {"town", campingParameters.TownType == TownType.PANDE ? CampingBonus.Pande : 0},
                {"zone", zoneImprovement},
                {"zoneBuilding", GetZoneBuildingBonus(campingParameters.RuinBuryCount, campingParameters.RuinBonus, campingParameters.HiddenCampers, campingParameters.RuinCapacity)},
                {"lighthouse", campingParameters.Phare ? CampingBonus.Lighthouse : 0},
                {"campItems", campingParameters.Objects * CampingBonus.CampItems},
                {"zombies", campingParameters.Zombies * (campingParameters.Vest ? CampingBonus.ZombieVest : CampingBonus.ZombieNoVest)},
                {"campers", CampingBonus.CrowdChances[Math.Min(CampingBonus.CrowdChances.Count - 1, Math.Max(0, campingParameters.HiddenCampers))]},
                {"night", campingParameters.Night ? CampingBonus.Night : 0},
                {"distance", CampingBonus.DistChances[Math.Min(CampingBonus.DistChances.Count - 1, campingParameters.Distance)]},
                {"devastated", campingParameters.Devastated ? CampingBonus.Devastated : 0}
            };

            return chance;
        }

        private int[] getCampChancesDependingOnNbPreviousCampings(bool isPanda, bool proCamper)
        {
            List<int> campChances;
            if (isPanda)
            {
                if (proCamper)
                {
                    campChances = CampingBonus.PandaProCamperByAlreadyCamped;
                }
                else
                {
                    campChances = CampingBonus.PandaNoProCamperByAlreadyCamped;
                }
            }
            else
            {
                if (proCamper)
                {
                    campChances = CampingBonus.NormalProCamperByAlreadyCamped;
                }
                else
                {
                    campChances = CampingBonus.NormalNoProCamperByAlreadyCamped;
                }
            }
            return campChances.Concat(CampingBonus.CommonByAlreadyCamped).ToArray();
        }

        private int GetZoneBuildingBonus(int buryCount, int ruinBonus, int hiddenCampers, int capacity)
        {
            var chance = CampingBonus.DesertBonus;

            if (CanHideInsideBuilding(hiddenCampers, GetBuildingCampingCapacity(capacity, buryCount)))
            {
                chance = CampingBonus.BuriedBonus;

                if (buryCount == 0)
                {
                    chance = ruinBonus;
                }
            }

            return chance;
        }

        public int GetBuildingCampingCapacity(int capacity, int buryCount)
        {
            if (buryCount == 0)
            {
                return capacity;
            }

            return Math.Max(0, Math.Min(3, Convert.ToInt32(Math.Floor((decimal)buryCount / 3))));
        }

        private bool CanHideInsideBuilding(int hiddenCampers, int capacity)
        {
            return capacity < 0 || hiddenCampers < capacity;
        }
    }
}
