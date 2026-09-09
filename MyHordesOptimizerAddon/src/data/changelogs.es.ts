export const changelogs: Record<string, string> = {
    '1.1.61': `
        [Mejora] El registro de cambios ya está disponible en los 4 idiomas del script (francés, inglés, alemán, español)

        [Corrección] Tras un 429 de MyHordes, el script esperaba y reintentaba el token en bucle sin dejar nunca que la cuota se liberase
        [Corrección] Una petición al servidor que nunca respondía podía bloquear indefinidamente una funcionalidad del script
        `,
    '1.1.60': `
        [Mejora] En el efecto catapulta mostrado en el tooltip, un objeto que desaparece sin dejar rastro muestra ahora su propio icono con muy poca opacidad, en lugar de no mostrar nada
        [Mejora] Rendimiento y fiabilidad globales del servidor (caché, compresión, cifrado de las comunicaciones)
        `,
    '1.1.59': `
        [Novedad] Los tooltips avanzados muestran ahora el efecto catapulta real de los objetos (objeto o transformación obtenida al impacto, zombis matados o repulsión, zona de efecto), en sustitución del antiguo indicador "objeto frágil"

        [Corrección] Mensaje más claro invitando a recargar la página cuando la versión del script/de la extensión no se puede leer, en lugar de un mensaje de error incompleto
        `,
    '1.1.58': `
        [Novedad] Nueva opción para enviar el contenido del cofre a MHO al actualizar las herramientas externas desde la casa
        `,
    '1.1.57': `
        [Corrección] La nota sobre un jugador podía fallar cuando ese jugador estaba en la misma ciudad que tú
        `,
    '1.1.56': `
        [Corrección] Visualización de las notas
        `,
    '1.1.55': `
        [Novedad] Añadidas notas personales sobre las ciudades, los ciudadanos de una ciudad y los jugadores, mediante un icono de lápiz (ventana del ciudadano, lista de ciudadanos, página de ciudad)
        [Novedad] Los tooltips muestran ahora el coste / la probabilidad de apertura de los contenedores de riesgo (cajas, cofres...) así como la herramienta necesaria para abrirlos
        [Novedad] Añadidos enlaces a la página del jugador y a la página de ciudad en MyHordes Optimizer, desde la burbuja del ciudadano y el bloque de herramientas externas
        [Novedad] Notificación cuando hay una actualización disponible del script o de la extensión, y cuando se acaba de aplicar una actualización

        [Corrección] El bloque "Edificio" de la información adicional de la casilla no siempre se mostraba, y podía conservar la información del antiguo edificio al salir de la casilla
    `,
    '1.1.54': `
        [Novedad] Nueva opción de lectura del foro: mostrar los vídeos (youtube) directamente en los posts (para otros proveedores, contáctame)
        [Novedad] Nueva opción para actualizar las acciones diarias en MHO. El envío de la información del baño se traslada aquí, junto con la nueva llegada de guardar y limpiar la ropa

        [Corrección] Orden y filtro en la columna de posición del ciudadano en la lista de ciudadanos
        [Corrección] En casos raros, la notificación de duplicado aparecía aunque solo hubiera un script / extensión activados
    `,
    '1.1.53': `
        [Novedad] Tres nuevas opciones de lectura del foro: desplegar automáticamente las secciones plegadas, hacer clic en un spoiler para dejarlo mostrado, y mostrar las imágenes de los enlaces directamente en los posts
        [Novedad] La actualización de las herramientas externas muestra ahora el progreso herramienta por herramienta (icono + estado) en lugar de un simple mensaje global, con el detalle de los errores de cada herramienta que falla

        [Corrección] El botón "Marcar todo" de los ajustes ya no desmarca por error opciones ya marcadas en cascada
        [Corrección] El botón de actualización de las herramientas externas (versión extendida) podía fallar en lugar de mostrar el resultado si una de las herramientas fallaba
    `,
    '1.1.52': `
        [Mejora] Si el script y la extensión coexisten, se muestra un mensaje de error y solo se carga uno de los dos

        [Corrección] Eliminada la receta de montaje de una motosierra en exterior (receta específica porque falla) que daba la impresión de que la receta existía dos veces de forma idéntica
        [Corrección] Eliminado el uso en myHordes.localhost que se había colado ahí por error durante unas pruebas
        [Corrección] El uso del poder heroico "Hallazgo" y sus variantes ahora debería actualizarse correctamente
    `,
    '1.1.51': `
        [Novedad] En la página del banco, un contador indica el número de retiradas aún posibles antes de activar el anti-abuso, con una alerta cuando se alcanza el límite
        [Novedad] El cálculo de los PA necesarios para que un edificio sobreviva a la noche tiene ahora en cuenta los fuegos artificiales y el reactor soviético, con el valor correcto tanto en Región Remota como en Pandemonium

        [Mejora] El script se ha aligerado y optimizado considerablemente
        [Mejora] El botón de MHO ahora se posiciona correctamente

        [Corrección] La mochila no siempre se abría automáticamente, incluso cuando no había ningún objeto dentro
        [Corrección] La lista de la compra podía mostrarse vacía y solo aparecer tras hacer clic en «Actualizar»
        [Corrección] Las prioridades mostradas en los objetos desaparecían al recogerlos o soltarlos
        [Corrección] El botón de actualización de las herramientas externas no siempre aparecía, sobre todo tras un desplazamiento
        [Corrección] El contador de caracteres del registro desaparecía a veces
        [Corrección] El contador anti-abuso ahora se retira cuando se desmarca la opción
    `,
    '1.1.50': `
        [Novedad] Las listas de la vigilancia, las trampas y el vertedero ahora se pueden ordenar
        [Novedad] Se puede mostrar un campo de búsqueda de cebo en la página de las trampas
        [Novedad] Nueva opción para congelar los avatares animados, que solo se reaniman al pasar el ratón por encima
        [Novedad] Nueva opción para aplicar un estilo personalizado a los títulos de los temas del foro, según su etiqueta y las palabras que contienen, configurable desde una ventana dedicada
    `,
    '1.1.49': `
        [Corrección] Estimaciones tras la actualización del sitio
    `,
    '1.1.48': `
        [Corrección] La lista de la compra no se mostraba en la interfaz
    `,
    '1.1.47': `
        [Mejora] Añadidos enlaces a las páginas de ciudad de las herramientas externas en la página de elección de ciudad
    `,
    '1.1.46': `
        [Corrección] Ajustado el tamaño de algunos filtros de la lista de ciudadanos
        [Corrección] Había un bug que duplicaba los enlaces a las herramientas externas en la ventana emergente del usuario
    `,
    '1.1.45': `
        [Corrección] El contador anti-abuso no funcionaba correctamente (¡pero cada vez nos acercamos más!)

        [Mejora] Rediseño de la calculadora de camping integrada en la página
    `,
    '1.1.44': `
        [Corrección] Los campos de búsqueda de la página de construcciones, la página de vigilancia y la lista de destinatarios no funcionaban
        [Corrección] El contador anti-abuso no funcionaba correctamente (cruzamos los dedos para que esta sea la buena)

        [Mejora] La visualización del changelog también permite consultar los changelogs anteriores
    `,
    '1.1.43': `
        [Corrección] La actualización del mapa de GH tras actualizar las herramientas externas vuelve a funcionar correctamente sin recargar toda la página

        [Novedad] Dos nuevas opciones permiten mostrar filtros en las páginas de lista de ciudadanos y de omnisciencia
    `,
    '1.1.42': `
        [Corrección] La actualización desde la casa había dejado de funcionar
    `,
    '1.1.41': `
        [Corrección] Errata
        [Corrección] Las llamadas han dejado de funcionar
    `,
    '1.1.40': `
        [Corrección] Arreglo de la actualización de las herramientas externas tras la actualización de mitad de temporada
        [Corrección] Visualización de la lista de la compra en la página

        [Mejora] Reorganización de las opciones del script para mayor claridad

        [Novedad] Opción para ordenar la lista de ciudadanos y la omnisciencia
    `,
    '1.1.39.0': `
        [Corrección] Arreglo de la actualización de las herramientas externas tras la actualización de mitad de temporada
    `,
    '1.1.38.0': `
        [Corrección] Cambios en la gestión de la wishlist
    `,
    '1.1.37.0': `
        [Corrección] Corrige la visualización de las auras en los objetos de la lista de la compra
    `,
    '1.1.36.0': `
        [Mejora] Los tooltips mejorados indican ahora en qué elemento de la receta hacer clic
    `,
    '1.1.35.0': `
        [Corrección] Cambio completo de comportamiento del tooltip mejorado para hacer su uso más fluido y corregirlo. Gracias Emmet por la ayuda

        [Mejora] Visualización compacta de las recetas en el tooltip mejorado
        [Mejora] Añadida información sobre las propiedades de los estados y objetos

        [Novedad] Personalización de la información mostrada en el tooltip mediante opciones independientes (atención, esto desactiva las opciones en cuestión, hay que reactivarlas)
        [Novedad] Añadida la traducción en los tooltips de los objetos
    `,
    '1.1.34.0': `
        [Corrección] Cambio completo de comportamiento del tooltip mejorado para hacer su uso más fluido y corregirlo. Gracias Emmet por la ayuda

        [Mejora] Visualización compacta de las recetas en el tooltip mejorado

        [Novedad] Personalización de la información mostrada en el tooltip mediante opciones independientes (atención, esto desactiva las opciones en cuestión, hay que reactivarlas)
        [Novedad] Añadida la traducción en los tooltips de los objetos
    `,
    '1.1.33.0': `
        [Corrección] Cambio completo de comportamiento del tooltip mejorado para hacer su uso más fluido y corregirlo. Gracias Emmet por la ayuda
        [Corrección] Corregidos los casos en los que el tooltip no tenía el aviso de "shift" o el botón para cerrarlo una vez fijado
        [Corrección] Impide fijar un tooltip que no muestra el aviso de "shift"
        [Corrección] Mejor visualización de los botones "Wiki" y "Herramientas" del tooltip

        [Novedad] Personalización de la información mostrada en el tooltip mediante opciones independientes
        [Novedad] Añadida la traducción en los tooltips de los objetos
    `,
    '1.1.32.0': `
        [Corrección] Cambio completo de comportamiento del tooltip mejorado para hacer su uso más fluido y corregirlo. Gracias Emmet por la ayuda
        [Corrección] Corregidos los casos en los que el tooltip no tenía el aviso de "shift" o el botón para cerrarlo una vez fijado
        [Corrección] Impide fijar un tooltip que no muestra el aviso de "shift"
        [Corrección] Mejor visualización de los botones "Wiki" y "Herramientas" del tooltip

        [Novedad] Personalización de la información mostrada en el tooltip mediante opciones independientes
        [Novedad] Añadida la traducción en los tooltips de los objetos
    `,
    '1.1.31.0': `
        [Corrección] Cambio completo de comportamiento del tooltip mejorado para hacer su uso más fluido y corregirlo. Gracias Emmet por la ayuda
        [Corrección] Mejor visualización de los botones "Wiki" y "Herramientas" del tooltip

        [Novedad] Personalización de la información mostrada en el tooltip mediante opciones independientes
        [Novedad] Añadida la traducción en los tooltips de los objetos
    `,
    '1.1.30.0': `
        [Corrección] Cambio completo de comportamiento del tooltip mejorado para hacer su uso más fluido y corregirlo. Gracias Emmet por la ayuda
        [Corrección] Mejor visualización de los botones "Wiki" y "Herramientas" del tooltip

        [Novedad] Personalización de la información mostrada en el tooltip mediante opciones independientes
        [Novedad] Añadida la traducción en los tooltips de los objetos
    `,
    '1.1.29.0': `
        [Corrección] Cambio completo de comportamiento del tooltip mejorado para hacer su uso más fluido y corregirlo. Gracias Emmet por la ayuda
    `,
    '1.1.28.0': `
        [Corrección] El filtro por nombre de objeto en la página del vertedero había dejado de funcionar
    `,
    '1.1.27.0': `
        [Corrección] Mayor estabilidad al abrir una mochila
    `,
    '1.1.26.0': `
        [Corrección] Intento de arreglo de los 429 en la ciudad
    `,
    '1.1.25.0': `
        [Corrección] Intento de arreglo de los 429 en la ciudad
    `,
    '1.1.24.0': `
        [Corrección] El script funciona con la nueva URL de gh
        [Corrección] 429 cuando no se está en la ciudad
        [Corrección] Algunos casos en los que la mochila no se abría automáticamente con la opción marcada

        [Varios] Eliminada la actualización de BBH (BBH ya no funciona)
    `,
    '1.1.23.0': `
        [Corrección] Visualización del wiki en el script
        [Corrección] Visualización de errores 503 durante el ataque
    `,
    '1.1.22.0': `
        [Corrección] Actualización infinita
    `,
    '1.1.21.0': `
        [Corrección] Arregla el error 400 al inicio de una ciudad
    `,
    '1.1.20.0': `
        [Corrección] Visualización de MHO tras el cambio de temporada
    `,
    '1.1.19.0': `
        [Corrección] Visualización de las construcciones
        [Corrección] Contador anti-abuso
        [Corrección] Visualización en caso de error de las herramientas externas con CSS
    `,
    '1.1.18.0': `
        [Corrección] Visualización de las construcciones
    `,
    '1.1.17.0': `
        [Novedad] El script envía la información de la página a FataMorgana incluso fuera del modo caos
    `,
    '1.1.16.0': `
        [Corrección] El script había dejado de mostrarse cuando había wishlist
    `,
    '1.1.15.0': `
        [Corrección] Visualización del banco en la ventana "Herramientas"
        [Corrección] Eliminada la pestaña "Lista de la compra" de la ventana "Herramientas", que había quedado obsoleta (disponible en el sitio web)
    `,
    '1.1.14.0': `
        [Corrección] Arreglo del envío de los datos de excavador a Fata Morgana
    `,
    '1.1.13.0': `
        [Corrección] Envío de los datos de explorador y de excavador
        [Corrección] Anti-abuso
    `,
    '1.1.12.0': `
        [Novedad] Añadida una opción para enviar a Fata Morgana la información de las profesiones (explorador, excavador)
    `,
    '1.1.11.0': `
        [Novedad] Añadida una opción para enviar a Fata Morgana la información de las profesiones (explorador, excavador)
    `,
    '1.1.10.1': `
        [Novedad] Añadida una opción para enviar a Fata Morgana la información de las profesiones (explorador, excavador)
    `,
    '1.1.10.0': `
        [Novedad] Añadida una opción para enviar a Fata Morgana la información de las profesiones (explorador, excavador)
    `,
    '1.1.9.0': `
        [Corrección] Corrige la lista de la compra
    `,
    '1.1.8.0': `
        [Corrección] Corrige la lista de la compra
    `,
    '1.1.7.0': `
        [Corrección] Corrige la llamada en bucle en la página del alma cuando no se está encarnado
    `,
    '1.1.6.0': `
        [Corrección] Visualización de los PA que faltan en las construcciones en pandé

        [Mejora] Rendimiento global y estabilidad

        [Novedad] Ahora se puede mostrar un contador de caracteres en el chatcase
        [Novedad] Ahora se pueden volver a leer las notificaciones antiguas (mientras no se recargue la página)
    `,
    '1.1.5.0': `
        [Corrección] Visualización de los PA que faltan en las construcciones en pandé

        [Mejora] Rendimiento global y estabilidad

        [Novedad] Ahora se puede mostrar un contador de caracteres en el chatcase
        [Novedad] Ahora se pueden volver a leer las notificaciones antiguas (mientras no se recargue la página)
    `,
    '1.1.4.0': `
        [Corrección] Varias reparaciones en las recetas de los objetos
    `,
    '1.1.3.0': `
        [Corrección] Muestra correctamente los elementos duplicados en las recetas de los objetos
    `,
    '1.1.2.0': `
        [Corrección] Muestra correctamente los elementos duplicados en las recetas de los objetos
    `,
    '1.1.1.0': `
        [Corrección] Añadidas varias propiedades que faltaban en los objetos
        [Corrección] Corrige el envío de la mochila a MHO
    `,
    '1.1.0.0': `
        Actualización de compatibilidad (o casi) con la S18
    `,
    '1.0.33.0': `
        [Corrección] Varios arreglos de visualización
    `,
    '1.0.32.0': `
        [Corrección] Textos que faltaban en algunos tooltips
    `,
    '1.0.31.0': `
        [Novedad] Añadida información en los tooltips mejorados de los estados
    `,
    '1.0.30.0': `
        [Corrección] Etiqueta en el tooltip de los objetos (se mostraba la información "en mochila" en lugar de "en banco")
        [Corrección] La actualización en modo caos no funcionaba
    `,
    '1.0.29.0': `
        [Corrección] Habían desaparecido los botones para incrementar los valores de las construcciones
    `,
    '1.0.28.0': `
        [Corrección] Arreglo del cálculo del camping en la casilla


        html[lang]
        lang
        fr
    `,
    '1.0.27.0': `
        [Corrección] Arreglo del cálculo del camping en la casilla


        html[lang]
        lang
        fr
    `,
    '1.0.26.0': `
        [Corrección] La copia del registro ya no copia las líneas ocultas por el filtro

        [Modificación] Eliminado el concepto de "prioridad" en la lista de la compra, mostrando ahora los colores según la posición
    `,
    '1.0.25.0': `
        [Corrección] Registrar en la torre de vigilancia ya no rompe la visualización del ataque estimado
    `,
    '1.0.24.0': `
        [Corrección] Intentamos evitar que las barras de reparación en pandé se desborden
        [Corrección] Eliminado el localhost de la lista de partidas
    `,
    '1.0.23.0': `
        [Corrección] Intentamos que las barras de reparación en pandé se muestren siempre, y no solo cuando les apetece
    `,
    '1.0.22.0': `
        [Corrección] Varios bugs de visualización
    `,
    '1.0.21.0': `
        [Novedad] La actualización de las herramientas externas con la opción de estado activada también actualiza la información de si se ha tomado el baño o no
    `,
    '1.0.20.0': `
        [Actualización del nombre del script] El script se llamará ahora MHO Addon
    `,
    '1.0.19.0': `
        [Corrección] El contador personalizado del anti-abuso solo contaba un minuto
    `,
    '1.0.18.0': `
        [Corrección] Problemas de visualización
        [Corrección] Error al añadir un objeto a la lista de la compra
    `,
    '1.0.17.0': `
        [Corrección] La recuperación automática del identificador externo vuelve a estar disponible

        [Mejora] Varias mejoras de rendimiento (eso esperamos :D)

        [Novedad] Añadida una opción para rellenar previamente un mensaje en la casa cuando quieres enviar un objeto y el mensaje está vacío. El mensaje se rellena con valores aleatorios entre los disponibles para tu idioma. Por ahora solo hay un mensaje por idioma, pero puedes enviarme tus sugerencias para que añada más ;)
        [Novedad] Añadida una opción para mostrar en el juego las expediciones de MHO en las que estás inscrito
    `,
    '1.0.16.0': `
        [Corrección] Despliegue de un hotfix tras la introducción de un bug. La recuperación automática de tu identificador externo para las apps no está disponible por el momento.
    `,
    '1.0.15.0': `
        [Mejora] Las actualizaciones disponibles ahora se señalan con un indicador visual, y aparece un nuevo enlace en el menú cuando hay una actualización disponible
        [Mejora] Los changelogs ya no se muestran al cargar la aplicación, sino que se señalan con un indicador visual en el menú

        [Novedad] Aparece una nueva opción para Fata Morgana: el envío del número de zombis matados
    `,
    '1.0.14.0': `
        [Corrección] Traducciones que faltaban
        [Corrección] Notificación de fin de búsqueda
        [Corrección] Varios bugs desde la versión 1.0.8.0

        [Mejora] Nueva opción disponible para actualizar Fata Morgana en ciudad devastada
    `,
    '1.0.13.0': `
        [Corrección] Traducciones que faltaban
        [Corrección] Notificación de fin de búsqueda
        [Corrección] Varios bugs desde la versión 1.0.8.0

        [Mejora] Nueva opción disponible para actualizar Fata Morgana en ciudad devastada
    `,
    '1.0.12.0': `
        [Corrección] Traducciones que faltaban
        [Corrección] Notificación de fin de búsqueda

        [Mejora] Nueva opción disponible para actualizar Fata Morgana en ciudad devastada
    `,
    '1.0.11.0': `
        [Corrección] Traducciones que faltaban
        [Corrección] Notificación de fin de búsqueda

        [Mejora] Nueva opción disponible para actualizar Fata Morgana en ciudad devastada
    `,
    '1.0.10.0': `
        [Corrección] Traducciones que faltaban
        [Corrección] Notificación de fin de búsqueda

        [Mejora] Nueva opción disponible para actualizar Fata Morgana en ciudad devastada
    `,
    '1.0.9.0': `
        [Corrección] Al registrar las búsquedas, las búsquedas de quien las registraba nunca se tenían en cuenta
        [Corrección] Corregido un bug de visualización de los enlaces a los perfiles externos de los usuarios
        [Corrección] Algunas correcciones en el Anti-Abuso (esto no ha acabado, y tengo la impresión de que no se le ve el final 🥲)
        [Corrección] Corregido un bug de integración con Fata Morgana

        [Eliminación] Eliminada la funcionalidad de notificación de nuevo mensaje, ya que ahora existe de forma nativa en MyHordes
    `,
    '1.0.8.0': `
        [Mejora] Nueva opción disponible para actualizar Fata Morgana en ciudad devastada
    `,
    '1.0.7.0': `
        [Corrección] Al registrar las búsquedas, las búsquedas de quien las registraba nunca se tenían en cuenta
        [Corrección] Corregido un bug de visualización de los enlaces a los perfiles externos de los usuarios
        [Corrección] Algunas correcciones en el Anti-Abuso (esto no ha acabado, y tengo la impresión de que no se le ve el final 🥲)
        [Corrección] Corregido un bug de integración con Fata Morgana

        [Eliminación] Eliminada la funcionalidad de notificación de nuevo mensaje, ya que ahora existe de forma nativa en MyHordes
    `,
    '1.0.6.0': `
        [Corrección] Visualización y registro de las estimaciones de la torre de vigilancia en la extensión de Firefox

        [Mejora] Ya no hace falta pulsar Intro para iniciar una traducción, se lanzará automáticamente en cada búsqueda de más de 2 letras
        [Mejora] Indicador visual en el botón de copia del registro cuando se realiza la copia

        [Novedad] Añadidos enlaces a los perfiles externos en la ventana emergente de un usuario
    `,
    '1.0.5.0': `
        [Corrección] La primera retirada en el banco vuelve a no contar en el anti-abuso
        [Corrección] Traducciones

        [Novedad] Campo de búsqueda en la página del vertedero
        [Novedad] Visualización del % de voracidad en la barra
    `,
    '1.0.4.0': `
        [Corrección] El botón para añadir un objeto a la lista de la compra ya no aparece en los objetos de la herramienta Banco
        [Corrección] El error de "CloneInto" debería estar (por fin) corregido
        [Corrección] El wiki de recetas vuelve a estar accesible en la extensión
    `,
    '1.0.3.0': `
        [Corrección] Corrige la visualización del botón de actualización de las herramientas externas en chrome
        [Corrección] Corrige la recuperación de la lista de la compra cuando existe
    `,
    '1.0.2.0': `
        [Corrección] Corrige la visualización del icono de éxito tras una actualización de las herramientas externas en pantalla pequeña en modo compacto
        [Corrección] Corrige la visualización del loader en los tooltips, que estaba en alemán cuando no debía tener texto
        [Corrección] La visualización del tooltip de APAG es ahora más limpia
        [Corrección] Corrige el cálculo del camping, que tenía en cuenta el valor incorrecto del edificio

        [Novedad] Añadido un botón para marcar todos los ajustes
    `,
    '1.0.1.0': `
        Esta versión contiene cambios técnicos importantes. Por esta razón, es posible que tengas que volver a configurar todas tus opciones.

        [Corrección] Corrige el problema de carga intempestiva que bloqueaba MyHordes.

        [Mejora] Añadida una opción en cada herramienta externa para elegir si quieres que se actualice al cambiar de pestaña o no. Si contabas con esta funcionalidad, que ya existía, no olvides activarla en los ajustes.
    `,
    '1.0.0.0': `
        Esta versión contiene cambios técnicos importantes. Por esta razón, es posible que tengas que volver a configurar todas tus opciones.

        [Corrección] Corrige el problema de carga intempestiva que bloqueaba MyHordes.

        [Mejora] Añadida una opción en cada herramienta externa para elegir si quieres que se actualice al cambiar de pestaña o no. Si contabas con esta funcionalidad, que ya existía, no olvides activarla en los ajustes.
    `,
    '1.0.0': `
        Esta versión contiene cambios técnicos importantes. Por esta razón, es posible que tengas que volver a configurar todas tus opciones.

        [Corrección] Corrige el problema de carga intempestiva que bloqueaba MyHordes.

        [Mejora] Añadida una opción en cada herramienta externa para elegir si quieres que se actualice al cambiar de pestaña o no. Si contabas con esta funcionalidad, que ya existía, no olvides activarla en los ajustes.
    `,
    '1.0.0-beta.73': `
        [Corrección] Visualización de los cálculos de camping
    `,
    '1.0.0-beta.72': `
        [Corrección] Enlace de actualización del script cuando el script no está actualizado
        [Corrección] Actualización de la calculadora de camping en la S16
        [Corrección] Corregida la visualización de las reparaciones en pandemonium
        [Corrección] Corrige la toma de ración en el anti-abuso

        [Mejora] El script ya no debería mostrar varios errores simultáneos cuando fallan varias llamadas a la vez
        [Mejora] Los objetos que se pueden encontrar en un edificio se ordenan por probabilidad
    `,
    '1.0.0-beta.71': `
        [Corrección] Corregida la visualización de la información adicional de un edificio

        [Mejora] Implementados métodos para limitar el número de llamadas a la API de MyHordes
    `,
    '1.0.0-beta.70': `
        [Corrección] Arreglos en la visualización de las construcciones a reparar en pandé

        [Mejora] Los errores procedentes de MH ahora se gestionan y muestran mejor
        [Mejora] El bloque de información adicional indica ahora los objetos que se pueden encontrar en el edificio
    `,
    '1.0.0-beta.69': `
        [Mejora] El filtro para ocultar las construcciones terminadas ya no oculta las que han sufrido daños
        [Mejora] Arreglos en las estimaciones
        [Mejora] El bloque de información adicional indica ahora si el edificio está vacío
    `,
    '1.0.0-beta.68': `
        [Corrección] La copia del registro ahora elimina los espacios sobrantes al inicio de línea

        [Mejora] Los distintos filtros ahora ignoran los acentos
        [Mejora] Mejora visual del bloque de información adicional

        [Novedad] Añadido un filtro para ocultar las construcciones terminadas
    `,
    '1.0.0-beta.67': `
        [Corrección] Corregido un bug en el registro del valor 0 de la tdg

        [Novedad] Ahora se mostrará un mensaje al cargar el script si no está en su versión más reciente.
    `,
    '1.0.0-beta.66': `
        [Corrección] Corregido un bug en el registro del valor 0 de la tdg

        [Novedad] Ahora se mostrará un mensaje al cargar el script si no está en su versión más reciente.
    `,
    '1.0.0-beta.65': `
        [Corrección] Corregido un bug en el registro del valor 0 de la tdg

        [Novedad] Ahora se mostrará un mensaje al cargar el script si no está en su versión más reciente.
    `,
    '1.0.0-beta.64': `
        [Corrección] Corregido un bug en el registro de los valores de la tdg

        [Mejora] Intento de mejora de los tooltips para mostrar una barra de desplazamiento cuando hay recetas
        [Mejora] El tooltip mejorado muestra ahora el lugar donde dejar un objeto de la lista de la compra
        [Mejora] La lista de la compra integrada en la página ahora se ordena por prioridad y solo muestra los objetos presentes en la casilla
    `,
    '1.0.0-beta.63': `
        [Corrección] Corregido un bug en las opciones de escolta, que no siempre eran las correctas tras una actualización
    `,
    '1.0.0-beta.62': `
        [Corrección] Bug de búsqueda en el nombre de una construcción
    `,
    '1.0.0-beta.61': `
        [Corrección] Varios arreglos de visualización de los ajustes, en particular en móvil o pantalla pequeña
    `,
    '1.0.0-beta.60': `
        [Mejora] Reubicada la barra de traducción, que podía superponerse a elementos del juego
        [Mejora] Mejorada la visualización de los ajustes, en particular en móvil o en una pantalla lo bastante pequeña como para provocar desplazamiento en los ajustes
    `,
    '1.0.0-beta.59': `
        Atención, algunos cambios pueden haber afectado a tus opciones seleccionadas, ¡asegúrate de que todo esté en orden!

        [Corrección] Corrige la visualización de algunas imágenes que no siempre se mostraban
        [Corrección] Corrige que se tenga en cuenta la profesión en la herramienta integrada de cálculo de camping

        [Mejora] Reorganización del menú, en el que las opciones empezaban a ocupar demasiado espacio
        [Mejora] Separadas algunas opciones (actualización en ciudad devastada y envío del número de zombis matados / campos de búsqueda)

        [Novedad] Añadida una opción para registrar las estimaciones de la TDG en MHO, consultar los valores registrados y copiarlos para el foro
        [Novedad] Añadida una opción para mostrar un campo de búsqueda en el registro
        [Novedad] Añadida una opción para elegir las opciones de escolta que se aplican al activar la espera de escolta
        [Novedad] Añadida una opción para avisar al usuario en caso de inactividad de más de 5 minutos si no ha soltado la escolta o no se ha puesto en espera de escolta
    `,
    '1.0.0-beta.58': `
        [Corrección] Corrige algunos comportamientos del contador anti-abuso

        [Novedad] Añade un botón de copia del registro

        [Restablecido] Se reintegra la opción de envío de las mejoras de la casa. Se creará un nuevo botón en la página de mejoras
    `,
    '1.0.0-beta.57': `
        [Corrección] Corrige la visualización del botón de actualización en pantalla pequeña cuando el modo compacto no está activado en los ajustes
        [Corrección] Corrige algunos comportamientos del contador anti-abuso
        [Corrección] Debería corregir la visualización de las imágenes, que a veces se rompía

        [Mejora] El botón de acceso a las opciones del script ahora es más grande en pantallas pequeñas
    `,
    '1.0.0-beta.56': `
        [Corrección] Corrige la visualización del número de zombis muertos en la casilla
    `,
    '1.0.0-beta.55': `
        [Corrección] El número de cargas de APAG restantes se registraba mal
    `,
    '1.0.0-beta.54': `
        [Novedad] Añadida una opción para activar un modo compacto en móvil para el botón de actualización de las herramientas externas
    `,
    '1.0.0-beta.53': `
        [Novedad] Añadida una opción para activar un modo compacto en móvil para el botón de actualización de las herramientas externas
    `,
    '1.0.0-beta.52': `
        [Corrección] Corregida la visualización de los tooltips mejorados tras la actualización de MyHordes
        [Corrección] Corregido un bug que duplicaba las líneas de retiradas del banco en la herramienta de seguimiento del anti-abuso

        [Atención] Las mejoras de la casa ya no se envían a MHO ni a GH tras la actualización de MyHordes. Intentaré encontrar una solución para restablecer esta funcionalidad, pero sin garantías.
    `,
    '1.0.0-beta.51': `
        [Corrección] Corregidos varios comportamientos

        [Novedad] Añadida una opción para mostrar un contador de retiradas en el banco
    `,
    '1.0.0-beta.50': `
        [Corrección] Corregidos varios comportamientos

        [Mejora] Ahora debería funcionar con Greasemonkey

        [Novedad] Añadida una opción para abrir automáticamente el menú "Usar un objeto de la mochila"
    `,
    '1.0.0-beta.49': `
        [Corrección] Errata
        [Corrección] Visualización del aviso cuando el registro está incompleto
    `,
    '1.0.0-beta.48': `
        [Corrección] El valor del cierre se envía correctamente a GH
    `,
    '1.0.0-beta.47': `
        [Corrección] Bucle infinito cuando se estaba en escolta (uy)
        [Corrección] Visualización de los pa que faltan para que la construcción no sea destruida durante la noche
    `,
    '1.0.0-beta.46': `
        [Corrección] La copia del mapa de BBH vuelve a funcionar
        [Corrección] El tamaño de los tooltips de ayuda vuelve a ser adecuado
    `,
    '1.0.0-beta.45': `
        [Corrección] Eliminados errores en la consola
        [Corrección] El mapa había dejado de abrirse
    `,
    '1.0.0-beta.44': `
        [Mejora] Aspecto visual de la nota que se muestra cuando la opción de búsquedas está activada pero los datos de búsquedas no están completos
    `,
    '1.0.0-beta.43': `
        [Corrección] Añadidas traducciones que faltaban

        [Mejora] Se muestra una nota en el mapa cuando la opción de búsquedas está activada pero los datos de búsquedas no están completos (líneas del registro no cargadas)
    `,
    '1.0.0-beta.42': `
        [Corrección] Posición del icono de MHO

        [Mejora] Al actualizar GH, la página ya no se recarga por completo, solo su mapa

        [Eliminación] Tras una conversación con el equipo de MyHordes (que a su vez surgió de un debate intenso en el foro mundial), se ha eliminado la funcionalidad de información adicional sobre los ciudadanos, llamada por algunos "Omnisciencia++" u "O++" para los más vagos.
    `,
    '1.0.0-beta.41': `
        [Corrección] Reparado el menú, que quedaba por debajo de los elementos de interfaz de MH tras cambios en su lado
    `,
    '1.0.0-beta.40': `
        [Mejora] Traducciones y textos varios
        [Mejora] Agrupadas las opciones de campos de búsqueda en una sola opción

        [Novedad] Añadido un simulador de camping disponible directamente en la casilla
        [Novedad] Añadida una opción para mostrar en una casilla las notas procedentes del mapa de MHO
    `,
    '1.0.0-beta.39': `
        [MH][Mejora] La actualización de la lista de la compra debería funcionar correctamente
    `,
    '1.0.0-beta.38': `
        [MH][Corrección] El enlace al sitio web no era válido

        [MH][Mejora] Traducciones al español (gracias Bacchus)
        [MH][Mejora] La actualización de la lista de la compra desde la ventana "Herramientas" se ha eliminado y ahora corre exclusivamente a cargo del sitio web
    `,
    '1.0.0-beta.37': `
        [MH][Mejora] Traducciones al español (gracias Bacchus)
        [MH][Mejora] La actualización de la lista de la compra desde la ventana "Herramientas" se ha eliminado y ahora corre exclusivamente a cargo del sitio web
    `,
    '1.0.0-beta.36': `
        [MH][Mejora] Añadidas las probabilidades de éxito del manual en el tooltip correspondiente
    `,
    '1.0.0-beta.35': `
        [MH][Novedad] Añadida una opción para filtrar los destinatarios de los mensajes
    `,
    '1.0.0-beta.34': `
        [MH][Novedad] Añadida una opción para recibir notificaciones del navegador cuando cambie el número de notificaciones de MH
    `,
    '1.0.0-beta.33': `
        [MH][Corrección] Corregido el enlace a la documentación usado en tampermonkey

        [MH][Mejora] Movido el enlace del sitio web a lo más alto de la lista de opciones (espero que esta vez todo el mundo sepa que existe 😊)
    `,
    '1.0.0-beta.32': `
        [MH][Corrección] Corregidos los estilos que sobrescribían las viñetas de MH en los foros (lo siento :( )

        [MH][Mejora] Añadidas traducciones (inglesas y alemanas) - gracias Xochi, Crazy Unicorn, Nekomine!
    `,
    '1.0.0-beta.31': `
        [MH][Corrección] Digs => searches

        [MH][Mejora] Ahora se tiene en cuenta la cantidad de objetos en las mochilas en la lista de la compra
    `,
    '1.0.0-beta.30': `
        [MH][Corrección] La lista de ciudadanos presentes en la casilla enviada a MHO estaba vacía si solo había una persona en la casilla
    `,
    '1.0.0-beta.29': `
        [MH][Mejora] Sustituido el botón de eliminación del id externo para las apps por un botón de modificación
        [MH][Mejora] Arreglos visuales en la página de información adicional sobre los ciudadanos

        [MH][Novedad] Añadida una opción para enviar a MHO el resultado de tus búsquedas. Tienes a tu disposición herramientas de lectura y modificación en el sitio web
    `,
    '1.0.0-beta.28': `
        [MH][Corrección] Corregida la actualización de las herramientas externas cuando hay 0 cargas de APAG
    `,
    '1.0.0-beta.27': `
        [MH-beta][Corrección] Reparada la lista de objetos: la Serpiente Agonizante no existía en ella, lo que provocaba errores al actualizar con una serpiente agonizante
        [MH][Corrección] Reparado el mapa integrado de GH (pero no, sigue sin incluir las expediciones)

        [MH][Mejora] La lista de ciudadanos mejorada, en la ciudad, ahora está mejor organizada y sigue ordenada alfabéticamente. Contrapartida: tarda un poco más en cargar
        [MH][Mejora] El Pasaje en vigor ahora forma parte de las AH registradas
    `,
    '1.0.0-beta.26': `
        [MH-beta][Mejora] MHO ahora soporta la actualización de FataMorgana en beta
    `,
    '1.0.0-beta.25': `
        [MH-beta][Corrección] Arreglo del envío de información a GH
    `,
    '1.0.0-beta.24': `
        [Corrección] Restablecida la URL de llamadas a la API que había desaparecido (magic everywhere)

        [MH-beta] desactivación de las llamadas a BBH y Fata. Se reactivarán si existe una versión compatible con la beta. Las opciones siguen siendo visibles pero no tendrán efecto
    `,
    '1.0.0-beta.23': `
        Añadido el script en el sitio de la beta de MH - ninguna novedad
    `,
    '1.0.0-beta.22': `
        Añadido el script en el sitio de la beta de MH - ninguna novedad
    `,
    '1.0.0-beta.21': `
        Añadido el script en el sitio de la beta de MH - ninguna novedad
    `,
    '1.0.0-beta.20': `
        [Corrección] Varios arreglos para anticipar caídas
    `,
    '1.0.0-beta.19': `
        [Corrección] El script falla si el usuario no tiene acciones heroicas
    `,
    '1.0.0-beta.18': `
        [Corrección] El estado "Cuerpo Sano" nunca se enviaba a GH
    `,
    '1.0.0-beta.17': `
        [Corrección] Era imposible registrar la mochila en MHO si tenías el mismo objeto dos veces dentro (uy)
    `,
    '1.0.0-beta.16': `
        [Novedad] Hay disponibles dos nuevas opciones para actualizar GH: la actualización automática de los poderes heroicos y la actualización de las mejoras de la casa. ¡No olvides activarlas en tus opciones!
    `,
    '1.0.0-beta.15': `
        [Corrección] Envío de la información correcta a GH
    `,
    '1.0.0-beta.14': `
        [Novedad] Ahora se pueden registrar informaciones adicionales en MHO. ¡No olvides marcar las opciones asociadas!
    `,
    '1.0.0-beta.13': `
        [Corrección] Arreglo del comportamiento al actualizar GH
    `,
    '1.0.0-beta.12': `
        [Corrección] Arreglo de los errores relacionados con la actualización del contenido de las mochilas
    `,
    '1.0.0-beta.11': `
        [Corrección] ¡La visualización del botón tras las actualizaciones debería estar corregida!
    `,
    '1.0.0-beta.10': `
        [Novedad] Ahora es posible registrar el contenido de la mochila mediante el botón de actualización de las herramientas externas. Las mochilas se pueden consultar y modificar desde la lista de ciudadanos del sitio web de MHO.
        ¡No olvides activar la opción asociada desde tus ajustes para que esta actualización sea posible!

        [Traducciones] ¡Gracias a isaaclw, que nos ha proporcionado algunas traducciones al inglés! Si quieres contribuir a la traducción, no dudes en unirte al discord o contactarme por MP
    `,
    '1.0.0-beta.09': `
        [Novedad] Ahora es posible registrar el contenido de la mochila mediante el botón de actualización de las herramientas externas. Las mochilas se pueden consultar y modificar desde la lista de ciudadanos del sitio web de MHO.
        ¡No olvides activar la opción asociada desde tus ajustes para que esta actualización sea posible!

        [Traducciones] ¡Gracias a isaaclw, que nos ha proporcionado algunas traducciones al inglés! Si quieres contribuir a la traducción, no dudes en unirte al discord o contactarme por MP
    `,
    '1.0.0-beta.08': `
        [Corrección] Varios arreglos para intentar que el script funcione para los usuarios de iOS.
        [Corrección] Eliminado un objeto reportado por la API de MH pero que ya no existe
        [Corrección] Se mostraba un error al actualizar las apps externas sin haberlas marcado todas (aunque la actualización se realizaba bien)
    `,
    '1.0.0-beta.07': `
        [Corrección] Arreglo del registro del estado de casilla agotada en GH
    `,
    '1.0.0-beta.06': `
        [Corrección] Arreglo del registro del número de zombis matados en GH

        [Importante] Hemos cambiado la estructura de la base de datos. No hemos recuperado las listas de la compra existentes. Si necesitas conservar tu lista de la compra, contáctanos en el discord de MHO para que te la recuperemos.
    `,
    '1.0.0-beta.05': `
        [Novedad] Interfaz para recuperar la evolución de cada ciudadano (en la página de ciudadanos)
        [Novedad] Nueva opción para enviar a GH el número de zombis matados en la casilla, para poder poner marcadores de zombis

        [Importante] Hemos cambiado la estructura de la base de datos. No hemos recuperado las listas de la compra existentes. Si necesitas conservar tu lista de la compra, contáctanos en el discord de MHO para que te la recuperemos.
    `,
    '1.0.0-beta.04': `
        [Importante] Hemos cambiado la estructura de la base de datos. No hemos recuperado las listas de la compra existentes. Si necesitas conservar tu lista de la compra, contáctanos en el discord de MHO para que te la recuperemos.
    `,
    '1.0.0-beta.03': `
        [Importante] Hemos cambiado la estructura de la base de datos. No hemos recuperado las listas de la compra existentes. Si necesitas conservar tu lista de la compra, contáctanos en el discord de MHO para que te la recuperemos.
    `,
    '1.0.0-beta.02': `
        [Importante] Hemos cambiado la estructura de la base de datos. No hemos recuperado las listas de la compra existentes. Si necesitas conservar tu lista de la compra, contáctanos en el discord de MHO para que te la recuperemos.
    `,
    '1.0.0-beta.01': `
        [Importante] Hemos cambiado la estructura de la base de datos. No hemos recuperado las listas de la compra existentes. Si necesitas conservar tu lista de la compra, contáctanos en el discord de MHO para que te la recuperemos.
    `,
    '1.0.0-alpha.73': `
        [Corrección] Reparada la búsqueda de construcciones
    `,
    '1.0.0-alpha.72': `
        [Eliminación] Eliminada la funcionalidad experimental de prevención de acciones peligrosas (cianuro / dependencia)
    `,
    '1.0.0-alpha.71': `
        [Corrección] Reparado el filtro de las construcciones
    `,
    '1.0.0-alpha.70': `
        [Novedad] Añadido el cálculo del número de zombis que van a morir de desesperación en una casilla
        [Novedad] Ya no es necesario indicar el id de app externa
    `,
    '1.0.0-alpha.69': `
        [Novedad] Añadido el cálculo del número de zombis que van a morir de desesperación en una casilla
        [Novedad] Ya no es necesario indicar el id de app externa
    `,
    '1.0.0-alpha.68': `
        [Novedad] Añadido el cálculo del número de zombis que van a morir de desesperación en una casilla
        [Novedad] Ya no es necesario indicar tú mismo el id de app externa
    `,
    '1.0.0-alpha.67': `
        [Corrección] Intentamos mejorar el rendimiento
    `,
    '1.0.0-alpha.66': `
        [Novedad] Añadido un certificado de seguridad
    `,
    '1.0.0-alpha.65': `
        [Corrección] Añadida una frase explicativa en el campo de añadir un objeto a la lista de la compra

        [Novedad] En la lista de la compra, añadida la posibilidad de seleccionar un lugar donde llevar el objeto (banco o zona de repatriación)
    `,
    '1.0.0-alpha.64': `
        [Corrección] Añadida una frase explicativa en el campo de añadir un objeto a la lista de la compra

        [Novedad] En la lista de la compra, añadida la posibilidad de seleccionar un lugar donde llevar el objeto (banco o zona de repatriación)
    `,
    '1.0.0-alpha.63': `
        [Corrección] Añadida una frase explicativa en el campo de añadir un objeto a la lista de la compra

        [Novedad] En la lista de la compra, añadida la posibilidad de seleccionar un lugar donde llevar el objeto (banco o zona de repatriación)
    `,
    '1.0.0-alpha.62': `
        [Mejora] Tras copiar un mapa, el texto del botón informa explícitamente al usuario
    `,
    '1.0.0-alpha.61': `
        [Corrección] Corregido el enlace de discord, que solo funcionó una vez antes de decidir unilateralmente volverse inutilizable
    `,
    '1.0.0-alpha.60': `
        [Novedad] Sustituido el enlace de correo por un enlace de discord
        [Novedad] Los añadidos de interfaz en el juego se identifican claramente como procedentes de MHO
    `,
    '1.0.0-alpha.59': `
        [Corrección] La visualización del "aura" de prioridad había dejado de funcionar
    `,
    '1.0.0-alpha.58': `
        [Corrección] Visualización de la lista de la compra en la página
        [Corrección] Visualización de algunos iconos en las recetas
    `,
    '1.0.0-alpha.57': `
        [Corrección] Visualización de la lista de la compra en la página
    `,
    '1.0.0-alpha.56': `
        [Novedad] Traducción al español (¡Gracias Nekomine!)
    `,
    '1.0.0-alpha.55': `
        [Novedad] Traducción al español (¡Gracias Nekomine!)
    `,
    '1.0.0-alpha.54': `
        [Corrección] Si no había wishlist registrada, la pantalla de wishlist no funcionaba
    `,
    '1.0.0-alpha.53': `
        [Corrección] La posición del campo de traducción ya no bloquea el botón de encuesta
    `,
    '1.0.0-alpha.52': `
        [Corrección] Imágenes de los objetos

        [Novedad] Añadido un botón para retirar tu ID de apps externas de MHO sin tener que pasar por los ajustes de la extensión
        [Novedad] Añadida la fecha de última actualización de la lista de la compra en la página de lista de la compra
    `,
    '1.0.0-alpha.51': `
        [Corrección] Migración de servidor para intentar no tener más problemas de cuota (cruzamos los dedos para que siga funcionando después de esto...). La migración, por desgracia, aún no afecta al camping ni a la lista de edificios
    `,
    '1.0.0-alpha.50': `
        [Corrección] Migración de servidor para intentar no tener más problemas de cuota (cruzamos los dedos para que siga funcionando después de esto...). La migración, por desgracia, aún no afecta al camping ni a la lista de edificios
    `,
    '1.0.0-alpha.49': `
        [Novedad] Lista de edificios y probabilidades de los objetos que se pueden encontrar en ellos, todo esto en "Wiki" > "Edificios"

        [Experimental] Estimación de las posibilidades de supervivencia en camping. Está en "Herramientas" > "Camping"
    `,
    '1.0.0-alpha.48': `
        [Eliminación] Eliminada la funcionalidad de estimación. El modo de cálculo ha cambiado, como estaba previsto, dejando la funcionalidad inservible
    `,
    '1.0.0-alpha.47': `
        [Mejora] Añadidos el stock en el banco y el stock deseado en el tooltip avanzado
    `,
    '1.0.0-alpha.46': `
        [Mejora] Traducciones para la funcionalidad de estimación del ataque (quedan pocos días para usarla antes de que desaparezca)
    `,
    '1.0.0-alpha.45': `
        [Novedad] Nueva opción para mostrar el umbral (70% + 1pa) al que reparar las construcciones para que no sean destruidas en Pandé
    `,
    '1.0.0-alpha.44': `
        [Experimental] Funcionalidad (temporal) de estimación del ataque
    `,
    '1.0.0-alpha.43': `
        [Experimental] Funcionalidad (temporal) de estimación del ataque
    `,
    '1.0.0-alpha.42': `
        [Corrección] Uy, me olvidé de reactivar la opción del mapa, estaba bien implementada pero era imposible activarla ^^'
        [Corrección] Llevo un tiempo intentando mejorar la funcionalidad de notificación al final de la búsqueda, parece más estable

        [Mejora] Añadidos los PA del café en el tooltip mejorado
    `,
    '1.0.0-alpha.41': `
        [Novedad] Reimplementada la funcionalidad de consulta de mapa, que había sido eliminada.
        Ahora los mapas se reconstruyen a partir de los datos obtenidos al hacer clic en el botón "copiar".
        Por eso es normal que el diseño de tu mapa no sea idéntico al de tu herramienta favorita.
    `,
    '1.0.0-alpha.40': `
        [Novedad] Reimplementada la funcionalidad de consulta de mapa, que había sido eliminada.
        Ahora los mapas se reconstruyen a partir de los datos obtenidos al hacer clic en el botón "copiar".
        Por eso es normal que el diseño de tu mapa no sea idéntico al de tu herramienta favorita.
    `,
    '1.0.0-alpha.39': `
        [Temporal] Uso del inglés en lugar del español mientras no tengamos las traducciones al español
    `,
    '1.0.0-alpha.38': `
        [Corrección] Añadir un elemento a la lista de la compra desde la página de lista de la compra ahora debería funcionar correctamente
    `,
    '1.0.0-alpha.37': `
        [Corrección] Eliminada la opción para copiar los mapas de las herramientas externas debido a un bug de Tampermonkey
        [Corrección] Añadir un elemento a la lista de la compra desde la página de lista de la compra ahora debería funcionar correctamente
    `,
    '1.0.0-alpha.36': `
        [Corrección] Activar el script provocaba la desaparición de un elemento de fondo del sitio
    `,
    '1.0.0-alpha.35': `
        [Corrección] Si se rechazaba un permiso, no se podía acceder al sitio

        [Mejora] Añadido el enlace a la documentación en la descripción del script, para que sea accesible antes de cualquier instalación
    `,
    '1.0.0-alpha.34': `
        [Corrección] Ordenaciones no siempre funcionales
        [Corrección] Visualización de la etiqueta del botón en Fata Morgana / Chrome
    `,
    '1.0.0-alpha.33': `
        [Mejora] Si una de las herramientas externas no se actualiza bien, se muestra el detalle de éxitos y fallos

        [Novedad] Compatibilidad con Violentmonkey
    `,
    '1.0.0-alpha.32': `
        [Corrección] Recuperación del mapa desde GH tras la nueva versión (pero el mapa sigue incompleto :'( )

        [Atención] Tras la actualización a la V2 de Gest'Hordes, la actualización mediante el script y el sitio de MHO ya no es funcional. Estamos trabajando activamente en resolver el problema.
    `,
    '1.0.0-alpha.31': `
        [Novedad] Añadido un campo de selección de objetos con búsqueda en la lista de la compra
        [Novedad] Añadida una funcionalidad para copiar un mapa de una herramienta externa (mapa completo o mapa de ruina) y mostrarlo en MyHordes
    `,
    '1.0.0-alpha.30': `
        [Corrección] Corrige grandes ralentizaciones en toda la interfaz de la aplicación
    `,
    '1.0.0-alpha.29': `
        [Corrección] Corrige grandes ralentizaciones en toda la interfaz de la aplicación
    `,
    '1.0.0-alpha.28': `
        [Corrección] Resuelve el problema de visualización de la barra de menú del juego cuando la opción de traducción está activada

        [Mejora] Añadidas las traducciones alemanas para la visualización de la herramienta de traducción
    `,
    '1.0.0-alpha.27': `
        [Mejora] Mejorada la funcionalidad de traducción (copia de una etiqueta, mostrar los resultados inexactos)
    `,
    '1.0.0-alpha.26': `
        [Mejora] Mejorada la funcionalidad de traducción (copia de una etiqueta, mostrar los resultados inexactos)
    `,
    '1.0.0-alpha.25': `
        [Mejora] Añadida una funcionalidad de traducción de los elementos de MyHordes
    `,
    '1.0.0-alpha.24': `
        [Mejora] Añadida una funcionalidad de traducción de los elementos de MyHordes
    `,
    '1.0.0-alpha.23': `
        [Mejora] Añadida una funcionalidad de traducción de los elementos de MyHordes
    `,
    '1.0.0-alpha.22': `
        [Mejora] Añadida una funcionalidad de traducción de los elementos de MyHordes
    `,
    '1.0.0-alpha.21': `
        [Mejora] Añadida una funcionalidad de traducción de los elementos de MyHordes
    `,
    '1.0.0-alpha.20': `
        [Mejora] Añadidas las traducciones inglesas y alemanas, gracias Katt y Shokolaw
    `,
    '1.0.0-alpha.19': `
        [Mejora] Rediseño de los ajustes para mayor legibilidad

        [Novedad] Añadido un campo de búsqueda en la lista de construcciones
    `,
    '1.0.0-alpha.18': `
        [Corrección] Errata

        [Mejora] Añadida la información "Objeto de camping" en el tooltip mejorado
    `,
    '1.0.0-alpha.17': `
        [Novedad] Visualización del número de zombis muertos hoy en la casilla
    `,
    '1.0.0-alpha.16': `
        [Corrección] Error 500 al cargar el script cuando no se está en la ciudad
        [Corrección] Comportamiento de la notificación de búsqueda terminada
    `,
    '1.0.0-alpha.15': `
        [Mejora] Añadidas algunas propiedades de objetos en los tooltips mejorados

        [Novedad] Añadida una opción para ser avisado al finalizar la búsqueda
    `,
    '1.0.0-alpha.14': `
        [Mejora] Añadido un nivel "trashlist" a la lista de la compra, que se muestra en gris
        [Mejora] Cambio en los colores de los elementos de la lista de la compra
        [Mejora] Los colores de las prioridades también se muestran en la imagen del objeto en la lista de la compra integrada
        [Mejora] Visualización de algunas propiedades en los tooltips de los objetos si la opción "mostrar tooltips detallados" está activada

        [Novedad] [experimental] Añadida una opción para pedir confirmación antes de realizar acciones "peligrosas" (consumo de cianuro, consumo de droga si ya se está drogado)
    `,
    '1.0.0-alpha.13': `
        [Corrección] Arreglo de la visualización del nombre del script
    `,
    '1.0.0-alpha.12': `
        [Corrección] Añadido a la lista de la compra desde la lista de objetos

        [Mejora] Visualización de los ajustes

        [Novedad] Visualización de la versión
        [Novedad] Visualización del changelog tras una actualización
    `,
};
