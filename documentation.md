Integración con la API de LI.FI: Documentación Técnica y Endpoints
Documentación oficial y SDK 📖

La plataforma LI.FI ofrece una API REST unificada y también un SDK JavaScript/TypeScript para integrar swaps y puentes entre cadenas
docs.li.fi
. La documentación oficial se encuentra en docs.li.fi, que incluye tanto la referencia detallada del API (endpoints, parámetros, etc.) como guías de uso del SDK. Por ejemplo, LI.FI proporciona un cliente NPM (@lifi/sdk) opcional que simplifica la obtención de rutas (getRoutes) y cotizaciones (getQuote) desde aplicaciones JavaScript/TypeScript
docs.li.fi
docs.li.fi
. No obstante, es totalmente válido interactuar directamente con la API REST descrita a continuación. El Base URL para todas las llamadas es https://li.quest/v1 
docs.li.fi
 (usando HTTPS).

Autenticación y claves de API 🔑

No se requiere una clave de API para usar la API de LI.FI de forma básica
docs.li.fi
. Todos los endpoints son accesibles públicamente bajo límites de tasa predeterminados. Sin embargo, LI.FI ofrece claves de API para aumentar los límites de peticiones en integraciones de alto volumen. En caso de usar una clave personalizada, esta se envía mediante el header HTTP x-lifi-api-key
docs.li.fi
 en cada petición. Por ejemplo, una llamada con clave se vería así (resumido):

curl 'https://li.quest/v1/quote?fromChain=100&fromToken=0x4ecab...&toChain=137&toToken=0x2791...&fromAmount=1000000&slippage=0.03&fromAddress=0x5520...&toAddress=0x5520...' \
     --header 'x-lifi-api-key: TU_CLAVE_API'


(En este ejemplo se cotiza enviar 1 USDT (6 decimales = 1000000 unidades) de Gnosis Chain (ID 100, token USDT 0x4ecab...) hacia USDC en Polygon (ID 137, token 0x2791...), con 3% de slippage permitido)
docs.li.fi
.

Límites de peticiones: Sin autenticación, el límite es ~200 solicitudes por 2 horas (por IP), incluyendo cotizaciones y demás endpoints
docs.li.fi
. Con API key, el límite sube aproximadamente a 200 solicitudes por minuto (aplicadas como ventana móvil de 2 horas)
docs.li.fi
. Las respuestas incluyen cabeceras ratelimit-limit, ratelimit-remaining y ratelimit-reset para monitorear el consumo
docs.li.fi
. Si se exceden los límites, la API retornará 429 Too Many Requests indicando cuánto tiempo esperar para reanudar
docs.li.fi
.

Mejores prácticas: LI.FI recomienda cachar resultados de endpoints estáticos como la lista de tokens o cadenas (GET /tokens, GET /chains) para no consultarlos repetidamente
docs.li.fi
. Estos datos cambian infrecuentemente, por lo que obtenerlos al iniciar la aplicación (y refrescarlos esporádicamente) suele ser suficiente. Asimismo, se aconseja evitar hacer polling excesivo de la API; por ejemplo, al calcular cotizaciones en una interfaz de usuario, conviene implementar debounce o agrupar solicitudes en vez de disparar una petición en cada tecla ingresada
docs.li.fi
. Cumpliendo estas pautas se reduce la probabilidad de alcanzar los límites y se mejora el rendimiento de la integración.

Endpoints principales 📝

A continuación se resumen los endpoints más relevantes para integrar puentes (bridges) y swaps multi-cadena con LI.FI:

Lista de cadenas soportadas – GET /chains: Retorna todas las blockchains soportadas por LI.FI con metadatos como identificador (chainId), nombre, tipo (EVM, UTXO, etc.), símbolo de la moneda nativa, etc
docs.li.fi
. Por ejemplo, Ethereum aparece con id: 1, name: "Ethereum", coin: "ETH", chainType: "EVM", mainnet: true, etc. Este endpoint permite conocer qué redes (incluyendo ciertas L2, sidechains, e incluso Bitcoin/Solana/Sui) están disponibles para puentear o swapear
docs.li.fi
.

Listado de tokens soportados – GET /tokens: Devuelve todos los tokens conocidos por el agregador LI.FI, organizados por cadena. La respuesta es un JSON donde cada key es una cadena y contiene un arreglo de tokens con campos como dirección (address), símbolo (symbol), número de decimales (decimals), chainId, nombre y opcionalmente el precio en USD
docs.li.fi
. Es posible filtrar por redes específicas usando query params (chains=) o por tipo de cadena (chainTypes=), así como fijar un umbral mínimo de precio (minPriceUSD) para excluir tokens de valor muy bajo
docs.li.fi
. Ejemplo: un fragmento de respuesta puede mostrar en Polygon (137) el token DAI con su dirección (0x8f3cf7...), símbolo DAI, 18 decimales, nombre "Dai Stablecoin", precio ~1 USD, etc
docs.li.fi
. Este catálogo es útil para poblar listas de activos en la interfaz de usuario.

Información de un token específico – GET /token?chain=<id>&token=<addr|symbol>: Permite consultar los metadatos de un token concreto indicando la cadena y la dirección (o símbolo) del token
docs.li.fi
docs.li.fi
. Retorna la misma estructura de campos que /tokens pero solo para el token solicitado (dirección, símbolo, decimales, nombre, precio, logo, etc.)
docs.li.fi
docs.li.fi
. Por ejemplo, se puede obtener información del USDC en Ethereum pasando chain=1&token=USDC o la dirección correspondiente.

Bridges y exchanges disponibles – GET /tools: Devuelve la lista de herramientas integradas en LI.FI, separadas en bridges (puentes cross-chain) y exchanges (DEXs o agregadores on-chain)
docs.li.fi
docs.li.fi
. Cada entrada incluye un identificador (key), nombre, logo y las cadenas soportadas. Por ejemplo, en bridges se listan opciones como Hop, Connext, Across, etc., con qué pares de cadenas operan
docs.li.fi
; en exchanges figuran agregadores como 1inch, Paraswap, 0x, etc., junto a las cadenas en que están disponibles
docs.li.fi
. Este endpoint es útil para saber qué protocolos de liquidez están siendo usados bajo el capó.

Conexiones posibles entre cadenas – GET /connections: Muestra todas las rutas de transferencia posibles entre orígenes y destinos soportados, considerando diferentes tokens
docs.li.fi
docs.li.fi
. Nota: Por defecto retorna muchísima información, por lo que se requiere filtrar al menos por una cadena, token o herramienta para obtener resultados
docs.li.fi
. Con parámetros fromChain, toChain y opcionalmente fromToken/toToken, responde qué tokens se pueden enviar desde la cadena de origen y en qué tokens podrían convertirse en la cadena destino
docs.li.fi
docs.li.fi
. También admite filtros allowBridges/Exchanges o denyBridges/Exchanges para considerar o excluir ciertas herramientas específicas
docs.li.fi
docs.li.fi
. Este endpoint es informativo para conocer qué vías teóricamente existen entre dos redes (por ejemplo, saber que de Polygon a Arbitrum se puede transferir USDC, USDT, DAI, ETH, etc., según los puentes disponibles). En general, para la integración típica no es estrictamente necesario llamar a /connections (ya que /quote encontrará la ruta automáticamente), pero puede ser útil para pre-chequear compatibilidad de un par cadena/token.

Estado de transacción cross-chain – GET /status?transactionId=<id>: Permite verificar el estado de una transferencia (swap/bridge) iniciada previamente. Dado un transactionId (ID único que la API proporciona al obtener una ruta/cotización), este endpoint indica si la operación está pendiente, completada, fallida, etc., y detalles de subestado
help.li.fi
. Esto es importante para rastrear transfers que involucran múltiples transacciones (ej. salida de una red y recepción en otra). Nota: LI.FI también provee una interfaz Explorer (explorer.li.fi) donde se puede pegar el transactionId o hash para monitorear el progreso.

