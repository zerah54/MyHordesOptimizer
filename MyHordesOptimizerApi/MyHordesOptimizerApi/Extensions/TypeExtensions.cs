using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Extensions
{
    public static class TypeExtensions
    {
        public static Dictionary<string, Func<TModel, object>> GetPropertiesInvoker<TModel>(this Type type)
        {
            var dico = new Dictionary<string, Func<TModel, object>>();
            foreach (var propertie in type.GetProperties())
            {
                dico.Add(propertie.Name, x => propertie.GetValue(x));
            }
            return dico;
        }
    }
}
