// src/layouts/landing/faqs.js

// Función para generar el mismo slug que en Footer.js
const slugify = (text) =>
    text.toLowerCase().replace(/[^\w\s]/gi, "").replace(/\s+/g, "-");

export const faqData = [
    {
        question: "¿Dónde hacer páginas web en Colombia?",
        slug: slugify("¿Dónde hacer páginas web en Colombia?"),
        image: "/fondo-paginasweb-banner.webp",
        shortDescription:
            "Via desarrolla páginas web profesionales en Colombia, con diseño a medida, optimización SEO y tecnologías modernas para hacer crecer tu negocio.",
        sectionTitle: "¿Quieres hacer una página web y no sabes dónde empezar?",
        content:
            "Via es tu aliado ideal para crear páginas web profesionales en Colombia. Nos encargamos del diseño responsive, la optimización SEO, integración con redes sociales y comercio electrónico, todo personalizado según tus necesidades. Utilizamos tecnologías avanzadas, incluyendo inteligencia artificial y automatización, para potenciar tu presencia digital y maximizar las conversiones de tu empresa con soluciones escalables y seguras."
    },
    {
        question: "¿Cuánto vale el desarrollo de una página web en Colombia?",
        slug: slugify("¿Cuánto vale el desarrollo de una página web en Colombia?"),
        image: "/fondo-precio-web-banner.webp",
        shortDescription:
            "Descubre los factores que influyen en el costo de desarrollar una página web en Colombia y cómo Via ofrece soluciones personalizadas y accesibles.",
        sectionTitle: "¿Cuánto cuesta realmente desarrollar una página web profesional en Colombia?",
        content:
            "El costo del desarrollo de una página web en Colombia varía según la complejidad, funcionalidades, diseño personalizado y tecnología utilizada. En Via, entendemos que cada negocio es único, por eso ofrecemos presupuestos ajustados a tus necesidades específicas, garantizando calidad y eficiencia. Ya sea que necesites una web corporativa, tienda online o integración con IA, Via combina experiencia técnica con un enfoque personalizado para ofrecer el mejor valor y resultados medibles que impulsan tu crecimiento digital."
    },
    {
        question: "¿Dónde desarrollar mi página web?",
        slug: slugify("¿Dónde desarrollar mi página web?"),
        image: "/fondo-donde-desarrollar-banner.webp",
        shortDescription:
            "Explora las mejores alternativas para crear tu sitio web y descubre cómo Via ofrece un acompañamiento personalizado para materializar tu proyecto digital.",
        sectionTitle: "Elige el lugar ideal para desarrollar tu página web con expertos en Colombia",
        content:
            "Tomar la decisión sobre dónde construir tu página web impacta directamente en la presencia digital de tu empresa. En el mercado colombiano existen diversas opciones, desde profesionales independientes hasta grandes agencias, cada una con enfoques y alcances distintos. Via se distingue por brindar un servicio integral, que abarca desde el análisis inicial hasta el lanzamiento y mantenimiento del sitio. Con un equipo multidisciplinario, desarrollamos soluciones a la medida que incorporan tecnologías innovadoras como inteligencia artificial y prácticas SEO avanzadas. Al confiar en Via, accedes a un proceso transparente, comunicación cercana y resultados orientados a potenciar tu crecimiento y visibilidad en línea."
    },
    {
        question: "¿Cómo automatizar la atención al cliente?",
        slug: slugify("¿Cómo automatizar la atención al cliente?"),
        image: "/fondo-automatizar-banner.webp",
        shortDescription:
            "Implementa con Via tecnologías inteligentes que transforman la atención a tus clientes, ofreciendo soporte ágil y personalizado las 24 horas.",
        sectionTitle: "Automatiza la atención al cliente con tecnologías inteligentes para mejorar la experiencia y eficiencia",
        content:
            "Optimizar la atención al cliente mediante la automatización es clave para responder con rapidez y mejorar la experiencia de tus usuarios. En Via diseñamos e implementamos soluciones a la medida que combinan chatbots avanzados y asistentes virtuales con inteligencia artificial, capaces de gestionar desde preguntas frecuentes hasta procesos complejos, sin intervención humana constante. Estas herramientas permiten que tu negocio mantenga una comunicación continua, reduce tiempos de espera y libera recursos para tareas estratégicas. Al confiar en Via, recibes una solución adaptada a tu operación que impulsa la satisfacción del cliente y facilita el escalamiento de tu empresa."
    },
    {
        question: "¿Qué beneficios tiene usar IA en atención?",
        slug: slugify("¿Qué beneficios tiene usar IA en atención?"),
        image: "/Gemini_Generated_Image_79xnzo79xnzo79xn.jpg",
        shortDescription:
            "Descubre cómo Via utiliza inteligencia artificial para revolucionar la atención al cliente, ofreciendo respuestas rápidas y personalizadas.",
        sectionTitle: "Beneficios clave de usar inteligencia artificial en la atención al cliente para tu empresa",
        content:
            "Incorporar inteligencia artificial en la atención al cliente transforma radicalmente la interacción entre empresas y usuarios. En Via diseñamos sistemas inteligentes que automatizan consultas comunes, adaptan las respuestas según el perfil del cliente y garantizan disponibilidad las 24 horas del día. La IA también facilita el análisis de datos en tiempo real, permitiendo anticipar necesidades y optimizar procesos. Al elegir las soluciones de Via, tu empresa mejora la eficiencia operativa, eleva la satisfacción del cliente y se mantiene competitiva en un mercado cada vez más digitalizado."
    },
    {
        question: "¿Cuál es la mejor plataforma para crear páginas web?",
        slug: slugify("¿Cuál es la mejor plataforma para crear páginas web?"),
        image: "/fondo-plataforma-banner.webp",
        shortDescription:
            "Explora las opciones más eficientes para construir tu sitio web y descubre cómo Via te guía para seleccionar la plataforma ideal.",
        sectionTitle: "Elige la plataforma ideal para crear tu página web y potenciar tu negocio con expertos",
        content:
            "La elección de la plataforma para desarrollar tu página web debe basarse en las características únicas de tu negocio, el alcance del proyecto y las funcionalidades requeridas. Entre las alternativas más destacadas están WordPress para flexibilidad, Shopify para comercio electrónico, Wix para soluciones rápidas y personalizadas, y desarrollos a medida con tecnologías avanzadas. En Via, analizamos tus objetivos para recomendar y construir sobre la plataforma que maximice tus resultados. Nuestro enfoque combina diseño profesional, optimización para motores de búsqueda y automatización inteligente, asegurando que tu sitio sea eficiente, adaptable y capaz de crecer junto a tu empresa."
    },
    {
        question: "¿Cómo integrar IA en tu sitio web?",
        slug: slugify("¿Cómo integrar IA en tu sitio web?"),
        image: "/Gemini_Generated_Image_dtjhezdtjhezdtjh.png",
        shortDescription:
            "Descubre estrategias efectivas para incorporar inteligencia artificial en tu sitio web y cómo Via facilita su implementación para potenciar tu negocio.",
        sectionTitle: "Estrategias clave para integrar inteligencia artificial en tu sitio web y maximizar resultados",
        content:
            "La incorporación de inteligencia artificial en un sitio web revoluciona la forma en que interactúas con tus visitantes, automatizando tareas y personalizando la experiencia. Herramientas como chatbots conversacionales, sistemas de recomendación basados en comportamiento y análisis predictivos pueden transformar la navegación y aumentar la fidelización. En Via, diseñamos e implementamos soluciones IA a la medida que se integran perfectamente con tu plataforma digital, garantizando que la tecnología trabaje para alcanzar tus metas comerciales. Con nuestra experiencia, optimizamos tu sitio para ofrecer interacciones más inteligentes, eficientes y satisfactorias para tus clientes."
    },
    {
        question: "¿Cómo puedo integrar IA en una aplicación web?",
        slug: slugify("¿Cómo puedo integrar IA en una aplicación web?"),
        image: "/fondo-integrar-banner.webp",
        shortDescription:
            "Explora cómo Via desarrolla soluciones inteligentes para incorporar IA en tu aplicación web y transformar la experiencia de usuario.",
        sectionTitle: "Soluciones personalizadas para integrar inteligencia artificial en tu aplicación web y potenciar la experiencia de usuario",
        content:
            "La integración de inteligencia artificial en aplicaciones web abre un mundo de posibilidades para optimizar procesos y enriquecer la interacción con los usuarios. Funcionalidades como reconocimiento de voz, procesamiento de lenguaje natural, análisis de datos en tiempo real y sistemas de recomendación pueden ser incorporadas para ofrecer experiencias personalizadas y eficientes. En Via, diseñamos e implementamos soluciones a medida que se adaptan a las características únicas de tu aplicación, asegurando una integración robusta y escalable. Nuestro enfoque integral te permite potenciar el valor de tu producto digital, mejorando la satisfacción de tus usuarios y facilitando la innovación continua."
    },
    {
        question: "¿Dónde es mejor crear mi página web?",
        slug: slugify("¿Dónde es mejor crear mi página web?"),
        image: "/fondo-donde-crear-banner.webp",
        shortDescription:
            "Conoce por qué Via es la opción ideal para crear tu página web, combinando experiencia local y tecnología avanzada para resultados efectivos.",
        sectionTitle: "Por qué Via es la mejor opción para crear tu página web en Colombia con calidad y tecnología avanzada",
        content:
            "Decidir dónde crear tu página web es una decisión crucial que impacta directamente en la calidad, funcionalidad y éxito de tu presencia digital. Aunque existen múltiples opciones, desde plataformas en línea hasta agencias tradicionales, Via se destaca por ofrecer un servicio integral que une diseño personalizado, tecnología de punta y soporte cercano. Nuestra experiencia en desarrollo web en Colombia nos permite adaptar cada proyecto a las necesidades específicas de tu negocio y mercado, garantizando un sitio optimizado, escalable y alineado con tus objetivos. Al elegir a Via, no solo obtienes una página web, sino una solución completa que impulsa tu crecimiento digital de manera efectiva."
    },
    {
        question: "¿Dónde puedo crear mi propia página web?",
        slug: slugify("¿Dónde puedo crear mi propia página web?"),
        image: "/fondo-donde-puedo-crear-banner.webp",
        shortDescription:
            "Explora las opciones para crear tu propia página web y cómo Via te brinda las herramientas y soporte para lograrlo con éxito.",
        sectionTitle: "Opciones efectivas para crear tu propia página web con apoyo experto y tecnología avanzada",
        content:
            "Crear tu propia página web puede parecer un reto, pero con el apoyo adecuado es completamente accesible y gratificante. Via ofrece asesoría personalizada y soluciones tecnológicas que facilitan este proceso, ya sea que prefieras una plataforma intuitiva para gestionar tu sitio o un desarrollo a medida con soporte profesional. Además, te acompañamos en cada etapa, desde el diseño hasta la optimización para buscadores, garantizando que tu página web refleje la identidad de tu marca y cumpla con tus objetivos de negocio. Con Via, crear tu propio sitio web es sencillo, eficiente y con resultados profesionales."
    },
    {
        question: "¿Cómo implementar implementar en mi negocio?",
        slug: slugify("¿Cómo implementar IA en mi negocio?"),
        image: "/fondo-implementar-IA-banner.webp",
        shortDescription:
            "Descubre cómo Via te guía en la integración estratégica de inteligencia artificial para transformar y optimizar tu negocio.",
        sectionTitle: "Cómo implementar inteligencia artificial en tu negocio para optimizar procesos y aumentar productividad",
        content:
            "Implementar inteligencia artificial en tu negocio es una forma eficaz de innovar, automatizar procesos y tomar decisiones basadas en datos. En Via, analizamos tus necesidades y diseñamos soluciones personalizadas que integran IA para mejorar áreas clave como atención al cliente, análisis de mercado, gestión operativa y marketing. Nuestro enfoque combina tecnología avanzada con un entendimiento profundo de tu sector para asegurar que la implementación sea práctica y genere resultados tangibles. Con Via, transformar tu empresa con IA es un proceso accesible, escalable y alineado con tus objetivos de crecimiento."
    },
    {
        question: "¿Puedo agregar un chatbot de IA a mi sitio web?",
        slug: slugify("¿Puedo agregar un chatbot de IA a mi sitio web?"),
        image: "/fondo-agregar-IA-banner.webp",
        shortDescription:
            "Via desarrolla chatbots inteligentes integrados con IA para mejorar la interacción y soporte en tu sitio web.",
        sectionTitle: "Cómo agregar un chatbot de IA efectivo para optimizar la atención en tu sitio web",
        content:
            "Agregar un chatbot de inteligencia artificial a tu sitio web es una estrategia clave para mejorar la atención al cliente, aumentar la eficiencia y ofrecer soporte 24/7. En Via, diseñamos e implementamos chatbots personalizados que entienden y responden a las consultas de tus usuarios de forma natural y efectiva. Nuestra solución incluye integración fluida con tu plataforma web, aprendizaje automático para mejorar respuestas y análisis de interacción para optimizar la experiencia del usuario. Con un chatbot de IA desarrollado por Via, tu sitio web se convierte en una herramienta proactiva que facilita la comunicación y potencia la satisfacción del cliente."
    },
    {
        question: "¿Cuánto cuesta crear una app con IA?",
        slug: slugify("¿Cuánto cuesta crear una app con IA?"),
        image: "/fondo-cuesta-app-banner.webp",
        shortDescription:
            "Descubre los factores que influyen en el costo de desarrollar una aplicación con inteligencia artificial y cómo Via ofrece soluciones a medida.",
        sectionTitle: "Factores que determinan el costo de crear una app con inteligencia artificial personalizada",
        content:
            "El costo de crear una aplicación con inteligencia artificial varía según la complejidad, funcionalidades específicas, integración de modelos de IA y tecnología utilizada. En Via, analizamos tus objetivos y diseñamos soluciones personalizadas que se ajustan a tu presupuesto, garantizando calidad y eficiencia. Ya sea que necesites reconocimiento de voz, procesamiento de lenguaje natural o sistemas predictivos, nuestro equipo combina experiencia técnica con un enfoque centrado en resultados para ofrecer una app con IA que potencie tu negocio y brinde una experiencia innovadora a tus usuarios."
    },
    {
        question: "¿Puedo publicar contenido de IA en mi sitio web?",
        slug: slugify("¿Puedo publicar contenido de IA en mi sitio web?"),
        image: "/fondo-publicar-contenido-banner.webp",
        shortDescription:
            "Entiende cómo Via facilita la publicación de contenido generado por inteligencia artificial en tu sitio web para mejorar la experiencia y el alcance.",
        sectionTitle: "Integración de agentes de inteligencia artificial para mejorar la experiencia y soporte en tu web",
        content:
            "Publicar contenido generado por inteligencia artificial en tu sitio web es una excelente manera de mantener tu sitio actualizado, relevante y atractivo para tus visitantes. En Via, implementamos soluciones que integran generadores automáticos de texto, imágenes y multimedia basados en IA, permitiéndote ofrecer contenido fresco y personalizado sin la necesidad de generar todo manualmente. Además, nos aseguramos de que el contenido cumpla con los estándares de calidad y optimización SEO para maximizar tu visibilidad en buscadores. Con Via, tu sitio web no solo se mantiene dinámico, sino que también se convierte en una plataforma innovadora que potencia la interacción con tus usuarios."
    },
    {
        question: "¿Cómo integrar un agente de IA a un sitio web?",
        slug: slugify("¿Cómo integrar un agente de IA a un sitio web?"),
        image: "/fondo-integrar-agente-banner.webp",
        shortDescription:
            "Aprende cómo Via implementa agentes de inteligencia artificial en sitios web para mejorar la interacción y atención al cliente.",
        sectionTitle: "Integración avanzada de agentes de IA para mejorar la atención y experiencia en tu sitio web",
        content:
            "Integrar un agente de inteligencia artificial en tu sitio web permite ofrecer atención personalizada, responder consultas en tiempo real y optimizar la experiencia del usuario. En Via, desarrollamos agentes de IA personalizados que se adaptan a las necesidades de tu negocio, utilizando tecnologías avanzadas como procesamiento de lenguaje natural y aprendizaje automático. Nuestros agentes pueden manejar desde preguntas frecuentes hasta procesos complejos, brindando soporte 24/7 sin necesidad de intervención humana constante. Con Via, la integración de un agente de IA no solo mejora la eficiencia operativa, sino que también eleva la satisfacción del cliente y fortalece la presencia digital de tu empresa."
    },
    {
        question: "¿Cuáles son los 10 tipos de IA?",
        slug: slugify("¿Cuáles son los 10 tipos de IA?"),
        image: "/fondo-10-tipos-banner.webp",
        shortDescription:
            "Explora los principales tipos de inteligencia artificial y cómo Via aplica estas tecnologías para transformar tu negocio.",
        sectionTitle: "Conoce los 10 tipos clave de inteligencia artificial y su impacto en la transformación digital",
        content:
            "La inteligencia artificial abarca una variedad de tipos que van desde sistemas reactivos simples hasta agentes autónomos y aprendizaje profundo. Entre los 10 tipos más reconocidos se incluyen IA reactiva, memoria limitada, teoría de la mente, auto-conciencia, aprendizaje supervisado, no supervisado, redes neuronales, algoritmos genéticos, procesamiento de lenguaje natural y visión por computadora. En Via, aprovechamos estas distintas categorías de IA para desarrollar soluciones personalizadas que optimizan procesos, automatizan tareas y mejoran la interacción con tus clientes, adaptándonos a las necesidades específicas de tu empresa para maximizar el impacto tecnológico."
    },
    {
        question: "¿Cómo puedo incorporar la IA a mi trabajo?",
        slug: slugify("¿Cómo puedo incorporar la IA a mi trabajo?"),
        image: "/fondo-puedo-incorporar-banner.webp",
        shortDescription:
            "Descubre cómo Via puede ayudarte a integrar inteligencia artificial en tus tareas laborales para aumentar productividad y eficiencia.",
        sectionTitle: "Cómo incorporar la inteligencia artificial para aumentar tu productividad y eficiencia laboral",
        content:
            "Incorporar inteligencia artificial en tu trabajo implica utilizar herramientas y sistemas que automatizan tareas repetitivas, analizan datos y facilitan la toma de decisiones. Via desarrolla soluciones personalizadas que integran IA para mejorar flujos de trabajo, desde asistentes virtuales que gestionan comunicaciones hasta análisis predictivo para optimizar estrategias. Al implementar estas tecnologías con Via, puedes aumentar tu productividad, reducir errores y enfocar tus esfuerzos en actividades de mayor valor, transformando tu forma de trabajar con la potencia de la inteligencia artificial."
    },
    {
        question: "¿Puedo construir un negocio con IA?",
        slug: slugify("¿Puedo construir un negocio con IA?"),
        image: "/fondo-construir-negocio-banner.webp",
        shortDescription:
            "Descubre cómo Via te ayuda a construir un negocio exitoso aprovechando el poder de la inteligencia artificial.",
        sectionTitle: "Construye un negocio innovador y escalable aprovechando la inteligencia artificial con Via",
        content:
            "Construir un negocio con inteligencia artificial es una oportunidad para innovar y destacar en el mercado actual. Via ofrece consultoría y desarrollo de soluciones basadas en IA que te permiten automatizar procesos, mejorar la experiencia del cliente y generar nuevas fuentes de ingresos. Desde chatbots inteligentes hasta análisis predictivo, Via te acompaña en cada etapa para transformar tu idea en un negocio rentable y escalable, utilizando tecnologías de vanguardia que se adaptan a tus objetivos y sector."
    },
    {
        question: "¿Cuánto cuesta agregar IA a una aplicación?",
        slug: slugify("¿Cuánto cuesta agregar IA a una aplicación?"),
        image: "/fondo-cuesta-agregar-banner.webp",
        shortDescription:
            "Conoce los factores que influyen en el costo de integrar inteligencia artificial en aplicaciones y cómo Via ofrece soluciones personalizadas y accesibles.",
        sectionTitle: "Factores clave que influyen en el costo de agregar IA a tu aplicación",
        content:
            "El costo de agregar inteligencia artificial a una aplicación varía según la complejidad del proyecto, las funcionalidades requeridas y el tipo de IA implementada. En Via evaluamos tus necesidades específicas para ofrecer soluciones personalizadas que maximicen el retorno de inversión sin sacrificar calidad. Ya sea integración de chatbots, reconocimiento de voz, análisis de datos o aprendizaje automático, Via combina experiencia técnica y un enfoque ágil para entregar aplicaciones inteligentes, eficientes y escalables que impulsan tu negocio digital."
    },
    {
        question: "¿Puedo utilizar IA para diseñar mi sitio web?",
        slug: slugify("¿Puedo utilizar IA para diseñar mi sitio web?"),
        image: "/fondo-utilizar-IA-banner.webp",
        shortDescription:
            "Descubre cómo Via integra inteligencia artificial para crear diseños web innovadores y personalizados que potencian tu presencia digital.",
        sectionTitle: "Diseña sitios web innovadores y personalizados utilizando inteligencia artificial",
        content:
            "Utilizar inteligencia artificial para diseñar un sitio web es una tendencia creciente que permite acelerar procesos creativos y generar experiencias únicas para los usuarios. Via emplea herramientas avanzadas de IA para analizar tendencias, preferencias de usuario y comportamiento, facilitando diseños adaptativos y atractivos que reflejan la identidad de tu marca. Con Via, tu sitio no solo es visualmente impactante, sino también optimizado para rendimiento y conversión, combinando creatividad humana con potencia tecnológica para entregar resultados excepcionales."
    },
    {
        question: "¿Puedo agregar chat gpt a mi sitio web?",
        slug: slugify("¿Puedo agregar chat gpt a mi sitio web?"),
        image: "/fondo-agregar-gpt-banner.webp",
        shortDescription:
            "Entérate cómo Via puede integrar ChatGPT en tu sitio web para mejorar la interacción con tus visitantes mediante inteligencia artificial conversacional.",
        sectionTitle: "Integración de ChatGPT para mejorar la interacción conversacional en tu sitio web",
        content:
            "Agregar ChatGPT a tu sitio web es una excelente forma de ofrecer atención personalizada y respuestas inmediatas a tus visitantes. Via desarrolla integraciones a medida que incorporan modelos de lenguaje avanzados como ChatGPT, permitiendo conversaciones naturales, soporte 24/7 y generación automática de contenido relevante. Nuestra experiencia garantiza que el chatbot se adapte a tus necesidades comerciales, brindando una experiencia de usuario fluida y aumentando la satisfacción y retención de clientes a través de la inteligencia artificial conversacional."
    },
    {
        question: "¿Dónde es recomendable crear una página web?",
        slug: slugify("¿Dónde es recomendable crear una página web?"),
        image: "/fondo-recomendable-crear-banner.webp",
        shortDescription:
            "Conoce por qué Via es la opción recomendada para crear páginas web profesionales y personalizadas en Colombia.",
        sectionTitle: "Por qué Via es la opción recomendada para crear páginas web profesionales en Colombia",
        content:
            "Decidir dónde crear tu página web es fundamental para garantizar un resultado que impulse tu negocio. En Colombia, existen diversas opciones, pero Via destaca por ofrecer un enfoque integral que combina diseño a medida, desarrollo web moderno y optimización SEO enfocada en resultados. Nuestro equipo experto entiende las necesidades locales y globales, asegurando que tu sitio web no solo sea visualmente atractivo, sino que también esté preparado para captar clientes y crecer online. Con Via, tienes un aliado estratégico que garantiza calidad, soporte continuo y soluciones tecnológicas adaptadas a tu mercado."
    },
    {
        question: "¿Cuáles son las mejores agencias de diseño en Colombia?",
        slug: slugify("¿Cuáles son las mejores agencias de diseño en Colombia?"),
        image: "/fondo-mejores-agencias-banner.webp",
        shortDescription:
            "Descubre por qué Via se posiciona entre las mejores agencias de diseño en Colombia, ofreciendo innovación y resultados efectivos.",
        sectionTitle: "Descubre las mejores agencias de diseño en Colombia y cómo Via marca la diferencia",
        content:
            "Colombia cuenta con varias agencias de diseño reconocidas, pero Via se distingue por su enfoque personalizado y uso de tecnologías avanzadas, incluyendo inteligencia artificial y automatización. Nuestra experiencia abarca desde diseño gráfico hasta desarrollo web integral, siempre orientado a potenciar la presencia digital de nuestros clientes. Elegir Via significa acceder a un equipo dedicado que entiende tu negocio y mercado, ofreciendo soluciones creativas, escalables y orientadas a maximizar el retorno de inversión. Somos una agencia comprometida con la innovación y el éxito de tu proyecto digital."
    },
    {
        question: "¿Cuánto cuesta el desarrollo de un sitio web?",
        slug: slugify("¿Cuánto cuesta el desarrollo de un sitio web?"),
        image: "/fondo-cuesta-desarrollo-banner.webp",
        shortDescription:
            "Descubre los factores que influyen en el costo de desarrollar un sitio web y cómo Via ofrece soluciones ajustadas a tu presupuesto.",
        sectionTitle: "Factores que afectan el costo del desarrollo de un sitio web profesional",
        content:
            "El costo de desarrollar un sitio web varía según la complejidad, funcionalidades y diseño personalizado que requieras. En Via, ofrecemos un enfoque flexible y transparente, adaptando cada proyecto a las necesidades y presupuesto de tu negocio. Desde sitios informativos hasta plataformas de comercio electrónico con integración de inteligencia artificial, nuestro equipo garantiza calidad, escalabilidad y soporte continuo. Al elegir Via, obtienes un desarrollo profesional que maximiza tu inversión y contribuye al crecimiento digital de tu empresa."
    },
    {
        question: "¿Cuánto gana un creador de páginas web en Colombia?",
        slug: slugify("¿Cuánto gana un creador de páginas web en Colombia?"),
        image: "/fondo-gana-creador-banner.webp",
        shortDescription:
            "Conoce el rango salarial de los creadores de páginas web en Colombia y cómo Via valora el talento especializado para proyectos digitales exitosos.",
        sectionTitle: "Rangos salariales de creadores de páginas web en Colombia y valor del talento digital",
        content:
            "El salario de un creador de páginas web en Colombia depende de su experiencia, habilidades técnicas y el tipo de proyectos que maneje. Los profesionales junior pueden ganar desde un salario básico, mientras que desarrolladores senior y especialistas en tecnologías avanzadas, como inteligencia artificial, pueden alcanzar ingresos superiores. En Via, valoramos el talento y la innovación, integrando expertos que garantizan desarrollos web de alta calidad. Nuestro equipo es un reflejo del compromiso y la profesionalidad que ofrecemos a nuestros clientes para llevar sus negocios al siguiente nivel digital."
    }
];
