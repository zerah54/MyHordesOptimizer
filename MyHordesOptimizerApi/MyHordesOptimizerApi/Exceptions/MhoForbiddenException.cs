using System;

namespace MyHordesOptimizerApi.Exceptions
{
    /// <summary>
    /// L'utilisateur courant n'a pas le droit d'écrire sur la ressource visée : ville dont il n'est pas
    /// citoyen, ou identifiant (partie, citoyen, consigne, sac) appartenant à une autre ville. Traduite en
    /// 403 par ApiExceptionFilter ; côté hub SignalR, le client reçoit l'erreur d'invocation générique.
    /// </summary>
    public class MhoForbiddenException : Exception
    {
        public MhoForbiddenException(string? message) : base(message)
        {
        }
    }
}
