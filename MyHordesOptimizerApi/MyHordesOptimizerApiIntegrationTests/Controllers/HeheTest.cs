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

        #endregion
    }
}
