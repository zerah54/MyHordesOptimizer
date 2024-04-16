using MyHordesOptimizerApi.Models.Translation;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface ITranslastionRepository
    {
        Task<Dictionary<string, List<YmlTranslationFileModel>>> GetTranslationAsync();
    }
}
