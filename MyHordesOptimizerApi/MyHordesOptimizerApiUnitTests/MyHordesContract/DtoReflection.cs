using System.Collections;
using System.Reflection;
using Newtonsoft.Json;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Réflexion partagée sur les DTO MyHordes : résolution d'un nom de champ JSON vers son membre,
    /// et dépliage des enveloppes qui ne comptent pas pour un chemin <c>fields=</c>.
    /// </summary>
    public static class DtoReflection
    {
        private const BindingFlags _members = BindingFlags.Public | BindingFlags.Instance;

        /// <summary>Propriétés ET champs publics : certains DTO exposent encore des champs nus.</summary>
        public static IEnumerable<MemberInfo> Members(Type type)
            => type.GetProperties(_members).Cast<MemberInfo>().Concat(type.GetFields(_members));

        public static MemberInfo? FindMember(Type type, string jsonName)
            => Members(type).FirstOrDefault(member =>
                string.Equals(JsonName(member), jsonName, StringComparison.Ordinal));

        public static string? JsonName(MemberInfo member)
            => member.GetCustomAttribute<JsonPropertyAttribute>()?.PropertyName;

        public static Type MemberType(MemberInfo member) => member switch
        {
            PropertyInfo property => property.PropertyType,
            FieldInfo fieldInfo => fieldInfo.FieldType,
            _ => throw new InvalidOperationException($"Membre inattendu : {member.MemberType}")
        };

        public static object? ReadValue(MemberInfo member, object instance) => member switch
        {
            PropertyInfo property => property.GetValue(instance),
            FieldInfo fieldInfo => fieldInfo.GetValue(instance),
            _ => throw new InvalidOperationException($"Membre inattendu : {member.MemberType}")
        };

        /// <summary>
        /// Retire les enveloppes transparentes pour un chemin <c>fields=</c> : nullable,
        /// <c>List&lt;T&gt;</c>, et <c>IDictionary&lt;string, T&gt;</c> dont on garde la valeur.
        /// </summary>
        public static Type Unwrap(Type type)
        {
            var underlying = Nullable.GetUnderlyingType(type);
            if (underlying != null)
            {
                return underlying;
            }

            if (type == typeof(string) || !type.IsGenericType)
            {
                return type;
            }

            if (!typeof(IEnumerable).IsAssignableFrom(type))
            {
                return type;
            }

            return Unwrap(type.GetGenericArguments()[^1]);
        }

        /// <summary>Un type porté par un DTO MyHordes, donc lui-même parcourable.</summary>
        public static bool IsComplex(Type type)
            => type.IsClass && type != typeof(string)
                            && type.Namespace?.StartsWith("MyHordesOptimizerApi") == true;

        public static bool IsCollection(Type type)
            => type != typeof(string)
               && type.IsGenericType
               && typeof(IEnumerable).IsAssignableFrom(type);

        public static bool IsStringKeyedDictionary(Type type)
            => type.IsGenericType
               && typeof(IEnumerable).IsAssignableFrom(type)
               && type.GetGenericArguments().Length == 2
               && type.GetGenericArguments()[0] == typeof(string);
    }
}
