using AutoMapper;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Converters
{
    public class DeutchNameToCategoryIdConverter : IValueConverter<string, int>
    {
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; set; }
        private List<CategoryModel> _categories;

        public DeutchNameToCategoryIdConverter(IMyHordesOptimizerRepository myHordesOptimizerRepository)
        {
            MyHordesOptimizerRepository = myHordesOptimizerRepository;
            _categories = MyHordesOptimizerRepository.GetCategories().ToList();
        }

        public int Convert(string sourceMember, ResolutionContext context)
        {
            var category = _categories.First(cat => cat.LabelDe == sourceMember);
            return category.IdCategory;
        }
    }
}
