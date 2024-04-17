using Microsoft.EntityFrameworkCore;
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
            optionsBuilder.UseMySql(Configuration.ConnectionString, ServerVersion.AutoDetect(Configuration.ConnectionString));
            optionsBuilder.EnableSensitiveDataLogging(true);
            optionsBuilder.EnableDetailedErrors(true);
            optionsBuilder.UseLoggerFactory(LoggerFactory);
            base.OnConfiguring(optionsBuilder);
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
                .Include(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdTownNavigation)
                    .ThenInclude(town => town.TownCitizenBaths)
                        .ThenInclude(townCitizenBath => townCitizenBath.IdLastUpdateInfoNavigation)
                            .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation);
        }
    }
}
