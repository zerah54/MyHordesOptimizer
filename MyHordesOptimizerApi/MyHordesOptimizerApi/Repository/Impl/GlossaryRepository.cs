using System;
using System.Collections.Generic;
using System.IO;
using MyHordesOptimizerApi.Data.Glossary;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Repository.Interfaces;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class GlossaryRepository : IGlossaryRepository
    {
        public Dictionary<Locales, List<GlossaryModel>> GetGlossary()
        {
            var dico = new Dictionary<Locales, List<GlossaryModel>>();
            foreach (Locales locale in Enum.GetValues(typeof(Locales)))
            {
                dico.Add(locale, GetGlossaryByLocale(locale));
            }

            return dico;
        }

        private List<GlossaryModel> GetGlossaryByLocale(Locales locale)
        {
            var path = $"Data/Glossary/glossary.{locale}.json";
            var json = File.ReadAllText(path);
            var list = json.FromJson<List<GlossaryModel>>();
            return list;
        }
    }
}