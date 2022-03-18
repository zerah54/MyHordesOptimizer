using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;

namespace MyHordesOptimizerApi.Services.Interfaces.Translations
{
    public interface ITranslationService
    {
        TranslationResultDto GetTranslation(string locale, string sourceString);
    }
}
