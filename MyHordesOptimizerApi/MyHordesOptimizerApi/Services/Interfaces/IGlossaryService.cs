using System.Collections.Generic;
using MyHordesOptimizerApi.Data.Glossary;
using MyHordesOptimizerApi.DiscordBot.Enums;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IGlossaryService
    {
        Dictionary<Locales, List<GlossaryModel>> GetGlossary();
        List<GlossaryModel> GetGlossaryEntriesFromString(Locales? locale, string sourceString);
    }
}