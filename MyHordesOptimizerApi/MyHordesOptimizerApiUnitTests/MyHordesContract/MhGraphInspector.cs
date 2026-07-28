using System.Collections;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Parcourt un graphe d'objets désérialisé le long des chemins demandés, et remonte ceux dont la
    /// valeur n'a PAS été matérialisée alors que la charge d'entrée la portait.
    /// </summary>
    public static class MhGraphInspector
    {
        public static IReadOnlyList<string> FindUnmaterialisedPaths(MhCall call, object graph)
        {
            var missing = new List<string>();
            Walk(graph, call.DtoType, SurllParser.Parse(call.Fields), prefix: string.Empty, missing);
            return missing;
        }

        private static void Walk(object? instance, Type type, IReadOnlyList<SurllField> fields,
            string prefix, List<string> missing)
        {
            if (instance == null)
            {
                return;
            }

            foreach (var field in fields)
            {
                var path = prefix.Length == 0 ? field.Name : $"{prefix}.{field.Name}";
                var member = DtoReflection.FindMember(type, field.Name);
                if (member == null)
                {
                    continue;
                }

                var value = DtoReflection.ReadValue(member, instance);
                if (value == null)
                {
                    missing.Add($"{path} — la propriété est restée nulle");
                    continue;
                }

                var declared = DtoReflection.MemberType(member);
                var core = Nullable.GetUnderlyingType(declared) ?? declared;

                if (DtoReflection.IsCollection(core) && core != typeof(string))
                {
                    var element = FirstElement(value);
                    if (element == null)
                    {
                        missing.Add($"{path} — collection vide alors que la charge en portait un élément");
                        continue;
                    }
                    if (field.Fields.Count > 0)
                    {
                        Walk(element, element.GetType(), field.Fields, path, missing);
                    }
                    continue;
                }

                if (field.Fields.Count > 0 && DtoReflection.IsComplex(core))
                {
                    Walk(value, value.GetType(), field.Fields, path, missing);
                }
            }
        }

        /// <summary>
        /// Premier élément d'une collection. Pour un dictionnaire, on veut la VALEUR et non la paire :
        /// c'est elle que porte un chemin <c>fields=</c>.
        /// </summary>
        private static object? FirstElement(object collection)
        {
            if (collection is IDictionary dictionary)
            {
                foreach (var value in dictionary.Values)
                {
                    return value;
                }
                return null;
            }

            if (collection is IEnumerable enumerable)
            {
                foreach (var item in enumerable)
                {
                    return item;
                }
            }
            return null;
        }
    }
}
