using AutoFixture;
using Microsoft.AspNetCore.Mvc.Testing;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using System.Text;

namespace MyHordesOptimizerApiIntegrationTests
{
    public abstract class ControllerTestBase : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        protected const string MediaType = "application/json";
        protected readonly Encoding Encoding = Encoding.UTF8;
        protected MyHordesOptimizerApplicationFactory Factory { get; }
        protected HttpClient Client { get; set; }
        protected Fixture Fixture { get; set; }


        public ControllerTestBase(MyHordesOptimizerApplicationFactory factory)
        {
            Factory = factory;
            Client = Factory.CreateClient();
            Client.BaseAddress = new Uri($"{Client.BaseAddress.AbsoluteUri}");
            Fixture = new Fixture();
        }

        public abstract Task InitializeAsync();

        public abstract Task DisposeAsync();
    }
}