A continuación profundizamos en algunos de los endpoints clave para la funcionalidad de cotización y ruteo de swaps/puentes.

Cotizaciones de swaps/bridges y rutas óptimas 🚀

El endpoint principal para cotizaciones es GET /quote. Este endpoint calcula y devuelve la mejor ruta disponible para convertir un token origen en otro token destino (puede involucrar un simple swap en la misma cadena, un puente cross-chain, o combinación de ambos, según el caso). Por diseño, /quote siempre selecciona automáticamente la ruta óptima de un solo paso (es decir, que pueda ejecutarse en una única transacción) y entrega los datos listos para ejecutar esa transacción
help.li.fi
. Es una solución “one-stop” que toma los parámetros de entrada (cadena y token de origen, cadena y token destino, cantidad, direcciones, slippage, etc.) y responde con un objeto de tipo Step que incluye tanto la estimación del resultado como la transacción preparada para realizar el swap/bridge
docs.li.fi
. En el campo estimate se indica el monto esperado (toAmount) y el mínimo garantizado (toAmountMin) del token de destino, ya teniendo en cuenta el slippage tolerado
docs.li.fi
. Adicionalmente, se provee la información de qué herramienta (bridge o DEX) se usará (tool), y un objeto transactionRequest o similar con los datos necesarios (calldata, direcciones, etc.) para firmar/enviar la transacción en la cadena de origen. En esencia, /quote simplifica el proceso al retornar directamente la mejor ruta ejecutable en una sola tx
help.li.fi
.

Parámetros principales de /quote: se especifican en la query string. Los obligatorios incluyen: fromChain y toChain (IDs o claves de las cadenas origen y destino)
docs.li.fi
docs.li.fi
, fromToken y toToken (direcciones o símbolos de los tokens de origen y destino en sus respectivas cadenas)
docs.li.fi
docs.li.fi
, fromAmount (cantidad a enviar, en la unidad mínima del token, p. ej. wei para ETH o número entero considerando decimales)
docs.li.fi
, y fromAddress (dirección del remitente que realizará la transacción on-chain)
docs.li.fi
. Opcionalmente se puede indicar toAddress (receptor en la cadena destino, si difiere del remitente; por defecto, si no se pasa, se asume la misma dirección de origen)
docs.li.fi
.

Hay parámetros adicionales útiles: por ejemplo, slippage para establecer la tolerancia de deslizamiento de precio
docs.li.fi
 (si no se proporciona, la API usa un valor por defecto; típicamente ~0.5-1%). También order para priorizar la ruta más rápida vs más barata según prefiera el usuario
docs.li.fi
docs.li.fi
 (opciones: FASTEST o CHEAPEST; si no se indica, LI.FI suele devolver la ruta de mayor retorno, es decir la más barata en términos de tokens recibidos netos). Adicionalmente, existen filtros como allowBridges/denyBridges y allowExchanges/denyExchanges para forzar o excluir ciertas integraciones en la ruta
docs.li.fi
docs.li.fi
 (por ejemplo, restringir a usar solo un puente específico, o no usar cierto DEX). En la mayoría de casos no es necesario especificarlos, dejando que el algoritmo elija automáticamente entre todas las opciones disponibles.

Ejemplo de uso de /quote: Supongamos que queremos puentear 10 USDC desde Arbitrum a Optimism recibiendo DAI. Llamaríamos GET /quote con fromChain=42161 (Arbitrum), toChain=10 (Optimism), fromToken=<USDC_addr_in_Arbitrum>, toToken=<DAI_addr_in_Optimism>, fromAmount=10000000 (10 * 10^6, ya que USDC tiene 6 decimales), y las direcciones de envío/recepción correspondientes
docs.li.fi
. La respuesta contendrá, por ejemplo, que LI.FI ha seleccionado usar el puente Hop seguido de un swap en Optimism, o algún bridge de su elección, indicando que el usuario recibirá aproximadamente 10 DAI (menos comisiones) en Optimism. También incluirá el calldata ya apuntando al contrato puente con los parámetros adecuados, que podrá ejecutarse directamente desde el front-end o backend de la dApp.

En caso de que no exista ruta posible para la conversión solicitada (por ejemplo, token no soportado en alguna cadena, o falta de liquidez), /quote retornará un error con código 1002 (NoQuoteError) y un mensaje indicándolo
docs.li.fi
. La API provee detalles adicionales en errors cuando esto ocurre, especificando qué sub-tool falló o si fue falta de liquidez
docs.li.fi
docs.li.fi
. Por ejemplo, podría señalar code: "INSUFFICIENT_LIQUIDITY" si ningún DEX/bridge tiene liquidez suficiente para ese par y monto
docs.li.fi
.

Rutas avanzadas: Para casos más complejos, LI.FI expone también el endpoint GET /advanced/routes. A diferencia de /quote, este devuelve un conjunto de rutas potenciales en lugar de elegir una sola
help.li.fi
. Incluirá tanto rutas de un solo paso como aquellas de múltiples pasos (donde quizá se requiera una segunda transacción manual en destino para hacer un swap final)
help.li.fi
help.li.fi
. Es decir, /advanced/routes no aplica el filtro de “una sola tx” y puede proponer soluciones donde, por ejemplo, primero se puentean fondos al token intermedio X en la cadena destino, y luego el usuario debe ejecutar otro swap de X a el token final deseado. Este endpoint no genera datos de transacción automáticamente
help.li.fi
; más bien entrega todas las posibles rutas (con detalles de pasos, herramientas, tiempos y retornos estimados) para que el integrador decida. Tras seleccionar una ruta de la respuesta, se puede entonces llamar a GET /advanced/stepTransaction proporcionando el Step específico, y la API devolverá el payload transaccional para ese paso
help.li.fi
. En general, si solo se desea la “mejor ruta” se recomienda usar /quote (más sencillo); el modo avanzado está pensado para integradores que requieran controlar pasos individuales o presentar varias opciones al usuario. (De hecho, la propia documentación señala que los endpoints bajo /advanced son complejos y es preferible utilizarlos a través del SDK oficial, que se encarga de orquestarlos
help.li.fi
.)

Profundidad de liquidez, slippage y límites de monto 💧

LI.FI actúa como agregador de múltiples DEXs y bridges, por lo que automáticamente trata de optimizar la ruta considerando la liquidez disponible en cada opción. No existe un endpoint explícito para “profundidad de liquidez” de un par, pero la API reflejará las limitaciones de liquidez a través de sus cotizaciones y errores. Por ejemplo, si se solicita un monto extremadamente grande que ninguna ruta soporta, el resultado será un error AMOUNT_TOO_HIGH indicando que la cantidad es muy alta para ser transferida con alguna de las herramientas disponibles
docs.li.fi
. Asimismo, si solo una parte del monto tendría liquidez, la API podría devolver una ruta pero con un retorno muy menor al esperado (indicando alto impacto de precio), o directamente filtrar rutas con impacto de precio elevado. De hecho, el integrador puede utilizar el parámetro maxPriceImpact en /quote para que LI.FI descarte rutas cuyo impacto de precio supere cierto porcentaje (por defecto, la API oculta rutas con >10% de slippage estimado)
docs.li.fi
.

