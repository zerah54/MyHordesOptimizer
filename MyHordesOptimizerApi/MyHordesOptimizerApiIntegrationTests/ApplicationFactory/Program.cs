using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Impl;
using MyHordesOptimizerApiIntegrationTests.Configuration;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddTransient<IMyHordesOptimizerSqlConfiguration, MyHordesOptimizerSqlConfiguration>();
builder.Services.AddDbContext<MhoContext>(ServiceLifetime.Transient);

var app = builder.Build();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }