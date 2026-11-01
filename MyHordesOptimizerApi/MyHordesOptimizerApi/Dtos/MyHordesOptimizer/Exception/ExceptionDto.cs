using MyHordesOptimizerApi.Exceptions;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Exception
{
    public class ExceptionDto
    {
        public string Message { get; set; } = null!;
        public string ErrorType { get; set; } = null!;
        public string ErrorCode { get; set; } = null!;
    }
}
