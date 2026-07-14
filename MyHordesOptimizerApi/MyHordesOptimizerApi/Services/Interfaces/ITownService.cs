using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ITownService
    {
        LastUpdateInfoDto AddCitizenBath(int townId, int userId, int day);
        CitizenDto DeleteCitizenBath(int townId, int userId, int day);
        CitizenDto GetTownCitizen(int townId, int userId);
        TownListPageResultDto GetTowns(TownListQueryDto query);
        List<SeasonDto> GetSeasons();
        List<SeasonPhaseDto> GetSeasonPhases();
        void FinishSeason(int season);
        void UnfinishSeason(int season);
        void DeleteTown(int townId);

        LastUpdateInfoDto UpdateCitizenChamanicDetail(int townId, int userId, CitizenChamanicDetailDto chamanicDetailDto);
    }
}