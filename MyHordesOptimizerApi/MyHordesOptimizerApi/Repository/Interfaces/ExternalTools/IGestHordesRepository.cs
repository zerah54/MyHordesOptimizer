using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces.ExternalTools
{
    public interface IGestHordesRepository
    {
        void Update();
        void UpdateGHZoneRegen(string sessid, List<dynamic> cellToUpdate);
        void UpdateCitizen(GestHordesMajCitizenRequest ghUpdateCitizenRequest);
        void UpdateCellItem(GestHordesMajCaseRequestDto request);
        void UpdateCellZombies(GestHordesMajCaseZombiesDto request);
    }
}
