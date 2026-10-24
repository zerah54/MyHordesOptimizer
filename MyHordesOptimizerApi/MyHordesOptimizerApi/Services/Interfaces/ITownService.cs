using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ITownService
    {
        LastUpdateInfoDto AddCitizenDailyAction(int townId, int userId, string actionKey, int day);
        CitizenDto DeleteCitizenDailyAction(int townId, int userId, string actionKey, int day);
        CitizenDto GetTownCitizen(int townId, int userId);
        TownListPageResultDto GetTowns(TownListQueryDto query);
        List<SeasonDto> GetSeasons();
        List<SeasonPhaseDto> GetSeasonPhases();
        void FinishSeason(int season);
        void UnfinishSeason(int season);
        void DeleteTown(int townId);

        LastUpdateInfoDto UpdateCitizenChamanicDetail(int townId, int userId, CitizenChamanicDetailDto chamanicDetailDto);
        void UpdateCitizenCampingCount(int townId, int userId, int campingCount);
        void UpdateCitizenShoesEquipped(int townId, int userId, bool shoesEquipped);
        void UpdateCitizenHeroSkills(int townId, int userId, CitizenHeroSkillLevelsDto heroSkills);
    }
}