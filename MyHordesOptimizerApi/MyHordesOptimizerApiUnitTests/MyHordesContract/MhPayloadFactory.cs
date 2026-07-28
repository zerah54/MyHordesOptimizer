using Newtonsoft.Json.Linq;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Fabrique une charge JSON plausible pour un appel donné, en croisant les chemins demandés dans
    /// sa chaîne <c>fields=</c> avec l'arbre de types du DTO qui doit la recevoir.
    /// </summary>
    /// <remarks>
    /// Sert au test d'aller-retour : le validateur prouve qu'un champ demandé A une propriété, cette
    /// fabrique et l'inspecteur prouvent que la propriété REÇOIT la valeur. C'est là que se cachent
    /// les erreurs de forme — une liste typée en objet, un dictionnaire typé en liste — qu'aucune
    /// vérification de nom ne peut attraper.
    /// </remarks>
    public static class MhPayloadFactory
    {
        private const int _maxDepth = 8;

        public static JObject Build(MhCall call)
            => BuildObject(call.DtoType, SurllParser.Parse(call.Fields), depth: 0);

        private static JObject BuildObject(Type type, IReadOnlyList<SurllField> fields, int depth)
        {
            var json = new JObject();
            foreach (var field in fields)
            {
                var member = DtoReflection.FindMember(type, field.Name);
                if (member == null)
                {
                    // Chemin sans propriété : c'est le test de cohérence qui le signale, pas celui-ci.
                    continue;
                }
                json[field.Name] = BuildValue(DtoReflection.MemberType(member), field.Fields, depth + 1);
            }
            return json;
        }

        /// <summary>Tous les membres d'un type, pour un champ demandé NU : MyHordes renvoie alors son jeu par défaut.</summary>
        private static JObject BuildObjectFromAllMembers(Type type, int depth)
        {
            var json = new JObject();
            foreach (var member in DtoReflection.Members(type))
            {
                var name = DtoReflection.JsonName(member);
                if (name == null)
                {
                    continue;
                }
                json[name] = BuildValue(DtoReflection.MemberType(member), Array.Empty<SurllField>(), depth + 1);
            }
            return json;
        }

        private static JToken BuildValue(Type declared, IReadOnlyList<SurllField> subFields, int depth)
        {
            if (depth > _maxDepth)
            {
                return JValue.CreateNull();
            }

            var core = Nullable.GetUnderlyingType(declared) ?? declared;

            if (core == typeof(string))
            {
                return new JValue("valeur");
            }
            if (core == typeof(int) || core == typeof(long))
            {
                return new JValue(1);
            }
            if (core == typeof(double) || core == typeof(float) || core == typeof(decimal))
            {
                return new JValue(1.5);
            }
            if (core == typeof(bool))
            {
                return new JValue(true);
            }

            if (DtoReflection.IsStringKeyedDictionary(core))
            {
                var valueType = core.GetGenericArguments()[1];
                var dictionary = new JObject();
                if (valueType == typeof(string))
                {
                    // Un libellé multilingue : MyHordes renvoie les quatre langues demandées.
                    foreach (var language in new[] { "fr", "es", "en", "de" })
                    {
                        dictionary[language] = new JValue($"libellé {language}");
                    }
                }
                else
                {
                    dictionary["1"] = BuildValue(valueType, subFields, depth + 1);
                }
                return dictionary;
            }

            if (DtoReflection.IsCollection(core))
            {
                var itemType = core.GetGenericArguments()[^1];
                // Un seul élément suffit : on vérifie la forme, pas la cardinalité.
                return new JArray(BuildValue(itemType, subFields, depth + 1));
            }

            if (DtoReflection.IsComplex(core))
            {
                return subFields.Count > 0
                    ? BuildObject(core, subFields, depth)
                    : BuildObjectFromAllMembers(core, depth);
            }

            return JValue.CreateNull();
        }
    }
}
