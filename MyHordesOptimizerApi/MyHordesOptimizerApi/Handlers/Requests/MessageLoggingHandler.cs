using Microsoft.Extensions.Logging;
using System.Text;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Handlers.Requests
{
    public class MessageLoggingHandler : AbstractMessageHandler
    {
        protected ILogger<MessageLoggingHandler> Logger { get; private set; }
        public MessageLoggingHandler(ILogger<MessageLoggingHandler> logger)
        {
            Logger = logger;
        }
        protected override async Task IncommingMessageAsync(string correlationId, string requestInfo, byte[] message)
        {
            await Task.Run(() =>
                Logger.LogTrace(string.Format("{0} - Request: {1}\r\n{2}", correlationId, requestInfo, Encoding.UTF8.GetString(message))));
        }


        protected override async Task OutgoingMessageAsync(string correlationId, string requestInfo, byte[] message)
        {
            await Task.Run(() =>
                Logger.LogTrace(string.Format("{0} - Response: {1}\r\n{2}", correlationId, requestInfo, Encoding.UTF8.GetString(message))));
        }
    }
}