Respecto al slippage (deslizamiento): es configurable vía parámetro slippage en cada cotización
docs.li.fi
. Este valor (ej. 0.01 = 1%) define el colchón de tolerancia entre el monto mínimo garantizado y el estimado. La respuesta de /quote incluye toAmountMin, que es la cantidad mínima garantizada del token destino tras aplicar el slippage permitido
docs.li.fi
. LI.FI asegurará ese mínimo utilizando swaps protegidos con amountOutMin y límites en puentes, de modo que si la conversión no puede entregar al menos ese toAmountMin, la transacción revertiría on-chain (evitando pérdidas excesivas por deslizamiento). Es importante elegir un slippage razonable: muy bajo puede ocasionar que la tx falle con volatilidad normal, muy alto puede exponer al usuario a malos precios.

En cuanto a límites máximos, cada protocolo subyacente tiene restricciones (por ejemplo, ciertos bridges tienen topes diarios o por transacción). LI.FI no publica una lista fija de límites por token, pero al consultar /quote con montos elevados se obtendrá implícitamente esa información: si ninguna ruta puede manejar ese tamaño, se comunicará mediante los errores mencionados (como INSUFFICIENT_LIQUIDITY o AMOUNT_TOO_HIGH)
docs.li.fi
. Una práctica posible es realizar una cotización previa con un monto muy grande para ver si la API devuelve un error, aunque normalmente esto no es necesario; es mejor consultar montos reales de uso, y manejar errores caso a caso.

Tokens y cadenas soportadas 🪙🌐

LI.FI soporta un amplio conjunto de cadenas de bloques y tokens, actuando como meta-agregador. Para descubrir todas las cadenas disponibles, se utiliza el endpoint GET /chains mencionado, que actualmente incluye más de 30 redes EVM (Ethereum, BSC, Polygon, Arbitrum, Optimism, Avalanche, etc.), además de otras arquitecturas como Solana, Sui e incluso la red Bitcoin (LI.FI facilita puentes desde/hacia BTC nativo a cadenas EVM)
docs.li.fi
. Cada objeto de cadena detalla también configuraciones útiles: direcciones de multicall, URLs de exploradores y RPC, moneda nativa para Metamask, faucets en testnet si aplica, etc.
docs.li.fi
docs.li.fi
. El campo booleano mainnet indica si es una red principal (true) o una testnet (false). Ejemplo: en la respuesta, id: 56 corresponde a BSC Mainnet con name: "BSC" y mainnet: true
docs.li.fi
docs.li.fi
, mientras que una testnet como Goerli Ethereum aparecería con mainnet: false (en el entorno de staging, ver sección siguiente).

Para obtener todos los tokens soportados, GET /tokens listará miles de tokens agrupados por chain. Este catálogo se alimenta de múltiples listas (Uniswap, PancakeSwap, etc.) y se actualiza periódicamente. Incluye tanto tokens canónicos como sus versiones puente (por ejemplo, USDC puede figurar en Ethereum, Polygon, Avalanche, etc. bajo el mismo coinKey USDC). Dada la gran cantidad, se suelen usar filtros: por ejemplo, .../tokens?chains=1,137 para traer solo Ethereum y Polygon, o minPriceUSD=0.5 para excluir tokens cuyo precio sea menor a $0.5
docs.li.fi
. Nota: los precios USD proporcionados son aproximados en base a oráculos/market data integrados en LI.FI, útiles para mostrar valores estimados.

Si se necesita info puntual, GET /token con parámetros es más eficiente. Un caso común es que la dApp conozca símbolos o direcciones y quiera validar si LI.FI los soporta; este endpoint confirmará y devolverá el formato normalizado del token
docs.li.fi
docs.li.fi
. Por ejemplo, preguntando por chain=137&token=DAI obtendríamos la dirección de DAI en Polygon (0x8f3cf7...) junto con sus decimales (18), nombre, etc. Igualmente, pedir chain=1&token=0xa0b869... (dirección de USDC en Ethereum) retornará símbolo USDC, 6 decimales, coinKey: USDC, precio ~1, etc., con lo cual se puede poblar la UI o cotejar direcciones ingresadas por el usuario.

Cabe destacar que LI.FI armoniza las diferentes versiones de un mismo activo mediante el campo coinKey. Por ejemplo, USDT en Ethereum, Polygon, Arbitrum, etc., todas tendrán "coinKey": "USDT"
docs.li.fi
docs.li.fi
, facilitando a la aplicación identificar “es el mismo activo en distintas redes”. Esto es útil para presentar al usuario opciones de puente entre “el mismo token” cross-chain sin confusión de variantes.

Analytics y estadísticas de volumen 📊

La API de LI.FI incluye endpoints bajo el sub-path /analytics pensados para integradores que deseen obtener datos de las transferencias realizadas a través de LI.FI. Por ejemplo, GET /analytics/transfers permite filtrar y listar transferencias históricas por distintos criterios (por integrador, por dirección de usuario, por rango de tiempo, por cadenas, por token, estado, etc.)
docs.li.fi
docs.li.fi
. Este endpoint devuelve hasta 1000 transferencias en la consulta (para más, existe una variante paginada en /analytics/transfers/v2 con cursores)
docs.li.fi
docs.li.fi
. Cada transferencia incluye detalles como monto, token y cadena de origen, token y cadena de destino, dirección emisora y receptora, timestamps, herramienta utilizada, estatus (PENDING, DONE, FAILED)
docs.li.fi
docs.li.fi
, e incluso desgloses de gas usado y link al explorador LI.FI
docs.li.fi
docs.li.fi
.

Si el objetivo es obtener estadísticas agregadas de volumen (e.g. sumas de montos transferidos en ciertas ventanas de tiempo), actualmente no hay un endpoint tipo "estadísticas 24h" directo. Sin embargo, utilizando /analytics/transfers se puede lograr: por ejemplo, filtrando por fromTimestamp y toTimestamp adecuados para abarcar las últimas 24 horas, 7 días o 30 días
docs.li.fi
, y luego sumando los campos amountUSD de las transferencias obtenidas. La API proporciona en cada transferencia un cálculo del amountUSD transferido (valor aproximado en USD del monto puenteado)
docs.li.fi
docs.li.fi
 que facilita este tipo de agregaciones. También existe un endpoint de resumen /analytics/transfers/summary que devuelve totales agrupados según ciertos criterios (por token y cadena destino, creo) para un rango dado
docs.li.fi
docs.li.fi
, aunque su uso es más avanzado.

En síntesis, sí es posible obtener métricas de volumen usando la API, pero requiere hacer las consultas de transfers filtradas y procesar los datos. Un integrador también puede optar por fuentes externas: por ejemplo, DefiLlama y otras plataformas rastrean el volumen de LI.FI a nivel global, pero desde la API propia se puede replicar enfocándose en su aplicación (usando el filtro integrator=<yourId> para ver el volumen generado por su integración específicamente)
docs.li.fi
.

Notas finales: uso en testnet vs. mainnet 🧪🚀

