using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Data.Buildings;
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
        /// inconnue). JobDetails reste à vide, la BDD ne le stocke pas : l'addon, qui lit
        /// JobDetails.Uid (métier du joueur), doit traiter un métier vide comme inconnu.
        /// </summary>
        SimpleMeDto? BuildSimpleMeFromDbByUserKey(string userKey);

        /// <summary>
        /// Vérifie que userKey appartient bien à userId, sans exiger de JWT. Réutilise le cache
        /// hash(userKey) → userId déjà alimenté par tout login/sync réussi (voir RememberUserKeyToUserId) :
        /// clé connue → comparaison directe, zéro appel MyHordes. Clé inconnue → un seul appel
        /// GetMeIdentity() pour amorcer le cache, jamais revu ensuite pour cette clé.
        /// </summary>
        bool VerifyUserKeyOwnership(string userKey, int userId);

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

        /// <summary>Niveaux de maison et améliorations, statiques (fichiers de l'extracteur).</summary>
        HomeReferentialDto GetHomeReferential();

        /// <summary>Évolutions des chantiers par uid, statiques (Data/Buildings/upgrades.json de l'extracteur).</summary>
        Dictionary<string, BuildingUpgradeCodeModel> GetBuildingUpgrades();
        MyHordesOptimizerMapDto GetMap(int townId);
        IEnumerable<MyHordesOptimizerMapDigDto> GetMapDigs(int townId);
        List<MyHordesOptimizerMapDigDto> CreateOrUpdateMapDigs(int townId, int userId, List<MyHordesOptimizerMapDigDto> requests);
        void DeleteMapDigs(int idCell, int diggerId, int day);
        IEnumerable<MyHordesOptimizerMapUpdateDto> GetMapUpdates(int townId);
    }
}
