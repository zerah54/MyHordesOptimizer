using AutoMapper;
using Common.Core.Repository.Impl;
using Common.Core.Repository.Interfaces;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MyHordesOptimizerApi.Configuration.Impl;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.MappingProfiles;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Impl;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;

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
            services.AddSingleton(BuildAutoMapper());
            // Providers
            services.AddScoped<IUserKeyProvider, UserKeyProvider>();
            // Configuration
            services.AddSingleton<IMyHordesApiConfiguration, MyHordesApiConfiguration>();
            // Repository
            services.AddSingleton<IWebApiRepository, SimpleWebApiRepository>();
            services.AddScoped<IMyHordesJsonApiRepository, MyHordesJsonApiRepository>();
            services.AddScoped<IMyHordesXmlApiRepository, MyHordesXmlApiRepository>();
            // Services
            services.AddScoped<IMyHordesFetcherService, MyHordesFetcherService>();


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
