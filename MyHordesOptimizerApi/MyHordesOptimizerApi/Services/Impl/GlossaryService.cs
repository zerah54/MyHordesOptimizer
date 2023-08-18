using System;
using System.Collections.Generic;
using System.Globalization;
using MyHordesOptimizerApi.Data.Glossary;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class GlossaryService : IGlossaryService
    {
        protected IGlossaryRepository GlossaryRepository { get; set; }

        public GlossaryService(IGlossaryRepository glossaryRepository)
        {
            GlossaryRepository = glossaryRepository;
        }


        public Dictionary<Locales, List<GlossaryModel>> GetGlossary()
        {
            return GlossaryRepository.GetGlossary();
        }

        public List<GlossaryModel> GetGlossaryEntriesFromString(Locales? locale, string sourceString)
        {
            var result = new List<GlossaryModel>();

            if (locale != null)
            {
                result = GetGlossaryFromStringWithLocale((Locales)locale, sourceString);
            }
            else
            {
                foreach (Locales localeFromEnum in Enum.GetValues(typeof(Locales)))
                {
                    var resultListForLocale = GetGlossaryFromStringWithLocale(localeFromEnum, sourceString);
                    foreach (var singleItemForLocale in resultListForLocale)
                    {
                        result.Add(singleItemForLocale);
                    }
                }
            }

            return result;
        }

        private List<GlossaryModel> GetGlossaryFromStringWithLocale(Locales locale, string sourceString)
        {
            var allGlossaryEntriesLocale = GlossaryRepository.GetGlossary()[locale];

            return allGlossaryEntriesLocale.FindAll((glossaryEntry) => String.Compare(
                glossaryEntry.Word,
                sourceString,
                CultureInfo.CurrentCulture,
                CompareOptions.IgnoreNonSpace | CompareOptions.IgnoreCase
            ) == 0);
        }
    }
}