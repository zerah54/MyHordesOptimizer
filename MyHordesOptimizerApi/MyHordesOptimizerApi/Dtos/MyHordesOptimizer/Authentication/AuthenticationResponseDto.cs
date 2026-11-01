namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Authentication
{
    public class AuthenticationResponseDto
    {
        public TokenDto Token { get; set; } = null!;
        public SimpleMeDto SimpleMe { get; set; } = null!;
    }
}
