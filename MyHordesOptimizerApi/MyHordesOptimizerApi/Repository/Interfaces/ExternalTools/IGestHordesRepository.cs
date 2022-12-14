using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces.ExternalTools
{
    public interface IGestHordesRepository
    {
        void Update();
        void UpdateGHZoneRegen(string sessid, List<dynamic> cellToUpdate);
        void UpdateCell(IDictionary<string, object> dictionnary);
        void UpdateCitizen(GestHordesMajCitizenRequest ghUpdateCitizenRequest);
    }
}
