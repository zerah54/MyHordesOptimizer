global using Xunit;

// Toutes les classes de test partagent une seule base MySQL locale (voir appsettings.Development.json).
// La parallélisation xUnit par défaut (une collection par classe, exécutées en parallèle) provoque des
// deadlocks MySQL et des interférences de données entre classes. Exécution séquentielle nécessaire.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
