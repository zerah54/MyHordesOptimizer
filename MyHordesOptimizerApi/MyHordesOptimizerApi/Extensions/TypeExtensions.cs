﻿using System;
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
    }
}
