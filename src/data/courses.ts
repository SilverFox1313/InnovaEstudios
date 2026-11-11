import { Course } from '../types';

export const CATEGORIES = [
  'Todos',
  'Programación',
  'Diseño UI/UX',
  'Inteligencia Artificial',
  'Negocios Digitales'
];

export const COURSES: Course[] = [
  {
    id: 'react-ts-mastery',
    title: 'Máster Avanzado en React 19 & TypeScript',
    description: 'Aprende a dominar el desarrollo full-time creando arquitecturas mantenibles, tipado estricto y optimizaciones avanzadas.',
    longDescription: 'Lleva tus habilidades de desarrollo Frontend al máximo nivel. En este curso aprenderás a usar las características novedosas de React 19 junto a la rigurosidad y seguridad de TypeScript. Cubriremos desde la optimización del renderizado hasta patrones de diseño avanzados como Render Props, Componentes Compuestos y custom hooks altamente reutilizables.',
    instructor: 'Alex Aranda (Senior Frontend Architect)',
    category: 'Programación',
    price: 49.99,
    rating: 4.9,
    duration: '12 horas',
    level: 'Avanzado',
    publishedDate: 'Mayo 2026',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
    skillsLearned: [
      'Tipado estricto de componentes y custom hooks',
      'Uso de nuevos Hooks de React 19 (use, useActionState, useOptimistic)',
      'Optimización de rendering y perfiles de rendimiento',
      'Arquitectura de carpetas escalable tipo Feature-Based'
    ],
    lessons: [
      {
        id: 'rts-1',
        title: '1. Introducción al ecosistema de React 19 + TypeScript',
        duration: '15:20',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Bienvenido al curso. En esta lección inicial veremos:
- Configuración idónea de tsconfig.json para desarrollo web moderno.
- Por qué React 19 redefine la carga de recursos de forma nativa.
- Preparación del espacio de trabajo con tipado estricto activado (strict: true).

Recuerda tener instalado Node.js LTS antes de comenzar con la configuración del proyecto.`
      },
      {
        id: 'rts-2',
        title: '2. Tipando Hooks avanzados de React',
        duration: '25:45',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        content: `Explicación detallada de cómo escribir tipos correctos para hooks complejos:
- Generics con useState y useRef.
- Tipado del objeto event de formularios y eventos globales del DOM.
- El uso de useMemo y useCallback de forma responsable y cuándo son verdaderamente necesarios.

Ejemplo clave:
\`\`\`typescript
const inputRef = useRef<HTMLInputElement>(null);
const [data, setData] = useState<User | null>(null);
\`\`\`
Asegúrate de comprobar que el ref no sea null antes de usarlo.`
      },
      {
        id: 'rts-3',
        title: '3. El estado global y el Context API',
        duration: '32:10',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Aprende a diseñar almacenes de datos limpios usando Context y hooks personalizados:
- Estructuración de Proveedores (Providers) eficientes para evitar re-renders innecesarios.
- Creación de selectores lógicos simples.
- Alternativas modernas comparativas con Zustand o Redux Toolkit.

Regla de oro: Divide tus contextos si tienes estados que cambian con mucha frecuencia.`
      },
      {
        id: 'rts-4',
        title: '4. Buenas Prácticas del renderizado y Tests',
        duration: '22:15',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        content: `Culmina el módulo optimizando tu aplicación en producción:
- Entendimiento práctico de la hidratación y Server Components.
- Implementación de Suspense para carga asíncrona de datos lenta.
- Pruebas unitarias básicas de componentes interactivos.`
      }
    ]
  },
  {
    id: 'ui-ux-figma',
    title: 'Diseño de Interfaces Seductoras: UI/UX con Figma',
    description: 'Transforma ideas abstractas en interfaces de usuario impecables, equilibrando la tipografía, la jerarquía y el color.',
    longDescription: 'El diseño no es cómo se ve, sino cómo funciona. Este curso práctico te enseñará las reglas esenciales de la composición visual, el diseño centrado en el usuario y la psicología del color. Aprenderás a construir un sistema de diseño modular en Figma, con componentes dinámicos con Auto-Layout que se adapten a cualquier pantalla.',
    instructor: 'Camila Torres (Senior Product Designer)',
    category: 'Diseño UI/UX',
    price: 34.99,
    rating: 4.8,
    duration: '8 horas',
    level: 'Principiante',
    publishedDate: 'Abril 2026',
    imageUrl: 'https://images.unsplash.com/photo-1561070791-26c113006238?w=800&auto=format&fit=crop&q=80',
    skillsLearned: [
      'Principios fundamentales de jerarquía y balance tipográfico',
      'Dominio del Auto-Layout automático en pantallas responsive',
      'Creación de bibliotecas de componentes interactivos y variantes',
      'Diseño de flujos de usuario intuitivos y pruebas de usabilidad'
    ],
    lessons: [
      {
        id: 'fig-1',
        title: '1. Fundamentos del espacio y la tipografía',
        duration: '18:40',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        content: `Alineación de sistemas espaciales de 4px y 8px:
- Por qué la consistencia espacial en tus márgenes crea un ritmo visual intuitivo.
- Guía para emparejar fuentes Sans-Serif con tipografías de contraste Display.
- El poder destructivo del ruido tipográfico y cómo reducir la fatiga en lectura.`
      },
      {
        id: 'fig-2',
        title: '2. El secreto de los Bento Grids',
        duration: '20:15',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Domina el patrón visual de moda para organizar información densa:
- Qué son los bento grids y cuándo utilizarlos correctamente.
- Creación de bloques interactivos con esquinas redondeadas y sutiles sombras de profundidad.
- Consejos prácticos de contraste de fondo utilizando Tailwind CSS.`
      },
      {
        id: 'fig-3',
        title: '3. Sistemas de Diseño: Variantes y Auto-Layout',
        duration: '28:50',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        content: `Creación de una biblioteca sólida para ahorrar cientos de horas:
- Auto-Layout dinámico con "hug contents" y "fill container".
- Crear estados de componentes (default, hover, active, disabled).
- Cómo documentar tokens de color semánticos de forma profesional.`
      },
      {
        id: 'fig-4',
        title: '4. Prototipado y Microinteracciones',
        duration: '24:10',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Dale vida a tus pantallas fijas de Figma:
- Uso de Smart Animate para simular transiciones realistas del producto.
- Animación de paneles deslizantes, menús desplegables y botones con retroalimentación inmediata.`
      }
    ]
  },
  {
    id: 'ia-creadores',
    title: 'Inteligencia Artificial Práctica para Creadores',
    description: 'Ahorra horas integrando modelos generativos como Gemini en tu flujo de trabajo diario de desarrollo y contenido.',
    longDescription: 'La IA no reemplazará a los creadores, pero los creadores que dominen la IA reemplazarán a los que no. No pierdas tiempo con conceptos puramente abstractos. En este programa enfocado a proyectos aprenderás ingeniería de instrucciones (prompts) eficaces y automatizaremos la creación de contenido, código y documentación con Gemini.',
    instructor: 'Daniel Mendoza (AI Engineer & Creator)',
    category: 'Inteligencia Artificial',
    price: 39.99,
    rating: 4.7,
    duration: '6 horas',
    level: 'Intermedio',
    publishedDate: 'Enero 2026',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80',
    skillsLearned: [
      'Anatomía avanzada de un prompt estructurado (Role, Context, Instruction, Constraint)',
      'Programación con la API de @google/genai en el backend',
      'Desarrollo de asistentes autónomos que interactúan con APIs externas',
      'Automatización de síntesis de notas y resúmenes automáticos'
    ],
    lessons: [
      {
        id: 'ai-1',
        title: '1. Ingeniería de Prompts que no fallan',
        duration: '14:30',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `El prompt es el nuevo código. Analizaremos las técnicas de comunicación clara:
- Few-shot prompting y Chain-of-Thought (Cadena de Pensamiento).
- Cómo delimitar formatos estrictos en la salida (como JSON válido para APIs).
- Definición rigurosa de límites para impedir alucinaciones o desvíos del rol establecido.`
      },
      {
        id: 'ai-2',
        title: '2. Integrando la API de Gemini SDK en Node/React',
        duration: '26:10',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        content: `Escribe tus primeras llamadas de servidor usando el SDK moderno de @google/genai:
- Configuración de variables de entorno para resguardar la API Key de forma segura.
- Llamadas rápidas a modelos de texto e imágenes integradas.
- Flujos de streams para mostrar las respuestas bloque a bloque de manera sumamente dinámica.`
      },
      {
        id: 'ai-3',
        title: '3. Casos de uso reales: Resumidores automáticos',
        duration: '22:40',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Construcción de una herramienta funcional para resumir PDFs extensos o reuniones:
- Chunking: cómo dividir textos largos para no superar los límites de tokens.
- Extracción automatizada de tareas pendientes y catalogación por prioridades (Alta, Media, Baja) usando la IA.`
      }
    ]
  },
  {
    id: 'negocios-digitales',
    title: 'Lanzamiento de Negocios Digitales & Freelancing',
    description: 'Transforma tu conocimiento técnico en un negocio rentable y sostenible. Aprende a cobrar lo justo por tu tiempo.',
    longDescription: 'Saber programar o diseñar es solo la mitad de la ecuación. Si no sabes promocionarte, estructurar ofertas de alto valor o negociar un contrato, estarás siempre compitiendo por centavos. En este curso aprenderás a escalar tarifas, a empaquetar servicios recurrentes y a construir una marca personal respetada.',
    instructor: 'Laura Salgado (Digital Business Advisor)',
    category: 'Negocios Digitales',
    price: 0, // FREE!
    rating: 4.9,
    duration: '5 horas',
    level: 'Principiante',
    publishedDate: 'Marzo 2026',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    skillsLearned: [
      'Fórmulas rigurosas de fijación de precios (Valor real en lugar de Costo-Hora)',
      'Redacción de contratos de desarrollo de software autoprotegidos',
      'Creación de una base sólida de marca personal en plataformas profesionales',
      'Estrategias de adquisición de clientes orgánicas de alta gama'
    ],
    lessons: [
      {
        id: 'biz-1',
        title: '1. El fin del "Costo por Hora"',
        duration: '16:50',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        content: `Por qué cobrar por hora penaliza tu velocidad y eficiencia:
- Modelos de Pricing basados en el valor (Value-Based Pricing) aportado a la facturación del cliente.
- Cómo vender retorno de inversión (ROI) en lugar de líneas de código.
- Plantilla de conversación rápida para negociaciones iniciales telefónicas.`
      },
      {
        id: 'biz-2',
        title: '2. Elaboración de propuestas irresistibles',
        duration: '23:30',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Estructura ganadora para un documento de propuesta formal:
- Resumen ejecutivo alineado estrictamente con el objetivo comercial del cliente.
- Presentación de 3 opciones de escala de precio para ofrecer alternativas de decisión interna.
- Cómo incluir garantías de soporte técnico extendido para cobrar un extra mensual.`
      },
      {
        id: 'biz-3',
        title: '3. Embudo minimalista de atracción en LinkedIn',
        duration: '20:10',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        content: `Consigue tus primeros leads calificados sin gastar un centavo en publicidad:
- Cómo optimizar tu perfil para visitas de tomadores de decisiones.
- Calendario de publicación simple centrado en resolver dolores exactos del mercado meta.`
      }
    ]
  }
];
