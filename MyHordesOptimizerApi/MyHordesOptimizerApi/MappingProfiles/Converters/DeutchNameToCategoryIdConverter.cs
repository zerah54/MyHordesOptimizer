using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Converters
{
    public class DeutchNameToCategoryIdConverter : IValueConverter<string, int?>
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        private List<Category> _categories;

        public DeutchNameToCategoryIdConverter(IServiceScopeFactory serviceScopeFactory)
        {
            ServiceScopeFactory = serviceScopeFactory;
            using var scope = ServiceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
            _categories = dbContext.Categories.ToList();
        }

        public int? Convert(string sourceMember, ResolutionContext context)
        {
            var category = _categories.First(cat => cat.LabelDe == sourceMember);
            return category.IdCategory;
        }
    }
}
