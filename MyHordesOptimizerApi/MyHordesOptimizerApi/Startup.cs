using AutoMapper;
using Common.Core.Repository.Impl;
using Common.Core.Repository.Interfaces;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MyHordesOptimizerApi.Configuration.Impl;
using MyHordesOptimizerApi.Configuration.Impl.ExternalTools;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Configuration.Interfaces.MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.MappingProfiles;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Impl;
using MyHordesOptimizerApi.Repository.Impl.ExternalTools;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.Import;
using MyHordesOptimizerApi.Services.Impl.Translations;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using System.Net.Http;
using System.Reflection;

namespace MyHordesOptimizerApi
{
    public class Startup
    {
        public Startup(IWebHostEnvironment env)
        {
            var builder = new ConfigurationBuilder()
               .SetBasePath(env.ContentRootPath)
               .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
               .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
               .AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.AddHttpClient();
            services.AddHttpClient(nameof(GestHordesRepository)).ConfigurePrimaryHttpMessageHandler(() =>
            {
                return new HttpClientHandler()
                {
                    UseCookies = true,
                };
            });
            // services.AddSingleton(BuildAutoMapper());
            services.AddAutoMapper(Assembly.GetAssembly(this.GetType()));

            // Providers
            services.AddScoped<IUserInfoProvider, UserInfoProvider>();

            // Configuration
            services.AddSingleton<IMyHordesApiConfiguration, MyHordesApiConfiguration>();
            services.AddSingleton<IGestHordesConfiguration, GestHordesConfiguration>();
            services.AddSingleton<IBigBrothHordesConfiguration, BigBrothHordesConfiguration>();
            services.AddSingleton<IFataMorganaConfiguration, FataMorganaConfiguration>();
            services.AddSingleton<IMyHordesTranslationsConfiguration, MyHordesTranslationsConfiguration>();

            services.AddSingleton<IMyHordesOptimizerFirebaseConfiguration, MyHordesOptimizerFirebaseConfiguration>();

            // Repository
            services.AddSingleton<IWebApiRepository, SimpleWebApiRepository>();
            services.AddSingleton<IMyHordesCodeRepository, MyHordesCodeRepository>();

            services.AddScoped<IMyHordesJsonApiRepository, MyHordesJsonApiRepository>();
            services.AddScoped<IMyHordesXmlApiRepository, MyHordesXmlApiRepository>();

            services.AddScoped<IBigBrothHordesRepository, BigBrothHordesRepository>();
            services.AddScoped<IFataMorganaRepository, FataMorganaRepository>();
            services.AddScoped<IGestHordesRepository, GestHordesRepository>();

            services.AddScoped<IMyHordesOptimizerFirebaseRepository, MyHordesOptimizerFirebaseRepository>();

            // Services
            services.AddScoped<IMyHordesFetcherService, MyHordesFetcherService>();
            services.AddScoped<IExternalToolsService, ExternalToolsService>();
            services.AddScoped<IMyHordesImportService, MyHordesImportService>();
            services.AddScoped<IWishListService, WishListService>();
            services.AddSingleton<ITranslationService, TranslationService>();
            services.AddSingleton<IMyHordesRuineService, MyHordesRuineService>();


            services.AddApplicationInsightsTelemetry();
        }

        protected IMapper BuildAutoMapper()
        {
            var config = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MyHordesMappingProfiles>();
            });

            var mapper = new Mapper(config);
            mapper.ConfigurationProvider.AssertConfigurationIsValid();

            return mapper;
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
