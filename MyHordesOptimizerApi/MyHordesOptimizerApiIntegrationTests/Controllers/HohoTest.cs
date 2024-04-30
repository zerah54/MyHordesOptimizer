using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    public class HohoTest
    {
        [Fact]
        public async Task TestConcurencyLimit()
        {
            var sw = new Stopwatch();
            sw.Start();
            var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cG4iOiI2MTczIiwidW5pcXVlX25hbWUiOiJSZU5hY0thZGRpZSIsIk1IT19Ub3duIjoie1wiVG93bklkXCI6Mzg4NSxcIlRvd25YXCI6OCxcIlRvd25ZXCI6OCxcIlRvd25NYXhYXCI6MjUsXCJUb3duTWF4WVwiOjI1LFwiSXNEZXZhc3RlXCI6ZmFsc2UsXCJUb3duVHlwZVwiOlwiUkVcIixcIkRheVwiOjZ9IiwiTUhPX1VzZXJLZXkiOiIxOGE3MGVkYzdkZmY1NjYyZGY0OTRjODJmNzcxOGIxZCIsIm5iZiI6MTcxNDQzMjc2NywiZXhwIjoxNzE0NDM2MzY3LCJpYXQiOjE3MTQ0MzI3NjcsImlzcyI6Imh0dHBzOi8vYXBpLm15aG9yZGVzb3B0aW1pemVyLmZyIiwiYXVkIjoiand0QXVkaWVuY2UifQ.wZQAPrC4sz5Dldu-5ZYrzwsz3vRLiU_J5TwqCZNnTZY");
            var apiCalls = Enumerable.Range(0, 100)
            .Select(_ =>
            {
                return client.GetAsync("http://api.myhordesoptimizer.fr/dev/Authentication/Token?userkey=18a70edc7dff5662df494c82f7718b1d");
            });

            // Act
            var results = await Task.WhenAll(apiCalls);
            var hihi = results.ToList().Select(async(hehe) => await hehe.Content.ReadAsStringAsync());
            var hoho = sw.ElapsedMilliseconds;
        }
    }
}
