using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces.ExternalTools
{
    public interface IGestHordesRepository
    {
        void Update();
        void UpdateGHZoneRegen(string sessid, List<dynamic> cellToUpdate);
    }
}
