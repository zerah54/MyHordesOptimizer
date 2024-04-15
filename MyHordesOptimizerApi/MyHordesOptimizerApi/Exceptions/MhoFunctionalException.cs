using System;

namespace MyHordesOptimizerApi.Exceptions
{
    public class MhoFunctionalException : Exception
    {
        public MhoFunctionalException(string? message) : base(message)
        {
        }
    }
}
