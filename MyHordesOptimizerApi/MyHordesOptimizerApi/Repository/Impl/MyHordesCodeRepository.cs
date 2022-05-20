using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Collections.Generic;
using System.IO;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesCodeRepository : IMyHordesCodeRepository
    {
        public Dictionary<string, MyHordesRuinCodeModel> GetRuins()
        {
            var path = "Data/Ruins/ruins.json";
            var json = File.ReadAllText(path);
            var dico = json.FromJson<Dictionary<string, MyHordesRuinCodeModel>>();
            return dico;
        }
    }
}
