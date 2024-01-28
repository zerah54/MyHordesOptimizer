using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

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
            optionsBuilder.UseMySQL(Configuration.ConnectionString);
            optionsBuilder.EnableSensitiveDataLogging(true);
            optionsBuilder.EnableDetailedErrors(true);
            optionsBuilder.UseLoggerFactory(LoggerFactory);
            base.OnConfiguring(optionsBuilder);
        }
    }
}
