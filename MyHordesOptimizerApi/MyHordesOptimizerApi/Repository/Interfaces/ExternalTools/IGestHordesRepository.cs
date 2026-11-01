using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces.ExternalTools
{
    public interface IGestHordesRepository
    {
        /// <summary>Mise à jour /majScript ; avec une case, ses relevés partent dans le même appel.</summary>
        void Update(GestHordesMajScriptRequest? cell);
        void UpdateGHZoneRegen(string sessid, List<dynamic> cellToUpdate);
        void UpdateCitizen(GestHordesMajCitizenRequest ghUpdateCitizenRequest);
        void UpdateCellItem(GestHordesMajCaseRequestDto request);
        void UpdateCellZombies(GestHordesMajCaseZombiesDto request);
    }
}
