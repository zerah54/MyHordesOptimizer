using System;
using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using AutoMapper.Internal;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class CampingService : ICampingService
    {
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; private set; }
        protected IMapper Mapper { get; private set; }

        public CampingService(IMyHordesOptimizerRepository myHordesOptimizerRepository, IMapper mapper)
        {
            MyHordesOptimizerRepository = myHordesOptimizerRepository;
            Mapper = mapper;
        }

        public int CalculateCamping(CampingParametersDto campingParametersDto)
        {
            var campingParameters = Mapper.Map<CampingParametersModel>(campingParametersDto);
            return getCampingOdds(campingParameters);
        }
        
        

        private int getCampingOdds(CampingParametersModel campingParameters) 
        {
	        return Math.Max(0, Math.Min(getCampingValues(campingParameters).Sum(chancePair => chancePair.Value), campingParameters.Job == "survivalist" ? 100 : 90));
        }

        private Dictionary<string, int> getCampingValues(CampingParametersModel campingParameters)
        {
	        var distChances = new[] { -100, -75, -50, -25, -10, 0, 0, 0, 0, 0, 0, 0, 5, 7, 10, 15, 20 };
	        var crowdChances = new[] { 0,-10,-30,-50,-70 };
	        var campChances = getCampChancesDependingOnNbCampings(campingParameters.TownType == TownType.Pande, campingParameters.ProCamper); 

	        var chance = new Dictionary<string, int>() {
		        {"previous", campChances[Math.Min(campingParameters.Campings, campChances.Length - 1)]},
		        {"tomb", campingParameters.Tomb ? 8 : 0},
		        {"town", campingParameters.TownType == TownType.Pande ? -40 : 0},
		        {"zone", (campingParameters.Improve * 5) + (campingParameters.ObjectImprove * 9)},
		        {"zoneBuilding", getZoneBuildingBonus(campingParameters.RuinBuryCount, campingParameters.RuinBonus, campingParameters.HiddenCampers, campingParameters.RuinCapacity)},
		        {"lighthouse", campingParameters.Phare ? 25 : 0},
		        {"campitems", campingParameters.Objects * 5},
		        {"zombies", campingParameters.Zombies * (campingParameters.Vest ? -3 : -7)},
		        {"campers", crowdChances[Math.Min(crowdChances.Length - 1, Math.Max(0, campingParameters.HiddenCampers - 1))]}, // peut être -2 ?
		        {"night", campingParameters.Night ? 10 : 0},
		        {"distance", distChances[Math.Min(distChances.Length - 1, campingParameters.Distance)]},
		        {"devastated", campingParameters.Devastated ? -50 : 0}
		    };

	        return chance;
        }

        private int[] getCampChancesDependingOnNbCampings(bool isPanda, bool proCamper)
        {
	        int[] campChances;
	        // Previous campings
	        if( isPanda ) 
	        {
		        if( proCamper )
		        {
			        campChances = new[] { 50, 45, 40, 30, 20, 10, 0 };
		        }
		        else
		        {
			        campChances = new[] { 50, 30, 20, 10, 0 };
		        }
	        }
	        else
	        {
		        if( proCamper )
		        {
			        campChances = new[] { 80, 70, 60, 40, 30, 20, 0 };
		        }
		        else
		        {
			        campChances = new[] { 80, 60, 35, 15, 0 };
		        }
	        }
	        return campChances.Concat(new[] {-50, -100, -200, -400, -1000, -2000, -5000} ).ToArray();
        }

        private int getZoneBuildingBonus(int buryCount, int ruinBonus, int hiddenCampers, int capacity)
        {
	        var chance = -25;

	        if (canHideInsideBuilding(hiddenCampers, getBuildingCampingCapacity(buryCount, capacity))) {
		        chance = 15;

		        if(buryCount == 0) 
		        {
			        chance = ruinBonus;
		        }
	        }
	        
	        return chance;
        }
        
        public int getBuildingCampingCapacity(int capacity, int buryCount) {
	        if (buryCount == 0) 
	        {
		        return capacity;
	        }
	        
		    return Math.Max(0, Math.Min(3, Convert.ToInt32(Math.Floor((decimal)buryCount / 3))));
        }

        private bool canHideInsideBuilding(int hiddenCampers, int capacity)
        {
	        return capacity < 0 || hiddenCampers < capacity;
        }
    }
}
