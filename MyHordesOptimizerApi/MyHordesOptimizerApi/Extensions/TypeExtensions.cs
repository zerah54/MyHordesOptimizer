using MyHordesOptimizerApi.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Reflection;

namespace MyHordesOptimizerApi.Extensions
{
    public static class TypeExtensions
    {
        public static Dictionary<string, Func<TModel, object>> GetPropertiesInvoker<TModel>(this Type type)
        {
            var dico = new Dictionary<string, Func<TModel, object>>();
            foreach (var propertie in type.GetProperties())
            {
                var attr = propertie.GetCustomAttributes().FirstOrDefault(attr => attr is ColumnAttribute) as ColumnAttribute;
                if(attr != null)
                {
                    dico.Add(attr.Name, x => propertie.GetValue(x));
                }
                else
                {
                    dico.Add(propertie.Name, x => propertie.GetValue(x));
                }
            }
            return dico;
        }

        public static void UpdateNoNullProperties<T>(this T objectToUpdate, T objectToCopy)
        {
            foreach (var toProp in typeof(T).GetProperties())
            {
                var fromProp = typeof(T).GetProperty(toProp.Name);
                var toValue = fromProp.GetValue(objectToCopy, null);
                if (toValue != null)
                {
                    toProp.SetValue(objectToUpdate, toValue, null);
                }
            }
        }

        public static void UpdateAllProperties<T>(this T objectToUpdate, T objectToCopy)
        {
            foreach (var toProp in typeof(T).GetProperties())
            {
                var fromProp = typeof(T).GetProperty(toProp.Name);
                var toValue = fromProp.GetValue(objectToCopy, null);
                toProp.SetValue(objectToUpdate, toValue, null);
            }
        }
    }
}
