using System.Collections.Generic;
using System.Xml.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Items
{
    [XmlRoot(ElementName = "citizen")]
    public class MyHordesXmlApiCitizenDto
    {

        [XmlAttribute(AttributeName = "dead")]
        public int Dead;

        [XmlAttribute(AttributeName = "hero")]
        public int Hero;

        [XmlAttribute(AttributeName = "name")]
        public string Name;

        [XmlAttribute(AttributeName = "avatar")]
        public string Avatar;

        [XmlAttribute(AttributeName = "id")]
        public int Id;
    }

    [XmlRoot(ElementName = "owner")]
    public class MyHordesXmlApiOwnerDto
    {

        [XmlElement(ElementName = "citizen")]
        public MyHordesXmlApiCitizenDto Citizen;
    }

    [XmlRoot(ElementName = "headers")]
    public class MyHordesXmlApiHeadersDto
    {

        [XmlElement(ElementName = "owner")]
        public MyHordesXmlApiOwnerDto Owner;

        [XmlAttribute(AttributeName = "link")]
        public string Link;

        [XmlAttribute(AttributeName = "iconurl")]
        public string Iconurl;

        [XmlAttribute(AttributeName = "avatarurl")]
        public string Avatarurl;

        [XmlAttribute(AttributeName = "secure")]
        public int Secure;

        [XmlAttribute(AttributeName = "author")]
        public string Author;

        [XmlAttribute(AttributeName = "language")]
        public string Language;

        [XmlAttribute(AttributeName = "version")]
        public double Version;

        [XmlAttribute(AttributeName = "generator")]
        public string Generator;
    }

    [XmlRoot(ElementName = "item")]
    public class MyHordesXmlApiItemDto
    {

        [XmlAttribute(AttributeName = "id")]
        public int Id;

        [XmlAttribute(AttributeName = "cat")]
        public string Cat;

        [XmlAttribute(AttributeName = "img")]
        public string Img;

        [XmlAttribute(AttributeName = "deco")]
        public int Deco;

        [XmlAttribute(AttributeName = "heavy")]
        public int Heavy;

        [XmlAttribute(AttributeName = "guard")]
        public int Guard;

        [XmlAttribute(AttributeName = "name")]
        public string Name;

        [XmlText]
        public string Text;
    }

    [XmlRoot(ElementName = "items")]
    public class MyHordeXmlApiItemsDto
    {

        [XmlElement(ElementName = "item")]
        public List<MyHordesXmlApiItemDto> Item;
    }

    [XmlRoot(ElementName = "data")]
    public class MyHordesXmlApiDataData
    {

        [XmlElement(ElementName = "items")]
        public MyHordeXmlApiItemsDto Items;

        [XmlAttribute(AttributeName = "cache-date")]
        public string CacheDate;

        [XmlAttribute(AttributeName = "cache-fast")]
        public int CacheFast;

        [XmlText]
        public string Text;
    }

    [XmlRoot(ElementName = "hordes")]
    public class MyHordesRootElementDto
    {

        [XmlElement(ElementName = "headers")]
        public MyHordesXmlApiHeadersDto Headers;

        [XmlElement(ElementName = "data")]
        public MyHordesXmlApiDataData Data;

        [XmlAttribute(AttributeName = "dc")]
        public string Dc;

        [XmlAttribute(AttributeName = "content")]
        public string Content;

        [XmlText]
        public string Text;
    }


}
