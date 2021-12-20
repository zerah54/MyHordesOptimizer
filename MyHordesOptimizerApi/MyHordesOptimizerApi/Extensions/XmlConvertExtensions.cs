using System.IO;
using System.Xml.Serialization;

namespace MyHordesOptimizerApi.Extensions
{
    public static class XmlConvertExtensions
    {
        public static T FromXml<T>(this string xmlString)
        {
            XmlSerializer xmls = new XmlSerializer(typeof(T));
            using (TextReader textReader = new StringReader(xmlString))
            {
                var generatedType = (T)xmls.Deserialize(textReader);
                return generatedType;
            }
        }
    }
}
