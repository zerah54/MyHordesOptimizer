using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Extensions
{
    public static class JsonConvertExtensions
    {
        public static string ToJson(this object obj)
        {
            return JsonConvert.SerializeObject(obj);
        }

        public static IDictionary<string, object> ToMhoDictionnary(this object obj)
        {
            var json = obj.ToJson();
            var jObject = JObject.Parse(json);
            return jObject.ToObject<Dictionary<string, object>>();
        }

        public static T FromJson<T>(this string jsonString)
        {
            return JsonConvert.DeserializeObject<T>(jsonString);
        }
    }
}
