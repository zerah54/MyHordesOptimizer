using MyHordesOptimizerApi.Dtos.MyHordes.Contract;
using System.Reflection;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Confronte une chaîne <c>fields=</c> à l'arbre de types du DTO censé la recevoir.
    /// </summary>
    /// <remarks>
    /// La validation est pilotée par les chemins demandés, jamais par un parcours du type : une
    /// chaîne <c>fields=</c> est finie par construction, donc la résolution termine toujours, même
    /// si le graphe de types contient des cycles. Seul <see cref="UnrequestedProperties"/>, qui
    /// énumère le graphe complet, doit se prémunir d'une récursion infinie.
    /// </remarks>
    public static class DtoFieldsValidator
    {
        public static IReadOnlyList<string> Validate(MhCall call)
        {
            var violations = new List<string>();
            Walk(call.DtoType, SurllParser.Parse(call.Fields), prefix: string.Empty, call, violations);
            return violations;
        }

        public static IReadOnlyList<string> UnrequestedProperties(MhCall call)
        {
            var requested = new HashSet<string>(StringComparer.Ordinal);
            Collect(SurllParser.Parse(call.Fields), prefix: string.Empty, requested);

            // Un champ demandé NU reçoit le jeu de champs PAR DÉFAUT de MyHordes, propre à chaque
            // entité et que nous ne modélisons pas (ex. `resources` renvoie `amount` et `rsc`).
            // Ses sous-propriétés ne sont donc pas « non demandées » : on cesse simplement de
            // pouvoir le dire, et les annoncer comme absentes serait faux.
            var bareRequested = requested
                .Where(path => !requested.Any(other => other.StartsWith(path + ".", StringComparison.Ordinal)))
                .ToList();

            var all = new List<string>();
            Enumerate(call.DtoType, prefix: string.Empty, all, new HashSet<Type>());

            return all
                .Where(path => !requested.Contains(path))
                .Where(path => !bareRequested.Any(bare =>
                    path.StartsWith(bare + ".", StringComparison.Ordinal)))
                // On ne remonte que le PREMIER niveau non demandé : si `map` n'est pas demandé,
                // savoir que `map` manque suffit — énumérer tout son sous-arbre noierait le rapport
                // sous des centaines de lignes qui n'apprennent rien de plus.
                .Where(path => IsParentRequested(path, requested))
                .ToList();
        }

        private static bool IsParentRequested(string path, HashSet<string> requested)
        {
            var lastSeparator = path.LastIndexOf('.');
            return lastSeparator < 0 || requested.Contains(path[..lastSeparator]);
        }

        private static void Walk(Type type, IReadOnlyList<SurllField> fields, string prefix,
            MhCall call, List<string> violations)
        {
            foreach (var field in fields)
            {
                var path = prefix.Length == 0 ? field.Name : $"{prefix}.{field.Name}";
                var member = DtoReflection.FindMember(type, field.Name);

                if (member == null)
                {
                    violations.Add($"[{call.Name}] champ demandé absent du DTO {type.Name} : {path}");
                    continue;
                }

                var unavailable = member.GetCustomAttribute<MhUnavailableOnAttribute>();
                if (unavailable != null && unavailable.Endpoints.Contains(call.Endpoint))
                {
                    violations.Add($"[{call.Name}] {path} n'est jamais émis par l'endpoint " +
                                   $"« {call.Endpoint} » : ne pas le demander");
                }

                if (field.Fields.Count == 0)
                {
                    continue;
                }

                if (member.GetCustomAttribute<MhBareAttribute>() != null)
                {
                    violations.Add($"[{call.Name}] {path} doit être demandé nu, sans sous-champs " +
                                   "(MyHordes renverrait un objet vide)");
                    continue;
                }

                Walk(DtoReflection.Unwrap(DtoReflection.MemberType(member)), field.Fields, path, call, violations);
            }
        }

        private static void Collect(IReadOnlyList<SurllField> fields, string prefix, HashSet<string> into)
        {
            foreach (var field in fields)
            {
                var path = prefix.Length == 0 ? field.Name : $"{prefix}.{field.Name}";
                into.Add(path);
                Collect(field.Fields, path, into);
            }
        }

        private static void Enumerate(Type type, string prefix, List<string> into, HashSet<Type> seen)
        {
            if (!seen.Add(type))
            {
                return;
            }

            foreach (var member in DtoReflection.Members(type))
            {
                var name = DtoReflection.JsonName(member);
                if (name == null)
                {
                    continue;
                }

                var path = prefix.Length == 0 ? name : $"{prefix}.{name}";
                into.Add(path);

                var memberType = DtoReflection.Unwrap(DtoReflection.MemberType(member));
                if (DtoReflection.IsComplex(memberType))
                {
                    Enumerate(memberType, path, into, seen);
                }
            }

            seen.Remove(type);
        }

    }
}
