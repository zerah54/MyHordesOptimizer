﻿using AutoMapper;
using AutoMapper.Internal;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Data.Camping;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class CampingService : ICampingService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }

        protected IMyHordesCodeRepository MyHordesCodeRepository { get; private set; }
        protected MyHordesCampingBonusModel CampingBonus { get; private set; }
        protected List<MyHordesCampingResultModel> CampingResults { get; private set; }
        protected IMapper Mapper { get; private set; }

        public CampingService(IServiceScopeFactory serviceScopeFactory, IMyHordesCodeRepository myHordesCodeRepository, IMapper mapper)
        {
            ServiceScopeFactory = serviceScopeFactory;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
            CampingBonus = MyHordesCodeRepository.GetCampingBonus();
            CampingResults = MyHordesCodeRepository.GetCampingResults();

        }

        public CampingOddsDto CalculateCamping(CampingParametersDto campingParametersDto)
        {
            return GetCampingOdds(campingParametersDto);
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

        private CampingOddsDto GetCampingOdds(CampingParametersDto campingParameters)
        {
            var probability = GetCampingValues(campingParameters).Sum(chancePair => chancePair.Value);
            var odds = new CampingOddsDto();
            odds.BoundedProbability = Math.Max(0, Math.Min(probability, campingParameters.Job == "survivalist" ? 100 : 90));
            odds.Probability = probability;
            odds.Label = CampingResults.Find(result => result.Strict ? odds.BoundedProbability < result.Probability : odds.BoundedProbability <= result.Probability).Label;
            return odds;
        }

        private Dictionary<string, int> GetCampingValues(CampingParametersDto campingParameters)
        {

            var campChances = getCampChancesDependingOnNbPreviousCampings(campingParameters.TownType == TownType.Pande, campingParameters.ProCamper);

            var chance = new Dictionary<string, int>() {
                {"previous", campChances[Math.Min(Math.Max(campingParameters.Campings, 0), campChances.Length - 1)]},
                {"tomb", campingParameters.Tomb ? CampingBonus.Tomb : 0},
                {"town", campingParameters.TownType == TownType.Pande ? CampingBonus.Pande : 0},
                {"zone", (campingParameters.Improve * CampingBonus.Improve) + (campingParameters.ObjectImprove * CampingBonus.ObjectImprove)},
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
