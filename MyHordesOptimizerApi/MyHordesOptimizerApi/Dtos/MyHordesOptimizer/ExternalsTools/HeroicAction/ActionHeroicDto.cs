using Newtonsoft.Json;
using System;
using System.Linq;
using System.Reflection;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction
{
    public class ActionHeroicDto
    {
        [JsonProperty("label")]
        public string Label { get; set; }

        [JsonProperty("locale")]
        public string Locale { get; set; }

        [JsonProperty("value")]
        public int Value { get; set; }
    }

    public enum ActionHeroicType
    {
        [Fr("Sauvetage"), En("Rescue"), De("Rettung"), Es("Rescate")]
        Rescue,
        [Fr("Uppercut sauvage"), En("Vicious Uppercut"), De("Wildstyle Uppercut"), Es("Puñetazo salvaje")]
        Uppercut,
        [Fr("Second souffle"), En("Second wind"), De("Zweite Lunge"), Es("Segundo Aliento")]
        SecondWind,
        // La trouvaille possède 4 libellés selon le niveau de héros (hero_generic_find, _lucky, _lucky2, _lucky3).
        // Chaque niveau remplace le précédent : un citoyen n'en voit jamais qu'un seul à la fois.
        [Fr("Trouvaille"), En("Seeker"), De("Fund"), Es("Hallazgo")]
        [Fr("Trouvaille (améliorée)"), En("Lucky Find"), De("Schönes Fundstück"), Es("Hallazgo")]
        [Fr("Impressionnante trouvaille"), En("Impressive find"), De("Beeindruckendes Fundstück"), Es("Hallazgo perfeccionado")]
        [Fr("Incroyable trouvaille"), En("Incredible find"), De("Erstaunliches Fundstück"), Es("Hallazgo milagroso")]
        LuckyFind,
        [Fr("Vaincre la mort"), En("Cheat Death"), De("Den Tod besiegen"), Es("Vencer a la muerte")]
        CheatDeath,
        [Fr("Retour du Héros"), En("Heroic Return"), De("Die Rückkehr des Helden"), Es("El retorno del Héroe")]
        HeroicReturn,
        [Fr("Appareil photo d'avant-guerre"), En("Pre-war camera"), De("Kamera aus Vorkriegs-Tagen"), Es("Cámara fotográfica de post-guerra")]
        Apag,
        [Fr("Passage en Force"), En("Break Through"), De("Durchgang in Kraft"), Es("Pasaje en vigor")]
        BreakThrough,
        [Fr("Camaraderie"), En("Brothers in Arms"), De("Freundschaft"), Es("Camaradería")]
        BrotherInArms
    }

    public enum ActionHeroicZone
    {
        Outside,
        Inside
    }

    [AttributeUsage(AttributeTargets.Field, AllowMultiple = true)]
    internal class LocaleAttribute : Attribute
    {
        public string Name { get; set; }

        public LocaleAttribute(string name)
        {
            Name = name;
        }
    }

    internal class FrAttribute : LocaleAttribute
    {
        public FrAttribute(string name) : base(name)
        {
        }
    }

    internal class DeAttribute : LocaleAttribute
    {
        public DeAttribute(string name) : base(name)
        {
        }
    }

    internal class EnAttribute : LocaleAttribute
    {
        public EnAttribute(string name) : base(name)
        {
        }
    }

    internal class EsAttribute : LocaleAttribute
    {
        public EsAttribute(string name) : base(name)
        {
        }
    }

    public static class ActionHeroicTypeExtensions
    {
        /// <summary>
        /// Retourne l'attribut description de l'enum en fonction de sa valeur
        /// Lève une exception ArgumentException si l'enum n'est pas reconnu
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="actionValue"></param>
        /// <returns></returns>
        public static bool IsEquivalentToLabel(this ActionHeroicType actionValue, string local, string label)
        {
            var type = typeof(ActionHeroicType);
            string name = Enum.GetName(type, actionValue);
            if (name != null)
            {
                FieldInfo field = type.GetField(name);
                if (field != null)
                {
                    Type attrType = null;
                    switch (local)
                    {
                        case "fr":
                            attrType = typeof(FrAttribute);
                            break;
                        case "en":
                            attrType = typeof(EnAttribute);
                            break;
                        case "es":
                            attrType = typeof(EsAttribute);
                            break;
                        case "de":
                            attrType = typeof(DeAttribute);
                            break;                     }
                    // Un même membre peut porter plusieurs libellés pour une locale (ex : les 4 niveaux de trouvaille)
                    return Attribute.GetCustomAttributes(field, attrType)
                        .Cast<LocaleAttribute>()
                        .Any(attr => attr.Name == label);
                }
            }
            return false;
        }
    }
}
