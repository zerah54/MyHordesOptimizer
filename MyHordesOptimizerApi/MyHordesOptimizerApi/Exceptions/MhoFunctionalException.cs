using System;

namespace MyHordesOptimizerApi.Exceptions
{
    public class MhoFunctionalException : Exception
    {
        public FunctionErrorCode ErrorCode { get; init; }
        public MhoFunctionalException(string? message, FunctionErrorCode errorCode) : base(message)
        {
            ErrorCode = errorCode;
        }
    }

    public enum FunctionErrorCode
    {
        DeadCitizen
    }
}
