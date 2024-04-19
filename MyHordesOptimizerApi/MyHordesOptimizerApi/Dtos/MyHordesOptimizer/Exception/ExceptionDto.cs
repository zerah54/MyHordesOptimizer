using MyHordesOptimizerApi.Exceptions;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Exception
{
    public class ExceptionDto
    {
        public string Message { get; set; }
        public string ErrorType { get; set; }
        public string ErrorCode { get; set; }
    }
}
