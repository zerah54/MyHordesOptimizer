using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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
                if (attr != null)
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

        public static void UpdateAllButKeysProperties<T>(this T objectToUpdate, T objectToCopy, bool ignoreNull = false)
        {
            foreach (var toProp in typeof(T).GetProperties())
            {
                var fromProp = typeof(T).GetProperty(toProp.Name);
                var keyAttr = fromProp.GetCustomAttribute<KeyAttribute>();
                var inverseAttr = fromProp.GetCustomAttribute<InversePropertyAttribute>();
                var isInversedPropKey = false;
                if (inverseAttr != null)
                {
                    var foreignKeys = fromProp.GetCustomAttributes<ForeignKeyAttribute>();
                    foreach(var foreignKey in foreignKeys)
                    {
                        var foreignKeyProp = typeof(T).GetProperty(foreignKey.Name);
                        if(foreignKeyProp != null)
                        {
                            if (foreignKeyProp.GetCustomAttribute<KeyAttribute>() != null)
                            {
                                isInversedPropKey = true; break;
                            }
                        }                     
                    }
                  
                }
                if (keyAttr == null && !isInversedPropKey) // Si c'est pas une key ou si c'est une pas une propriété de navigation d'une foreignkey, on maj la propertie
                {
                    var toValue = fromProp.GetValue(objectToCopy, null);
                    if(!(ignoreNull && toValue == null))
                    {
                        toProp.SetValue(objectToUpdate, toValue, null);
                    }                
                }
            }
        }
    }
}
