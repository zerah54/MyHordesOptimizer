using AutoMapper;
using Common.Core.Repository.Interfaces;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes.Import.i18n;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mime;
using System.Threading.Tasks;
using YamlDotNet.Serialization;

namespace MyHordesOptimizerApi.Services.Impl.Import
{
    public class MyHordesImportService : IMyHordesImportService
    {
        protected readonly IMyHordesOptimizerRepository MyHordesOptimizerRepository;
        protected readonly IWebApiRepository WebApiRepository;
        protected readonly IMyHordesTranslationsConfiguration TranslationsConfiguration;

        protected IMyHordesApiRepository MyHordesApiRepository { get; set; }
        protected IMyHordesCodeRepository MyHordesCodeRepository { get; set; }
        protected readonly IMapper Mapper;


        public MyHordesImportService(IMyHordesOptimizerRepository firebaseRepository,
            IWebApiRepository webApiRepository,
            IMyHordesTranslationsConfiguration translationsConfiguration,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IMyHordesCodeRepository myHordesCodeRepository,
            IMapper mapper)
        {
            MyHordesOptimizerRepository = firebaseRepository;
            WebApiRepository = webApiRepository;
            TranslationsConfiguration = translationsConfiguration;
            MyHordesApiRepository = myHordesJsonApiRepository;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
        }

        #region HeroSkill

        public async Task ImportHeroSkill()
        {
            var codeResult = MyHordesCodeRepository.GetHeroCapacities();

            var capacities = Mapper.Map<List<HeroSkillsModel>>(codeResult);

            // Traductions
            var ymlDeserializer = new DeserializerBuilder()
                .Build();
            var ymlFr = await WebApiRepository.Get(url: TranslationsConfiguration.GameFrUrl).Content.ReadAsStringAsync();
            var ymlEn = await WebApiRepository.Get(url: TranslationsConfiguration.GameEnUrl).Content.ReadAsStringAsync();
            var ymlEs = await WebApiRepository.Get(url: TranslationsConfiguration.GameEsUrl).Content.ReadAsStringAsync();

            var frenchTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlFr);
            var englishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEn);
            var spanishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEs);
            foreach (var capacitie in capacities)
            {
                capacitie.LabelFr = frenchTrads[capacitie.LabelDe];
                capacitie.LabelEn = englishTrads[capacitie.LabelDe];
                capacitie.LabelEs = spanishTrads[capacitie.LabelDe];
                capacitie.DescriptionFr = frenchTrads[capacitie.DescriptionDe];
                capacitie.DescriptionEn = englishTrads[capacitie.DescriptionDe];
                capacitie.DescriptionEs = spanishTrads[capacitie.DescriptionDe];
            }

            MyHordesOptimizerRepository.PatchHeroSkill(capacities);
        }

        private void AddHeroSkillTraduction(string url, List<HeroSkill> heroSkillsWithoutTrad, string locale)
        {
            var translationFile = WebApiRepository.Get<TranslationXmlFileDto>(url: url, mediaTypeOut: MediaTypeNames.Application.Xml);
            foreach (var heroSkill in heroSkillsWithoutTrad)
            {
                var descriptionUnit = translationFile.File.Unit.First(unit => unit.Segment.Source == heroSkill.Description[HeroSkill.DefaultLocale]);
                heroSkill.Description[locale] = descriptionUnit.Segment.Target;
                var labelUnit = translationFile.File.Unit.First(unit => unit.Segment.Source == heroSkill.Label[HeroSkill.DefaultLocale]);
                heroSkill.Label[locale] = labelUnit.Segment.Target;
            }
        }

        #endregion

        #region Items

        public void ImportItems()
        {
            // Récupération des items
            var myHordesItems = MyHordesApiRepository.GetItems();
            var mhoItems = Mapper.Map<List<ItemModel>>(myHordesItems);
            MyHordesOptimizerRepository.PatchItems(mhoItems);

            // Récupération des properties
            var codeItemsProperty = MyHordesCodeRepository.GetItemsProperties();
            var allProperties = codeItemsProperty.Values.ToList().SelectMany(list => list).Distinct().ToList();
            MyHordesOptimizerRepository.PatchProperties(allProperties);

            MyHordesOptimizerRepository.DeleteAllPropertiesItem();
            foreach (var kvp in codeItemsProperty)
            {
                var itemUid = kvp.Key;
                var properties = kvp.Value;
                MyHordesOptimizerRepository.PatchPropertiesItem(itemUid, properties);
            }

            // Récupération des actions
            var codeItemsActions = MyHordesCodeRepository.GetItemsActions();
            var allActions = codeItemsActions.Values.ToList().SelectMany(list => list).Distinct().ToList();
            MyHordesOptimizerRepository.PatchActions(allActions);

            MyHordesOptimizerRepository.DeleteAllActionsItem();
            foreach (var kvp in codeItemsActions)
            {
                var itemUid = kvp.Key;
                var actions = kvp.Value;
                MyHordesOptimizerRepository.PatchActionsItem(itemUid, actions);
            }

        }

        #endregion

        #region Ruins

        public void ImportRuins()
        {
            var jsonApiResult = MyHordesApiRepository.GetRuins();
            var jsonRuins = Mapper.Map<List<MyHordesOptimizerRuin>>(jsonApiResult);

            var codeResult = MyHordesCodeRepository.GetRuins();
            var codeRuins = Mapper.Map<List<MyHordesOptimizerRuin>>(codeResult);

            var items = MyHordesOptimizerRepository.GetItems();

            foreach (var ruin in jsonRuins)
            {
                var miror = codeRuins.FirstOrDefault(x => x.Img == ruin.Img);
                var codeRuin = codeResult.Values.FirstOrDefault(x => x.Icon == ruin.Img);
                if (miror != null)
                {
                    var totalWeight = 0;
                    foreach (var drop in codeRuin.Drops)
                    {
                        totalWeight += drop.Value;
                        var itemKey = drop.Key.Remove(drop.Key.Length - 4); // On retire le _#00
                        var item = items.FirstOrDefault(x => x.Uid == itemKey);
                        miror.Drops.Add(new ItemResult()
                        {
                            Item = item,
                            Weight = drop.Value
                        });
                    }
                    miror.Drops.ForEach(x => x.Probability = (double)x.Weight / totalWeight);
                    ruin.HydrateMyHordesCodeValues(miror);
                }
            }

            // Enregistrer dans firebase
            MyHordesOptimizerRepository.PatchRuins(jsonRuins);
        }

        #endregion

        #region Categories

        public async Task ImportCategoriesAsync()
        {
            var codeResult = MyHordesCodeRepository.GetCategories();
            var categories = Mapper.Map<List<CategoryModel>>(codeResult);

            // Traductions
            var ymlDeserializer = new DeserializerBuilder()
                .Build();
            var ymlFr = await WebApiRepository.Get(url: TranslationsConfiguration.ItemFrUrl).Content.ReadAsStringAsync();
            var ymlEn = await WebApiRepository.Get(url: TranslationsConfiguration.ItemEnUrl).Content.ReadAsStringAsync();
            var ymlEs = await WebApiRepository.Get(url: TranslationsConfiguration.ItemEsUrl).Content.ReadAsStringAsync();

            var frenchTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlFr);
            var englishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEn);
            var spanishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEs);
            foreach (var category in categories)
            {
                category.LabelFr = frenchTrads[category.LabelDe];
                category.LabelEn = englishTrads[category.LabelDe];
                category.LabelEs = spanishTrads[category.LabelDe];
            }

            MyHordesOptimizerRepository.PatchCategories(categories);
        }

        #endregion
    }
}
