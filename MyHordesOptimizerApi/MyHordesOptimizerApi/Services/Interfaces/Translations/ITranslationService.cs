using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.Models.Translation;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces.Translations
{
    public interface ITranslationService
    {
        Task<TranslationResultDto> GetTranslationAsync(string locale, string sourceString);
        Task<Dictionary<string, List<YmlTranslationFileModel>>> GetTranslations();
        Task ResetTranslation();
    }
}
