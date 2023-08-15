using System.Collections.Generic;
using MyHordesOptimizerApi.Data.Glossary;
using MyHordesOptimizerApi.DiscordBot.Enums;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IGlossaryRepository
    {
        Dictionary<Locales, List<GlossaryModel>> GetGlossary();
    }
}