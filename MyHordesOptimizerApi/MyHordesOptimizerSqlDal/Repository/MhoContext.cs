using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi
{
    public partial class MhoContext : DbContext
    {
        protected IMyHordesOptimizerSqlConfiguration Configuration { get; private set; }
        protected ILoggerFactory LoggerFactory { get; private set; }

        public MhoContext(DbContextOptions<MhoContext> options, IMyHordesOptimizerSqlConfiguration configuration, ILoggerFactory loggerFactory)
            : base(options)
        {
            Configuration = configuration;
            LoggerFactory = loggerFactory;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseMySql(Configuration.ConnectionString, ServerVersion.AutoDetect(Configuration.ConnectionString), (mysqlOptions) =>
            {
            });
            optionsBuilder.EnableSensitiveDataLogging(false);
            optionsBuilder.EnableDetailedErrors(true);
            optionsBuilder.UseLoggerFactory(LoggerFactory);
            optionsBuilder.ConfigureWarnings(builder => builder.Ignore(RelationalEventId.MultipleCollectionIncludeWarning));
            base.OnConfiguring(optionsBuilder);
        }

        // Le client (front/addon) envoie toujours le mapId de la ville, jamais le townId stable
        // attribué par l'import global. Si la ville a été migrée vers ce townId, MapId conserve
        // l'ancien mapId d'origine : on retrouve alors la vraie ligne. Sinon (pas encore migrée),
        // la ligne provisoire vit sous IdTown = -mapId (cf. TownMappingProfile) : un townId réel
        // étant toujours positif, ça exclut structurellement toute collision entre les deux espaces.
        public int ResolveTownId(int townId)
        {
            var resolved = this.Towns
                .Where(t => t.MapId == townId)
                .Select(t => (int?)t.IdTown)
                .FirstOrDefault();
            return resolved ?? -townId;
        }

        public IQueryable<TownCitizen> GetTownCitizen(int townId)
        {
            return this.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId)
                .Include(townCitizen => townCitizen.IdBagNavigation)
                    .ThenInclude(bag => bag.BagItems)
                        .ThenInclude(bagItem => bagItem.IdItemNavigation)
                .Include(townCitizen => townCitizen.IdBagNavigation)
                    .ThenInclude(bagItem => bagItem.IdLastUpdateInfoNavigation)
                        .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoGhoulStatusNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoHeroicActionNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoHomeNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoStatusNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateChamanicNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdTownNavigation)
                    .ThenInclude(town => town.TownCitizenBaths)
                        .ThenInclude(townCitizenBath => townCitizenBath.IdLastUpdateInfoNavigation)
                            .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation);
        }
    }
}
