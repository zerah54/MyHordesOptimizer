using Newtonsoft.Json;
using System.Collections.Generic;
using System.Net.Http;
using System.Reflection;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Extensions
{
    public static class FormUrlEncodedConvertExtensions
    {
        public static FormUrlEncodedContent ToFormUrlEncodedContent(this object obj)
        {
            var type = obj.GetType();
            var keyValuesPair = new List<KeyValuePair<string, string>>();
            foreach (var prop in obj.GetType().GetProperties())
            {
                var name = prop.Name;
                var jsonNameAttribute = prop.GetCustomAttribute<JsonPropertyNameAttribute>();
                if (jsonNameAttribute != null)
                {
                    name = jsonNameAttribute.Name;
                } 
                else
                {
                    var jsonAttribute = prop.GetCustomAttribute<JsonPropertyAttribute>();
                    if (jsonAttribute != null)
                    {
                        name = jsonAttribute.PropertyName;
                    }
                }
               
                var value = type.GetProperty(prop.Name).GetValue(obj);
                keyValuesPair.Add(new KeyValuePair<string, string>(name, value?.ToString()));
            }


            return new FormUrlEncodedContent(keyValuesPair);
        }
    }
}
