using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Contract
{
    /// <summary>
    /// Le champ existe dans le contrat de l'entité mais n'est jamais émis par les endpoints
    /// listés, qui le filtrent. Le demander là est inutile et trompeur.
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
    public sealed class MhUnavailableOnAttribute : Attribute
    {
        public MhUnavailableOnAttribute(params string[] endpoints)
        {
            Endpoints = endpoints;
        }

        public IReadOnlyList<string> Endpoints { get; }
    }
}
