using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    public class HeheTest : ControllerTestBase
    {
        public HeheTest(MyHordesOptimizerApplicationFactory factory) : base(factory)
        {
        }

        #region Lifecycle Methods

        public override Task DisposeAsync()
        {
            return Task.CompletedTask;
        }

        public override Task InitializeAsync()
        {
            return Task.CompletedTask;
        }

        #endregion

        #region Tests

        [Fact]
        public async Task GetItem_WithTown()
        {
            using var scope = Factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();

            var items = dbContext.Items
                .Include(item => item.IdCategoryNavigation)
                .Include(item => item.PropertyNames)
                .Include(item => item.ActionNames)
                .Include(item => item.RecipeItemComponents)
                    .ThenInclude(recipe => recipe.RecipeNameNavigation)
                    .ThenInclude(recipe => recipe.RecipeItemResults)
                .Include(item => item.RecipeItemResults)
                .Include(item => item.TownBankItems.Where(bankItem => bankItem.IdTown == 3410))
                .Include(item => item.TownWishListItems.Where(wishListItem => wishListItem.IdTown == 3410))
                .ToList();
            var hihi = "hehe";
        }

        [Fact]
        public async Task TestConcurencyLimit()
        {
            var apiCalls = Enumerable.Range(0, 20)
            .Select(_ =>
            {
                //Client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cG4iOiI2MTczIiwidW5pcXVlX25hbWUiOiJSZU5hY0thZGRpZSIsIk1IT19Ub3duIjoie1wiVG93bklkXCI6Mzg4NSxcIlRvd25YXCI6OCxcIlRvd25ZXCI6OCxcIlRvd25NYXhYXCI6MjUsXCJUb3duTWF4WVwiOjI1LFwiSXNEZXZhc3RlXCI6ZmFsc2UsXCJUb3duVHlwZVwiOlwiUkVcIixcIkRheVwiOjZ9IiwiTUhPX1VzZXJLZXkiOiIxOGE3MGVkYzdkZmY1NjYyZGY0OTRjODJmNzcxOGIxZCIsIm5iZiI6MTcxNDQzMjc2NywiZXhwIjoxNzE0NDM2MzY3LCJpYXQiOjE3MTQ0MzI3NjcsImlzcyI6Imh0dHBzOi8vYXBpLm15aG9yZGVzb3B0aW1pemVyLmZyIiwiYXVkIjoiand0QXVkaWVuY2UifQ.wZQAPrC4sz5Dldu-5ZYrzwsz3vRLiU_J5TwqCZNnTZY");
                return Client.GetAsync("Parameters/Parameters");
            });

            // Act
            var results = await Task.WhenAll(apiCalls);
        }

        #endregion
    }
}
