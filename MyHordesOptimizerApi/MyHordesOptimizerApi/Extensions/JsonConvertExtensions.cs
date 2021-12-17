using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Extensions
{
    public static class JsonConvertExtensions
    {
        public static string ToJson(this object obj)
        {
            return JsonConvert.SerializeObject(obj);
        }

        public static T FromJson<T>(this string jsonString)
        {
            return JsonConvert.DeserializeObject<T>(jsonString);
        }
    }
}
