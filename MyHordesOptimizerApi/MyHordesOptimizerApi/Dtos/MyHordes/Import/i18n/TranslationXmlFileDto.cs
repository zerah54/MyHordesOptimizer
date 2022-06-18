using System.Collections.Generic;
using System.Xml.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Import.i18n
{
	[XmlRoot(ElementName = "note", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
	public class TranslationNote
	{

		[XmlAttribute(AttributeName = "category", Namespace = "")]
		public string Category { get; set; }

		[XmlText]
		public string Text { get; set; }
	}

	[XmlRoot(ElementName = "notes", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
	public class TranslationNotes
	{

		[XmlElement(ElementName = "note", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
		public List<TranslationNote> Note { get; set; }
	}

	[XmlRoot(ElementName = "segment", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
	public class TranslationSegment
	{

		[XmlElement(ElementName = "source", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
		public string Source { get; set; }

		[XmlElement(ElementName = "target", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
		public string Target { get; set; }
	}

	[XmlRoot(ElementName = "unit", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
	public class TranslationUnit
	{

		[XmlElement(ElementName = "notes", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
		public TranslationNotes Notes { get; set; }

		[XmlElement(ElementName = "segment", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
		public TranslationSegment Segment { get; set; }

		[XmlAttribute(AttributeName = "id", Namespace = "")]
		public string Id { get; set; }

		[XmlText]
		public string Text { get; set; }

		[XmlAttribute(AttributeName = "name", Namespace = "")]
		public string Name { get; set; }
	}

	[XmlRoot(ElementName = "file", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
	public class TranslationFile
	{

		[XmlElement(ElementName = "unit", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
		public List<TranslationUnit> Unit { get; set; }

		[XmlAttribute(AttributeName = "id", Namespace = "")]
		public string Id { get; set; }

		[XmlText]
		public string Text { get; set; }
	}

	[XmlRoot(ElementName = "xliff", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
	public class TranslationXmlFileDto
	{

		[XmlElement(ElementName = "file", Namespace = "urn:oasis:names:tc:xliff:document:2.0")]
		public TranslationFile File { get; set; }

		[XmlAttribute(AttributeName = "xmlns", Namespace = "")]
		public string Xmlns { get; set; }

		[XmlAttribute(AttributeName = "version", Namespace = "")]
		public double Version { get; set; }

		[XmlAttribute(AttributeName = "srcLang", Namespace = "")]
		public string SrcLang { get; set; }

		[XmlAttribute(AttributeName = "trgLang", Namespace = "")]
		public string TrgLang { get; set; }

		[XmlText]
		public string Text { get; set; }
	}

}
