using System;
using System.ComponentModel;
using System.Reflection;

namespace MyHordesOptimizerApi.Extensions
{
    public static class EnumExtensions
    {
        /// <summary>
        /// Retourne l'attribut description de l'enum en fonction de sa valeur
        /// Lève une exception ArgumentException si l'enum n'est pas reconnu
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="enumerationValue"></param>
        /// <returns></returns>
        public static string GetDescription<T>(this T enumerationValue) where T : struct
        {
            Type type = enumerationValue.GetType();
            if (!type.IsEnum)
            {
                throw new ArgumentException("EnumerationValue must be of Enum type", "enumerationValue");
            }
            string name = Enum.GetName(type, enumerationValue);
            if (name != null)
            {
                FieldInfo field = type.GetField(name);
                if (field != null)
                {
                    DescriptionAttribute attr =
                           Attribute.GetCustomAttribute(field,
                             typeof(DescriptionAttribute)) as DescriptionAttribute;
                    if (attr != null)
                    {
                        return attr.Description;
                    }
                }
            }
            return enumerationValue.ToString();
        }
    }
}
