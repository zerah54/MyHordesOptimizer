using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces.Translations
{
    public interface ITranslationService
    {
        Task<TranslationResultDto> GetTranslationAsync(string locale, string sourceString);
    }
}
