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
using MyHordesOptimizerApi.MappingProfiles;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Impl;
using MyHordesOptimizerApi.Repository.Impl.ExternalTools;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using System.Net.Http;

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
                    UseCookies = false,
                };
            });
            services.AddSingleton(BuildAutoMapper());

            // Providers
            services.AddScoped<IUserKeyProvider, UserKeyProvider>();
            services.AddScoped<IGestHordeCookieProvider, GestHordeCookieProvider>();

            // Configuration
            services.AddSingleton<IMyHordesApiConfiguration, MyHordesApiConfiguration>();
            services.AddSingleton<IGestHordesConfiguration, GestHordesConfiguration>();
            services.AddSingleton<IBigBrothHordesConfiguration, BigBrothHordesConfiguration>();
            services.AddSingleton<IFataMorganaConfiguration, FataMorganaConfiguration>();

            services.AddSingleton<IMyHordesOptimizerFirebaseConfiguration, MyHordesOptimizerFirebaseConfiguration>();

            // Repository
            services.AddSingleton<IWebApiRepository, SimpleWebApiRepository>();

            services.AddScoped<IMyHordesJsonApiRepository, MyHordesJsonApiRepository>();
            services.AddScoped<IMyHordesXmlApiRepository, MyHordesXmlApiRepository>();

            services.AddScoped<IBigBrothHordesRepository, BigBrothHordesRepository>();
            services.AddScoped<IFataMorganaRepository, FataMorganaRepository>();
            services.AddScoped<IGestHordesRepository, GestHordesRepository>();

            services.AddScoped<IMyHordesOptimizerFirebaseRepository, MyHordesOptimizerFirebaseRepository>();

            // Services
            services.AddScoped<IMyHordesFetcherService, MyHordesFetcherService>();
            services.AddScoped<IExternalToolsService, ExternalToolsService>();


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
