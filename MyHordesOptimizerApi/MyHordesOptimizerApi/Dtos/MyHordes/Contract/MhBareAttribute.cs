using System;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Contract
{
    /// <summary>
    /// Le champ doit être demandé NU dans <c>fields=</c>, jamais sous la forme
    /// <c>champ.fields(...)</c>. Côté MyHordes la branche gérant ses sous-champs est commentée :
    /// avec des sous-champs, la réponse contient un objet vide, sans erreur.
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
    public sealed class MhBareAttribute : Attribute
    {
    }
}
