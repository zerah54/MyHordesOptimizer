using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using System.Collections.Generic;
using System.Threading.Tasks;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IMyHordesFetcherService
    {
        IEnumerable<ItemDto> GetItems(int? townId);
        IEnumerable<string> GetItemUidsWithCitizenStateImpact();
        Task<SimpleMeDto> GetSimpleMeAsync();

        /// <summary>
        /// Construit un SimpleMeDto de secours depuis la BDD, sans appel MyHordes. Utilisé quand
        /// GetSimpleMeAsync échoue sur 429/503. Résolution SERVEUR uniquement : le userId n'est jamais
        /// pris en paramètre depuis le client (voir C2, revue finale du chantier cycle de vie de
        /// session) — il est retrouvé depuis le hash du userKey SOUMIS dans la requête courante, via
        /// une table alimentée à chaque appel réussi de GetSimpleMeAsync. Renvoie null si ce userKey
        /// n'a encore jamais été vu par un appel réussi (ex. premier appel de la session, ou clé
        /// inconnue). JobDetails (libellés localisés du métier) reste à vide, la BDD ne les stocke
        /// pas — vérifié sans impact, le front ne les lit nulle part (me.class.ts ne mappe pas
        /// jobDetails).
        /// </summary>
        SimpleMeDto BuildSimpleMeFromDbByUserKey(string userKey);
        IEnumerable<HeroSkillDto> GetHeroSkills();
        IEnumerable<CauseOfDeathDto> GetCausesOfDeath();
        IEnumerable<CleanUpTypeDto> GetCleanUpTypes();
        IEnumerable<ItemRecipeDto> GetRecipes();
        BankLastUpdateDto GetBank();
        BankLastUpdateDto GetBank(int townId);
        Task<bool> ImportUserPictosAsync(int userId);
        CitizensLastUpdateDto GetCitizens(int townId);
        IEnumerable<MyHordesOptimizerRuinDto> GetRuins(int? townId);
        IEnumerable<BuildingDto> GetBuildings();
        MyHordesOptimizerMapDto GetMap(int townId);
        IEnumerable<MyHordesOptimizerMapDigDto> GetMapDigs(int townId);
        List<MyHordesOptimizerMapDigDto> CreateOrUpdateMapDigs(int townId, int userId, List<MyHordesOptimizerMapDigDto> requests);
        void DeleteMapDigs(int idCell, int diggerId, int day);
        IEnumerable<MyHordesOptimizerMapUpdateDto> GetMapUpdates(int townId);
    }
}