Una consideración importante es el entorno de la API según el tipo de red. La API en producción (https://li.quest/v1) soporta únicamente las cadenas mainnet (redes principales) estables
help.li.fi
. Las testnets (redes de prueba como Goerli, Sepolia, Mumbai, etc.) no están habilitadas en la URL de producción por motivos de estabilidad
help.li.fi
. En su lugar, LI.FI ofrece un entorno de staging para pruebas: https://staging.li.quest/v1, el cual sí incluye las testnets soportadas
help.li.fi
. Por lo tanto, si se desea integrar y hacer tests en redes de prueba, es necesario apuntar las llamadas de API al host de staging. Por ejemplo, para obtener una cotización en Polygon Mumbai, usar https://staging.li.quest/v1/quote?fromChain=80001.... En dicho entorno, endpoints como /chains listarán también las chains de prueba con mainnet: false. A la inversa, en producción esas entradas no aparecerán.

En cuanto al SDK de LI.FI, este también permite configurar el uso de testnet simplemente indicando el flag o base URL de staging en su configuración. Algunas herramientas de LI.FI (como el widget de swapping) detectan automáticamente el entorno según la red en la que esté la dApp, pero al nivel de API manual es responsabilidad del integrador usar la URL correcta.

Resumiendo: para mainnet se consume la API estándar, y para testnets se consume la API de staging. Salvo la diferencia de URL y redes disponibles, el funcionamiento y los endpoints son esencialmente los mismos en ambos entornos.

Referencias: La documentación oficial de LI.FI y su help center fueron utilizados para compilar esta información
docs.li.fi
help.li.fi
docs.li.fi
docs.li.fi
help.li.fi
, entre otras fuentes conectadas. Se recomienda siempre revisar la documentación actualizada en docs.li.fi para detalles adicionales, y utilizar las páginas de ejemplo (Playground) que ofrece LI.FI para probar llamadas de API en tiempo real.

Request Routes/Quotes

Copy page

Prior to executing any swap or bridging, you need to request the best route from our smart routing API..

The LI.FI SDK provides functionality to request routes and quotes, as well as to execute them. This guide will walk you through the process of making a request using getRoutes and getQuote functions.
​
How to request Routes
To get started, here is a simple example of how to request routes to bridge and swap 10 USDC on Arbitrum to the maximum amount of DAI on Optimism.

Copy

Ask AI
import { getRoutes } from '@lifi/sdk';

const routesRequest: RoutesRequest = {
  fromChainId: 42161, // Arbitrum
  toChainId: 10, // Optimism
  fromTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toTokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '10000000', // 10 USDC
};

const result = await getRoutes(routesRequest);
const routes = result.routes;
When you request routes, you receive an array of route objects containing the essential information to determine which route to take for a swap or bridging transfer. At this stage, transaction data is not included and must be requested separately. Read more Execute Routes/Quotes.
Additionally, if you would like to receive just one best option that our smart routing API can offer, it might be better to request a quote using getQuote.
​
Routes request parameters
The getRoutes function expects a RoutesRequest object, which specifies a desired any-to-any transfer and includes all the information needed to calculate the most efficient routes.
​
Parameters
Below are the parameters for the RoutesRequest interface along with their descriptions:
Parameter	Type	Required	Description
fromChainId	number	yes	The ID of the source chain (e.g., Ethereum mainnet is 1).
fromTokenAddress	string	yes	The contract address of the token on the source chain. Ensure this address corresponds to the specified fromChainId.
fromAmount	string	yes	The amount to be transferred from the source chain, specified in the smallest unit of the token (e.g., wei for ETH).
fromAddress	string	no	The address from which the tokens are being transferred.
toChainId	number	yes	The ID of the destination chain (e.g., Optimism is 10).
toTokenAddress	string	yes	The contract address of the token on the destination chain. Ensure this address corresponds to the specified toChainId.
toAddress	string	no	The address to which the tokens will be sent on the destination chain once the transaction is completed.
fromAmountForGas	string	no	Part of the LI.Fuel. Allows receiving a part of the bridged tokens as gas on the destination chain. Specified in the smallest unit of the token.
options	RouteOptions	no	Additional options for customizing the route. This is defined by the RouteOptions interface (detailed below, see Route Options).
​
Route Options
The RouteOptions interface allows for further customization of the route request. Below are the parameters for the RouteOptions interface along with their descriptions:
Parameter	Type	Required	Description
integrator	string	no	The identifier of the integrator, usually the dApp or company name. Ideally, this should be specified when configuring the SDK, but it can also be modified during a request
fee	number	no	The integrator fee percentage (e.g., 0.03 represents a 3% fee). This requires the integrator to be verified.
maxPriceImpact	number	no	Hides routes with a price impact greater than or equal to this value. (e.g., 0.3 represents 30%)
order	string	no	CHEAPEST - This sorting option prioritises routes with the highest estimated return amount. Users who value capital efficiency at the expense of speed and route complexity should choose the cheapest routes. FASTEST - This sorting option prioritizes routes with the shortest estimated execution time. Users who value speed and want their transactions to be completed as quickly as possible should choose the fastest routes.
slippage	number	no	The slippage tolerance, expressed as a decimal proportion (e.g., 0.005 represents 0.5%).
referrer	string	no	The wallet address of the referrer, for tracking purposes.
allowSwitchChain	boolean	no	Specifies whether to return routes that require chain switches (2-step routes).
allowDestinationCall	boolean	no	Specifies whether destination calls are enabled.
bridges	AllowDenyPrefer	no	An AllowDenyPrefer object to specify preferences for bridges.
exchanges	AllowDenyPrefer	no	An AllowDenyPrefer object to specify preferences for exchanges.
timing	Timing	no	A Timing object to specify preferences for Timing Strategies.
​
Allow/Deny/Prefer
The AllowDenyPrefer interface is used to specify preferences for bridges or exchanges. Using the allow option, you can allow tools, and only those tools will be used to find the best routes. Tools specified in deny will be blocklisted.
You can find all available keys in List: Chains, Bridges, DEX Aggregators, Solvers or get the available option from the API. See Chains and Tools.
Below are the parameters for the AllowDenyPrefer interface:
Parameter	Type	Required	Description
allow	string[]	no	A list of allowed bridges or exchanges (default: all).
deny	string[]	no	A list of denied bridges or exchanges (default: none).
prefer	string[]	no	A list of preferred bridges or exchanges (e.g., [‘1inch’] to prefer 1inch if available).
​
Timing
The Timing interface allows you to specify preferences for the timing of route execution. This can help optimize the performance of your requests based on timing strategies.
Parameters for the Timing interface:
Parameter	Type	Required	Description
swapStepTimingStrategies	TimingStrategy[]	no	An array of timing strategies specifically for each swap step in the route. This allows you to define custom strategies for timing control during the execution of individual swap steps.
routeTimingStrategies	TimingStrategy[]	no	An array of timing strategies that apply to the entire route. This enables you to set preferences for how routes are timed overall, potentially improving execution efficiency and reliability.
​
Timing Strategy
This can help optimize the timing of requests based on specific conditions.
Parameter	Type	Required	Description
strategy	string		The strategy type, which must be set to ‘minWaitTime’. This indicates that the timing strategy being applied is based on a minimum wait time.
minWaitTimeMs	number		The minimum wait time in milliseconds before any results are returned. This value ensures that the request waits for a specified duration to allow for more accurate results.
startingExpectedResults	number		The initial number of expected results that should be returned after the minimum wait time has elapsed. This helps in managing user expectations regarding the outcomes of the request.
reduceEveryMs	number		The interval in milliseconds at which the expected results are reduced as the wait time progresses. This parameter allows for dynamic adjustments to the expected results based on the elapsed time.
You can implement custom timing strategies to improve the user experience and optimize the performance of your application by controlling the timing of route execution.
​
Request a Quote
When you request a quote, our smart routing API provides the best available option. The quote includes all necessary information and transaction data required to initiate a swap or bridging transfer.
Here is a simple example of how to request a quote to bridge and swap 10 USDC on Arbitrum to the maximum amount of DAI on Optimism.

Copy

Ask AI
import { getQuote } from '@lifi/sdk';

const quoteRequest: QuoteRequest = {
  fromChain: 42161, // Arbitrum
  toChain: 10, // Optimism
  fromToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toToken: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '10000000', // 10 USDC
  // The address from which the tokens are being transferred.
  fromAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0', 
};

const quote = await getQuote(quoteRequest);
​
Quote request parameters
The getQuotes function expects a QuoteRequest object. RoutesRequest and QuoteRequest have some similarities and slight differences, and below, you can find a description of the QuoteRequest interface’s parameters.
Parameter	Type	Required	Description
fromChain	number	yes	The ID of the source chain (e.g., Ethereum mainnet is 1).
fromToken	string	yes	The contract address of the token on the source chain. Ensure this address corresponds to the specified fromChain.
fromAmount	string	yes	The amount to be transferred from the source chain, specified in the smallest unit of the token (e.g., wei for ETH).
fromAddress	string	yes	The address from which the tokens are being transferred.
toChain	number	yes	The ID of the destination chain (e.g., Optimism is 10).
toToken	string	yes	The contract address of the token on the destination chain. Ensure this address corresponds to the specified toChain.
toAddress	string	no	The address to which the tokens will be sent on the destination chain once the transaction is completed.
fromAmountForGas	string	no	Part of the LI.Fuel. Allows receiving a part of the bridged tokens as gas on the destination chain. Specified in the smallest unit of the token.
​
Other Quote parameters
In addition to the parameters mentioned above, all parameters listed in the Route Options section are also available when using getQuote, except for allowSwitchChain, which is used exclusively to control chain switching in route requests.
Also, parameters to specify options for allowing, denying, or preferring certain bridges and exchanges have slightly different names:
allowBridges (string[], optional)
denyBridges (string[], optional)
preferBridges (string[], optional)
allowExchanges (string[], optional)
denyExchanges (string[], optional)
preferExchanges (string[], optional)
Additionally, you can specify timing strategies for the swap steps using the swapStepTimingStrategies parameter:
swapStepTimingStrategies (string[], optional) Specifies the timing strategy for swap steps. This parameter allows you to define how long the request should wait for results and manage expected outcomes. The format is:

Copy

Ask AI
minWaitTime-${minWaitTimeMs}-${startingExpectedResults}-${reduceEveryMs}
​
Request contract call Quote
Besides requesting general quotes, the LI.FI SDK also provides functionality to request quotes for destination contract calls.
Read more TX-Batching aka “Zaps”.
Here is a simple example of how to request a quote to bridge and purchase an NFT on the OpenSea marketplace costing 0.0000085 ETH on the Base chain using ETH from Optimism. The call data for this example was obtained using the OpenSea Seaport SDK.

Copy

Ask AI
import { getContractCallsQuote } from '@lifi/sdk';

const contractCallsQuoteRequest = {
  fromAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0',
  fromChain: 10,
  fromToken: '0x0000000000000000000000000000000000000000',
  toAmount: '8500000000000',
  toChain: 8453,
  toToken: '0x0000000000000000000000000000000000000000',
  contractCalls: [
    {
      fromAmount: '8500000000000',
      fromTokenAddress: '0x0000000000000000000000000000000000000000',
      toContractAddress: '0x0000000000000068F116a894984e2DB1123eB395',
      toContractCallData:
        '0xe7acab24000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000006e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000029dacdf7ccadf4ee67c923b4c22255a4b2494ed700000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000520000000000000000000000000000000000000000000000000000000000000064000000000000000000000000090884b5bd9f774ed96f941be2fb95d56a029c99c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000066757dd300000000000000000000000000000000000000000000000000000000669d0a580000000000000000000000000000000000000000000000000000000000000000360c6ebe0000000000000000000000000000000000000000ad0303de3e1093e50000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000029f25e8a71e52e795e5016edf7c9e02a08c519b40000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006ff0cbadd00000000000000000000000000000000000000000000000000000006ff0cbadd0000000000000000000000000090884b5bd9f774ed96f941be2fb95d56a029c99c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003179fcad000000000000000000000000000000000000000000000000000000003179fcad000000000000000000000000000000a26b00c1f0df003000390027140000faa7190000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008a88c37e000000000000000000000000000000000000000000000000000000008a88c37e000000000000000000000000009323bb21a4c6122f60713e4a1e38e7b94a40ce2900000000000000000000000000000000000000000000000000000000000000e3b5b41791fe051471fa3c2da1325a8147c833ad9a6609ffc07a37e2603de3111b262911aaf25ed6d131dd531574cf54d4ea61b479f2b5aaa2dff7c210a3d4e203000000f37ec094486e9092b82287d7ae66fbf8cd6148233c70813583e3264383afbd0484b80500070135f54edd2918ddd4260c840f8a6957160766a4e4ef941517f2a0ab3077a2ac6478f0ad7fad9b821766df11ca3fdb16a8e95782faaed6e0395df2f416651ac87a5c1edec0a36ad42555083e57cff59f4ad98617a48a3664b2f19d46f4db85e95271c747d03194b5cfdcfc86bb0b08fb2bc4936d6f75be03ab498d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      toContractGasLimit: '210000',
    },
  ],
};

const contractCallQuote = await getContractCallsQuote(contractCallsQuoteRequest);
​
Contract call Quote request parameters
The getContractCallsQuote function expects a ContractCallsQuoteRequest object, which includes all the information needed to request a quote for a destination contract call.
Contract call quote request can be treated as an extension to the quote request and in addition to the parameters mentioned below, all parameters listed in the Other Quote parameters section (such as integrator, fee, slippage, etc.) are also available when using getContractCallsQuote.
Parameter	Type	Required	Description
Array of contract call objects.
Parameter	Type	Required	Description
fromAmount	string	yes	The amount of tokens to be sent to the contract. This amount is independent of any previously bridged or deposited tokens.
fromTokenAddress	string	yes	The address of the token to be sent to the contract. For example, an ETH staking transaction would require ETH.
toContractAddress	string	yes	The address of the contract to interact with on the destination chain.
toContractCallData	string	yes	The call data to be sent to the contract for the interaction on the destination chain.
toContractGasLimit	string	yes	The estimated gas required for the contract call. Incorrect values may cause the interaction to fail.
toApprovalAddress	string	no	The address to approve the token transfer if it is different from the contract address.
contractOutputsToken	string	no	The address of the token that will be output by the contract, if applicable (e.g., staking ETH produces stETH).
​
Difference between Route and Quote
Even though Route and Quote terms lie in the same field of providing you with the best option to make a swap or bridging transfer, there are some differences you need to be aware of.
A Route in LI.FI represents a detailed transfer plan that may include multiple steps. Each step corresponds to an individual transaction, such as swapping tokens or bridging funds between chains. These steps must be executed in a specific sequence, as each one depends on the output of the previous step. A Route provides a detailed pathway for complex transfers involving multiple actions.
In contrast, a Quote is a single-step transaction. It contains all the necessary information to perform a transfer in one go, without requiring any additional steps. Quotes are used for simpler transactions where a single action, such as a token swap or a cross-chain transfer, is sufficient. Thus, while Routes can involve multiple steps to complete a transfer, a Quote always represents just one step.# Execute Routes/Quotes

> We allow you to execute any on-chain or cross-chain swap and bridging transfer and a combination of both.

The LI.FI SDK offers functionality to execute routes and quotes. In this guide, you'll learn how to utilize the SDK's features to handle complex cross-chain transfers, manage execution settings, and control the transaction flow.

## Execute route

Let's say you have obtained the route. Refer to [Request Routes/Quotes](https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes) for more details.

Please make sure you've configured SDK with EVM/Solana providers. Refer to [Configure SDK Providers](https://docs.li.fi/integrate-li.fi-sdk/configure-sdk-providers) for more details.

Now, to execute the route, we can use the `executeRoute` function. Here is a simplified example of how to use it:

```typescript  theme={"system"}
import { executeRoute, getRoutes } from '@lifi/sdk'

const result = await getRoutes({
  fromChainId: 42161, // Arbitrum
  toChainId: 10, // Optimism
  fromTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toTokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '10000000', // 10 USDC
  // The address from which the tokens are being transferred.
  fromAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0', 
})

const route = result.routes[0]

const executedRoute = await executeRoute(route, {
  // Gets called once the route object gets new updates
  updateRouteHook(route) {
    console.log(route)
  },
})
```

The `executeRoute` function internally manages allowance and balance checks, chain switching, transaction data retrieval, transactions submission, and transactions status tracking.

* **Parameters:**

  * `route` (`Route`): The route to be executed.

  * `executionOptions` (`ExecutionOptions`, optional): An object containing settings and callbacks for execution.
* **Returns:**

  * `Promise<RouteExtended>`: Resolves when execution is done or halted and rejects when it is failed.

### Execution Options

All execution options are optional, but we recommend reviewing their descriptions to determine which ones may be beneficial for your use case.

Certain options, such as [acceptExchangeRateUpdateHook](https://docs.li.fi/integrate-li.fi-sdk/execute-routes-quotes#acceptexchangerateupdatehook), can be crucial for successfully completing a transfer if the exchange rate changes during the process.

#### `updateRouteHook`

The function is called when the route object changes during execution. This function allows you to handle route updates, track execution status, transaction hashes, etc. See [Monitor route execution](https://docs.li.fi/integrate-li.fi-sdk/execute-routes-quotes#monitor-route-execution) section for more details.

* **Parameters**:

  * `updatedRoute` (`RouteExtended`): The updated route object.

#### `updateTransactionRequestHook`

The function is intended for advanced usage, and it allows you to modify swap/bridge transaction requests or token approval requests before they are sent, e.g., updating gas information.

* **Parameters**:

  * `updatedTxRequest` (`TransactionRequestParameters`): The transaction request parameters need to be updated.
* **Returns**: `Promise<TransactionParameters>`: The modified transaction parameters.

#### `acceptExchangeRateUpdateHook`

This function is called whenever the exchange rate changes during a swap or bridge operation. It provides you with the old and new amount values. To continue the execution, you should return `true`. If this hook is not provided or if you return `false`, the SDK will throw an error. This hook is an ideal place to prompt your users to accept the new exchange rate.

* **Parameters**:

  * `toToken` (`Token`): The destination token.

  * `oldToAmount` (`string`): The previous amount of the target token.

  * `newToAmount` (`string`): The new amount of the target token.

* **Returns**: `Promise<boolean | undefined>`: Whether the update is accepted.

* **Throws:** `TransactionError: Exchange rate has changed!`

#### `switchChainHook`

* **Parameters**:

  * `chainId` (`number`): The ID of the chain to which to switch.
* **Returns**: `Promise<WalletClient | undefined>`: The new wallet client after switching chains.

#### `executeInBackground`

A boolean flag indicating whether the route execution should continue in the background without requiring user interaction. See [Update route execution](https://docs.li.fi/integrate-li.fi-sdk/execute-routes-quotes#update-route-execution) and [Resume route execution](https://docs.li.fi/integrate-li.fi-sdk/execute-routes-quotes#resume-route-execution) sections for details on how to utilize this option.

* **Type**: `boolean`

* **Default**: `false`

#### `disableMessageSigning`

A boolean flag indicating whether to disable message signing during execution. Certain operations require signing EIP-712 messages, including Permit approvals (ERC-2612) and gasless transactions. This functionality may not be compatible with all smart accounts or wallets, in which case this flag should be set to true to disable message signing.

* **Type**: `boolean`

* **Default**: `false`

## Manage route execution

After starting route execution, there might be use cases when you need to adjust execution settings, stop execution and come back later, or move execution to the background. We provide several functions to achieve that.

### Update route execution

The `updateRouteExecution` function is used to update the settings of an ongoing route execution.

One common use case is to push the execution to the background, for example, when a user navigates away from the execution page in your dApp. When this function is called, the execution will continue until it requires user interaction (e.g., signing a transaction or switching the chain). At that point, the execution will halt, and the `executeRoute` promise will be resolved.

To move the execution back to the foreground and make it active again, you can call `resumeRoute` with the same route object. The execution will then resume from where it was halted.

```typescript  theme={"system"}
import { updateRouteExecution } from '@lifi/sdk'

updateRouteExecution(route, { executeInBackground: true });
```

* **Parameters:**

  * `route` (`Route`): The active route to be updated.

  * `executionOptions` (`ExecutionOptions`, **required**): An object containing settings and callbacks for execution.

### Resume route execution

The `resumeRoute` function is used to resume a halted, aborted, or failed route execution from the point where it stopped. It is crucial to call `resumeRoute` with the latest active route object returned from the `executeRoute` function or the most recent version of the updated route object from the `updateRouteHook`.

#### Common Use Cases

* **Move Execution to Foreground**: When a user navigates back to the execution page in your dApp, you can call this function to move the execution back to the foreground. The execution will resume from where it was halted.

* **Page Refresh**: If the user refreshes the page in the middle of the execution process, calling this function will attempt to resume the execution.

* **User Interaction Errors**: If the user rejects a chain switch, declines to sign a transaction, or encounters any other error, you can call this function to attempt to resume the execution.

```typescript  theme={"system"}
import { resumeRoute } from '@lifi/sdk'

const route = await resumeRoute(route, { executeInBackground: false });
```

* **Parameters:**

  * `route` (`Route`): The route to be resumed to execution.

  * `executionOptions` (`ExecutionOptions`, optional): An object containing settings and callbacks for execution.
* **Returns:**

  * `Promise<RouteExtended>`: Resolves when execution is done or halted and rejects when it is failed.

### Stop route execution

The `stopRouteExecution` function is used to stop the ongoing execution of an active route. It stops any remaining user interaction within the ongoing execution and removes the route from the execution queue. However, if a transaction has already been signed and sent by the user, it will be executed on-chain.

```typescript  theme={"system"}
import { stopRouteExecution } from '@lifi/sdk'

const stoppedRoute = stopRouteExecution(route);
```

* **Parameters:**

  * `route` (`Route`): The route that is currently being executed and needs to be stopped.
* **Returns:**

  * `Route`: The route object that was stopped.

## Monitor route execution

Monitoring route execution is important and we provide tools for tracking progress, receiving data updates, accessing transaction hashes, and explorer links.

### Brief description of steps

A `route` object includes multiple `step` objects, each representing a set of transactions that should be completed in the specified order. Each step can include multiple transactions that require a signature, such as an allowance transaction followed by the main swap or bridge transaction. Read more [LI.FI Terminology](https://docs.li.fi/overview/li.fi-terminology).

### Understanding the `execution` object

Each `step` within a `route` has an `execution` object. This object contains all the necessary information to track the execution progress of that step. The `execution` object has a `process` array where each entry represents a sequential stage in the execution. The latest process entry contains the most recent information about the execution stage.

### Process array

The `process` array within the `execution` object details each step’s progression. Each `process` object has a type and status and might also include a transaction hash and a link to a blockchain explorer after the user signs the transaction.

### Tracking progress

To monitor the execution progress, you leverage the `updateRouteHook` callback and iterate through the route steps, checking their `execution` objects. Look at the `process` array to get the latest information about the execution stage. The most recent entry in the `process` array will contain the latest transaction hash, status, and other relevant details.

### Example to access transaction hashes

```typescript  theme={"system"}
const getTransactionLinks = (route: RouteExtended) => {
  route.steps.forEach((step, index) => {
    step.execution?.process.forEach((process) => {
      if (process.txHash) {
        console.log(
          `Transaction Hash for Step ${index + 1}, Process ${process.type}:`,
          process.txHash
        )
      }
    })
  })
}

const executedRoute = await executeRoute(route, {
  updateRouteHook(route) {
    getTransactionLinks(route)
  },
})
```

### Get active routes

To get routes that are currently being executed (active), you can use `getActiveRoutes` and `getActiveRoute` functions.

```typescript  theme={"system"}
import { getActiveRoute, getActiveRoutes, RouteExtended } from '@lifi/sdk'

const activeRoutes: RouteExtended[] = getActiveRoutes();

const routeId = activeRoutes[0].routeId;

const activeRoute = getActiveRoute(routeId);
```

## Execute quote

To execute a quote using the `executeRoute`, you need to convert it to a route object first. We provide `convertQuoteToRoute` helper function to transform quote objects to route objects. This applies to both standard and contract call quotes.

```typescript  theme={"system"}
import { convertQuoteToRoute, executeRoute, getQuote } from '@lifi/sdk';

const quoteRequest: QuoteRequest = {
  fromChain: 42161, // Arbitrum
  toChain: 10, // Optimism
  fromToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toToken: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '10000000', // 10 USDC
  // The address from which the tokens are being transferred.
  fromAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0', 
};

const quote = await getQuote(quoteRequest);

const route = convertQuoteToRoute(quote)

const executedRoute = await executeRoute(route, {
  // Gets called once the route object gets new updates
  updateRouteHook(route) {
    console.log(route)
  },
})
```

## Manual route execution

In addition to using the `executeRoute` function, you can execute routes and quotes manually. This approach requires developers to handle the logic for obtaining transaction data, switching chains, sending transactions, and tracking transaction status independently.

Initially, when route objects are requested, they do not include transaction data. This is because multiple route options are provided, and generating transaction data for all options would substantially delay the response. Each route consists of multiple steps, and once a user selects a route, transaction data for each step should be requested individually using the `getStepTransaction` function (see example below). Each step should be executed sequentially, as each step depends on the outcome of the previous one.

On the other hand, quote objects are returned with transaction data included, so the `getStepTransaction` call is not necessary, and they can be executed immediately.

After sending a transaction using the obtained transaction data, you can track the status of the transaction using the `getStatus` function. This function helps you monitor the progress and completion of each transaction. Read more [Status of a Transaction](https://docs.li.fi/li.fi-api/li.fi-api/status-of-a-transaction).

Here's a simplified example. For the sake of simplicity, this example omits balance checks, transaction replacements, error handling, chain switching, etc. However, in a real implementation, you should include these additional functionalities to have a robust solution and ensure reliability.

```typescript  theme={"system"}
import { getStepTransaction, getStatus } from '@lifi/sdk';

// Simplified example function to execute each step of the route sequentially
async function executeRouteSteps(route) {
  for (const step of route.steps) {
    // Request transaction data for the current step
    const step = await getStepTransaction(step);
    
    // Send the transaction (e.g. using Viem)
    const transactionHash = await sendTransaction(step.transactionRequest);
    
    // Monitor the status of the transaction
    let status;
    do {
      const result = await getStatus({
        txHash: transactionHash,
        fromChain: step.action.fromChainId,
        toChain: step.action.toChainId,
        bridge: step.tool,
      })
      status = result.status
      
      console.log(`Transaction status for ${transactionHash}:`, status);
      
      // Wait for a short period before checking the status again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } while (status !== 'DONE' && status !== 'FAILED');
    
    if (status === 'FAILED') {
      console.error(`Transaction ${transactionHash} failed`);
      return;
    }
  }
  
  console.log('All steps executed successfully');
}
```

#### `getStepTransaction`

* **Parameters:**

  * `step` (`LiFiStep`): The step object for which we need to get transaction data.

  * `options` (`RequestOptions`, optional): An object containing request options, such as `AbortSignal`, which can be used to cancel the request if necessary.
* **Returns:**

  * `Promise<LiFiStep>`: A promise that resolves to the step object containing the transaction data.

#### `getStatus`

* **Parameters:**

  * `params` (`GetStatusRequest`): The parameters for checking the status include the transaction hash, source and destination chain IDs, and the DEX or bridge name.

  * `options` (`RequestOptions`, optional): An object containing request options, such as `AbortSignal`, which can be used to cancel the request if necessary.
* **Returns:**

  * `Promise<StatusResponse>`: A promise that resolves to a status response containing all relevant information about the transfer.
# Chains and Tools

> Request all available chains, bridges, and exchanges.

Get an overview of which options (chains, bridges, DEXs) are available at this moment.

## Get available chains

### `getChains`

Fetches a list of all available chains supported by the SDK.

**Parameters**

* `params` (ChainsRequest, optional): Configuration for the requested chains.

  * `chainTypes` (ChainType\[], optional): List of chain types.
* `options` (RequestOptions, optional): Additional request options.

**Returns**

A Promise that resolves to an array of `ExtendedChain` objects.

```typescript Example theme={"system"}
import { ChainType, getChains } from '@lifi/sdk';

try {
  const chains = await getChains({ chainTypes: [ChainType.EVM] });
  console.log(chains);
} catch (error) {
  console.error(error);
}
```

## Get available bridges and DEXs

### `getTools`

Fetches the tools available for bridging and swapping tokens.

**Parameters**

* `params` (ToolsRequest, optional): Configuration for the requested tools.

  * `chains` ((ChainKey | ChainId)\[], optional): List of chain IDs or keys.
* `options` (RequestOptions, optional): Additional request options.

**Returns**

A Promise that resolves to `ToolsResponse` and contains information about available bridges and DEXs.

```typescript Example theme={"system"}
import { getTools } from '@lifi/sdk';

try {
  const tools = await getTools();
  console.log(tools);
} catch (error) {
  console.error(error);
}
```

## Get available connections

A connection is a pair of two tokens (on the same chain or on different chains) that can be exchanged via our platform.

Read more [Getting all possible Connections](https://docs.li.fi/li.fi-api/li.fi-api/getting-all-possible-connections)

### `getConnections`

Gets all the available connections for swapping or bridging tokens.

**Parameters**

* `connectionRequest` (ConnectionsRequest): Configuration of the connection request.

  * `fromChain` (number, optional): The source chain ID.

  * `fromToken` (string, optional): The source token address.

  * `toChain` (number, optional): The destination chain ID.

  * `toToken` (string, optional): The destination token address.

  * `allowBridges` (string\[], optional): Allowed bridges.

  * `denyBridges` (string\[], optional): Denied bridges.

  * `preferBridges` (string\[], optional): Preferred bridges.

  * `allowExchanges` (string\[], optional): Allowed exchanges.

  * `denyExchanges` (string\[], optional): Denied exchanges.

  * `preferExchanges` (string\[], optional): Preferred exchanges.

  * `allowSwitchChain` (boolean, optional): Whether connections that require chain switch (multiple signatures) are included. Default is true.

  * `allowDestinationCall` (boolean, optional): Whether connections that include destination calls are included. Default is true.

  * `chainTypes` (ChainType\[], optional): Types of chains to include.
* `options` (RequestOptions, optional): Request options.

**Returns**

A Promise that resolves to a `ConnectionsResponse`.

```typescript Example theme={"system"}
import { getConnections } from '@lifi/sdk';

const connectionRequest = {
  fromChain: 1,
  fromToken: '0x0000000000000000000000000000000000000000',
  toChain: 10,
  toToken: '0x0000000000000000000000000000000000000000',
};

try {
  const connections = await getConnections(connectionRequest);
  console.log('Connections:', connections);
} catch (error) {
  console.error('Error:', error);
}
```

For more detailed information on each endpoint and their responses, please refer to the [LI.FI API](https://docs.li.fi/li.fi-api/li.fi-api) documentation.
# Token Management

> Request all available tokens and their balances, manage token approvals and more.

## Get available tokens

### `getTokens`

Retrieves a list of all available tokens on specified chains.

**Parameters**

* `params` (TokensRequest, optional): Configuration for the requested tokens.

  * `chains` (ChainId\[], optional): List of chain IDs or keys. If not specified, returns tokens on all available chains.

  * `chainTypes` (ChainType\[], optional): List of chain types.
* `options` (RequestOptions, optional): Additional request options.

**Returns**

A Promise that resolves to `TokensResponse`

```typescript Example theme={"system"}
import { ChainType, getTokens } from '@lifi/sdk';

try {
  const tokens = await getTokens({
    chainTypes: [ChainType.EVM, ChainType.SVM],
  });
  console.log(tokens);
} catch (error) {
  console.error(error);
}
```

### `getToken`

Fetches details about a specific token on a specified chain.

**Parameters**

* `chain` (ChainKey | ChainId): ID or key of the chain that contains the token.

* `token` (string): Address or symbol of the token on the requested chain.

* `options` (RequestOptions, optional): Additional request options.

**Returns**

A Promise that resolves to `Token` object.

```typescript Example theme={"system"}
import { getToken } from '@lifi/sdk';

const chainId = 1;
const tokenAddress = '0x0000000000000000000000000000000000000000';

try {
  const token = await getToken(chainId, tokenAddress);
  console.log(token);
} catch (error) {
  console.error(error);
}
```

## Get token balance

Please ensure that you configure the SDK with EVM/Solana providers first. They are required to use this functionality. Additionally, it is recommended to provide your private RPC URLs, as public ones are used by default and may rate limit you for multiple requests, such as getting the balance of multiple tokens at once.

Read more [Configure SDK Providers](https://docs.li.fi/integrate-li.fi-sdk/configure-sdk-providers).

### `getTokenBalance`

Returns the balance of a specific token a wallet holds.

**Parameters**

* `walletAddress` (string): A wallet address.

* `token` (Token): A Token object.

**Returns**

A Promise that resolves to a `TokenAmount` or `null`.

```typescript Example theme={"system"}
import { getToken, getTokenBalance } from '@lifi/sdk';

const chainId = 1;
const tokenAddress = '0x0000000000000000000000000000000000000000';
const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';

try {
  const token = await getToken(chainId, tokenAddress);
  const tokenBalance = await getTokenBalance(walletAddress, token);
  console.log(tokenBalance);
} catch (error) {
  console.error(error);
}
```

### `getTokenBalances`

Returns the balances for a list of tokens a wallet holds.

**Parameters**

* `walletAddress` (string): A wallet address.

* `tokens` (Token\[]): A list of Token objects.

**Returns**

A Promise that resolves to a list of `TokenAmount` objects.

```typescript Example theme={"system"}
import { ChainId, getTokenBalances, getTokens } from '@lifi/sdk';

const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';

try {
  const tokensResponse = await getTokens();
  const optimismTokens = tokensResponse.tokens[ChainId.OPT];
  const tokenBalances = await getTokenBalances(walletAddress, optimismTokens);
  console.log(tokenBalances);
} catch (error) {
  console.error(error);
}
```

### `getTokenBalancesByChain`

Queries the balances of tokens for a specific list of chains for a given wallet.

**Parameters**

* `walletAddress` (string): A wallet address.

* `tokensByChain` \[chainId: number]: Token\[]: A list of Token objects organized by chain IDs.

**Returns**

A Promise that resolves to an object containing the tokens and their amounts on different chains.

```typescript Example theme={"system"}
import { getTokenBalancesByChain } from '@lifi/sdk';

const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';
const tokensByChain = {
  1: [
    {
      chainId: 1,
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'DAI Stablecoin',
      decimals: 18,
      priceUSD: '0.9999',
    },
  ],
  10: [
    {
      chainId: 10,
      address: '0x4200000000000000000000000000000000000042',
      symbol: 'OP',
      name: 'Optimism',
      decimals: 18,
      priceUSD: '1.9644',
    },
  ],
};

try {
  const balances = await getTokenBalancesByChain(walletAddress, tokensByChain);
  console.log(balances);
} catch (error) {
  console.error(error);
}
```

## Managing token allowance

Token allowance and approval functionalities are specific to EVM (Ethereum Virtual Machine) chains. It allows smart contracts to interact with ERC-20 tokens by approving a certain amount of tokens that a contract can spend from the user's wallet.

Please ensure that you configure the SDK with the EVM provider. It is required to use this functionality.

Read more [Configure SDK Providers](https://docs.li.fi/integrate-li.fi-sdk/configure-sdk-providers).

### `getTokenAllowance`

Fetches the current allowance for a specific token.

**Parameters**

* `token` (BaseToken): The token for which to check the allowance.

* `ownerAddress` (string): The owner of the token.

* `spenderAddress` (string): The spender address that was approved.

**Returns**

A Promise that resolves to a `bigint` representing the allowance or undefined if the token is a native token.

```typescript Example theme={"system"}
import { getTokenAllowance } from '@lifi/sdk';

const token = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  chainId: 1,
};

const ownerAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';
const spenderAddress = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE';

try {
  const allowance = await getTokenAllowance(token, ownerAddress, spenderAddress);
  console.log('Allowance:', allowance);
} catch (error) {
  console.error('Error:', error);
}
```

### `getTokenAllowanceMulticall`

Fetches the current allowance for a list of token/spender address pairs.

**Parameters**

* `ownerAddress` (string): The owner of the tokens.

* `tokens` (TokenSpender\[]): A list of token and spender address pairs.

**Returns**

A Promise that resolves to an array of `TokenAllowance` objects.

```typescript Example theme={"system"}
import { getTokenAllowanceMulticall } from '@lifi/sdk';

const ownerAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';
const tokens = [
  {
    token: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: 1,
    },
    spenderAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
  },
  {
    token: {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      chainId: 1,
    },
    spenderAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
  },
];

try {
  const allowances = await getTokenAllowanceMulticall(ownerAddress, tokens);
  console.log('Allowances:', allowances);
} catch (error) {
  console.error('Error:', error);
}
```

### `setTokenAllowance`

Sets the token allowance for a specific token and spender address.

**Parameters**

* `request` (ApproveTokenRequest): The approval request.

  * `walletClient` (WalletClient): The wallet client used to send the transaction.

  * `token` (BaseToken): The token for which to set the allowance.

  * `spenderAddress` (string): The address of the spender.

  * `amount` (bigint): The amount of tokens to approve.

  * `infiniteApproval` (boolean, optional): If true, sets the approval to the maximum uint256 value.

**Returns**

A Promise that resolves to a `Hash` representing the transaction hash or `void` if no transaction is needed (e.g., for native tokens).

```typescript Example theme={"system"}
import { setTokenAllowance } from '@lifi/sdk';

const approvalRequest = {
  walletClient: walletClient, // Viem wallet client
  token: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chainId: 1,
  },
  spenderAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
  amount: 100000000n,
};

try {
  const txHash = await setTokenAllowance(approvalRequest);
  console.log('Transaction Hash:', txHash);
} catch (error) {
  console.error('Error:', error);
}
```

### `revokeTokenApproval`

Revokes the token approval for a specific token and spender address.

**Parameters**

* `request` (RevokeApprovalRequest): The revoke request.

  * `walletClient` (WalletClient): The wallet client used to send the transaction.

  * `token` (BaseToken): The token for which to revoke the allowance.

  * `spenderAddress` (string): The address of the spender.

**Returns**

A Promise that resolves to a `Hash` representing the transaction hash or `void` if no transaction is needed (e.g., for native tokens).

```typescript Example theme={"system"}
import { revokeTokenApproval } from '@lifi/sdk';

const revokeRequest = {
  walletClient: walletClient, // Viem wallet client
  token: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chainId: 1,
  },
  spenderAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
};

try {
  const txHash = await revokeTokenApproval(revokeRequest);
  console.log('Transaction Hash:', txHash);
} catch (error) {
  console.error('Error:', error);
}
```
