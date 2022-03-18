using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations
{
    public class TranslationResultDto
    {
        public List<KeyValuePair<TranslationKeyDto, TranslationDto>> Translations { get; set; }
        

        public TranslationResultDto()
        {
            Translations = new List<KeyValuePair<TranslationKeyDto, TranslationDto>>();
        }

        internal void AddTranslation(string de, string context, bool isExactMatch, List<string> fr, List<string> es, List<string> en)
        {
            var key = new TranslationKeyDto()
            {
                DeString = de,
                Context = context,
                IsExactMatch = isExactMatch
            };
            var translation = Translations.FirstOrDefault(x => x.Key == key);
            var translationDto = new TranslationDto()
            {
                Fr = fr,
                Es = es,
                En = en,
                De = new List<string>() { de }
            };
            if (false)
            {
                translationDto.Fr.AddRange(fr);
                translationDto.En.AddRange(en);
                translationDto.Es.AddRange(es);
            }
            
            Translations.Add(KeyValuePair.Create(key, translationDto));
        }
    }

    public class TranslationKeyDto
    {
        public string DeString { get; set; }
        public string Context { get; set; }
        public bool IsExactMatch { get; set; }

        public override bool Equals(object obj)
        {
            return obj is TranslationKeyDto dto &&
                   DeString == dto.DeString &&
                   Context == dto.Context;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(DeString, Context);
        }
    }

    public class TranslationDto
    {
        public List<string> Fr { get; set; }
        public List<string> Es { get; set; }
        public List<string> En { get; set; }
        public List<string> De { get; set; }

        public TranslationDto()
        {
            Fr = new List<string>();
            Es = new List<string>();
            En = new List<string>();
            De = new List<string>();
        }
    }
}
