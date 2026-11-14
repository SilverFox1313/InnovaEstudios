-- Seed completo y auditado (v2) de las 10 lecciones del curso: Comandos Esenciales de Linux
-- Ejecutable de forma idempotente en Supabase SQL Editor

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513647168', 'custom-1794510366770', 'Lección 1: Tu primer contacto con la Terminal', '15 min lectura', $md_linux_1$
**⏱️ Tiempo estimado:** 15 min | **🎯 Objetivo:** Comprender cómo funciona la interfaz de línea de comandos (CLI), dominar los 5 atajos de teclado esenciales y aprender a consultar la documentación oficial sin salir de la terminal.

---

## ¿Por qué usar la Terminal en el mundo real?

Aunque los entornos gráficos son cómodos para tareas cotidianas, **en servidores en la nube, contenedores Docker, pipelines CI/CD y administración de sistemas no existe interfaz gráfica**. La terminal (CLI) consume una fracción mínima de recursos, te permite automatizar tareas repetitivas en segundos y funciona exactamente igual en tu portátil que en un servidor remoto a miles de kilómetros.

Cuando escribes en la terminal, te comunicas con el **shell** (normalmente **Bash** o **Zsh**), el intérprete que lee tus instrucciones, ejecuta los programas correspondientes y te devuelve el resultado en pantalla.

### Anatomía de un comando y sensibilidad a mayúsculas

Casi cualquier instrucción en Linux sigue exactamente esta estructura:

```bash
comando -opciones argumento
```

- **`comando`**: El programa o acción que deseas ejecutar (por ejemplo, `ls` o `uname`).
- **`-opciones` (banderas / flags)**: Modifican el comportamiento del comando. Las opciones cortas usan un guion (`-a`) y las largas usan doble guion (`--all`).
- **`argumento`**: El archivo, carpeta o valor sobre el que actúa el comando.

> ⚠️ **Cuidado con esto:** Linux es **estrictamente sensible a mayúsculas y minúsculas** (*case-sensitive*). Para el sistema, `archivo.txt`, `Archivo.txt` y `ARCHIVO.TXT` son tres archivos completamente distintos, y escribir `LS` en lugar de `ls` producirá un error de comando no encontrado.

## ⌨️ Comandos clave y atajos vitales

| Atajo / Comando | Función | Descripción práctica |
| :--- | :--- | :--- |
| `Tab` | Autocompletar | Completa nombres de comandos, archivos y rutas; púlsalo dos veces para ver sugerencias. |
| `Ctrl + C` | Cancelar proceso | Detiene de inmediato el comando actual si se quedó bloqueado o tardando demasiado. |
| `Flecha Arriba` | Navegar historial | Recupera los comandos anteriores para reutilizarlos o corregir errores sin reescribir. |
| `Ctrl + L` / `clear` | Limpiar pantalla | Despeja el área de trabajo manteniendo intacto el historial de la sesión. |
| `history` | Ver historial | Muestra una lista numerada con los últimos comandos ejecutados en la terminal. |
| `comando --help` | Ayuda rápida | Imprime un resumen directo de sintaxis y opciones disponibles del comando. |
| `man comando` | Manual completo | Abre la documentación oficial paginada del sistema (sal con la tecla `q`). |

## 💻 Ejemplos en acción

### 1. Ejecutar tu primer comando y explorar opciones

Comprueba quién eres en el sistema, qué kernel estás usando y prueba la sensibilidad a mayúsculas:

```bash
usuario@linux:~$ whoami
usuario

usuario@linux:~$ uname -a
Linux servidor-practica 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux

usuario@linux:~$ WHOAMI
WHOAMI: orden no encontrada
```

### 2. Pedir ayuda sin salir de la terminal

Cuando no recuerdes una bandera exacta, consulta la ayuda rápida con `--help` o abre el manual completo con `man`:

```bash
usuario@linux:~$ date --help | head -n 5
Modo de empleo: date [OPCIÓN]... [+FORMATO]
  o bien:       date [-u|--utc|--universal] [MMDDhhmm[[CC]AA][.ss]]
Muestra la hora actual en el FORMATO dado, o establece la fecha del sistema.

usuario@linux:~$ man uname
# Dentro del manual: usa Flechas para bajar, /palabra para buscar y presiona 'q' para salir.
```

### 3. Reutilizar comandos con history

```bash
usuario@linux:~$ history | tail -n 4
  101  whoami
  102  uname -a
  103  date --help | head -n 5
  104  history | tail -n 4
```

> 💡 **Tip Pro:** Si ejecutas `!102` (signo de exclamación seguido del número de línea en `history`), la terminal volverá a lanzar ese comando al instante. También puedes presionar `Ctrl + R` para buscar de forma interactiva cualquier comando que hayas escrito días atrás.

---

## ⚡ Mini-Reto de 3 minutos

1. Abre tu terminal y escribe `uname -sr` para conocer el nombre y la versión del kernel de tu sistema.
2. Escribe las dos primeras letras de `history` (`hi`) y presiona la tecla `Tab` para autocompletar el comando y ver tus últimas instrucciones ejecutadas.
3. Ejecuta `ping localhost` y observa cómo continúa enviando paquetes sin parar; detén el proceso al instante usando `Ctrl + C`.
4. Abre el manual de `date` con `man date`, busca cómo mostrar solo el año actual, sal del manual presionando `q` y limpia tu pantalla con `Ctrl + L`.
$md_linux_1$, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513666962', 'custom-1794510366770', 'Lección 2: Ubicación y exploración de carpetas', '15 min lectura', $md_linux_2$
**⏱️ Tiempo estimado:** 15 min | **🎯 Objetivo:** Entender la jerarquía del sistema de archivos de Linux a partir de la raíz `/`, identificar tu ubicación exacta y desplazarte entre directorios con fluidez usando rutas absolutas y relativas.

---

## El árbol de directorios en Linux (`/`)

A diferencia de Windows, donde cada unidad tiene su propia letra (`C:\`, `D:\`), **en Linux todo nace de un único punto llamado directorio raíz (`/`)**. Tus discos, carpetas de usuario, configuraciones y programas cuelgan como ramas dentro de ese mismo árbol:

- **`/`**: Raíz principal de todo el sistema de archivos.
- **`/home/tu_usuario`** (abreviado como `~`): Tu carpeta personal de trabajo, documentos y proyectos.
- **`/etc`**: Archivos de configuración del sistema y servicios (Nginx, SSH, usuarios).
- **`/var/log`**: Registros (logs) de actividad y errores de aplicaciones y del sistema.
- **`/tmp`**: Archivos temporales que el sistema puede limpiar automáticamente.

En el trabajo diario, orientarte sin ver iconos te permite inspeccionar servidores, localizar configuraciones y verificar pesos de archivos en cuestión de segundos.

## ⌨️ Comandos clave

Sintaxis base:

```bash
pwd
ls [opciones] [ruta]
cd [ruta]
```

| Comando / Opción | Significado | Para qué se usa |
| :--- | :--- | :--- |
| `pwd` | *Print Working Directory* | Muestra la ruta completa de la carpeta en la que te encuentras ahora mismo. |
| `ls -l` | Formato largo | Lista permisos, propietario, tamaño en bytes y fecha de modificación. |
| `ls -a` | Archivos ocultos | Incluye archivos y carpetas cuyo nombre comienza con un punto (`.`). |
| `ls -h` | *Human-readable* | Convierte tamaños grandes en unidades legibles (`K`, `M`, `G`) al usarse con `-l`. |
| `ls -la` | Largo + ocultos | La combinación más usada para inspeccionar todo el contenido real de un directorio. |
| `cd /ruta/abs` | Ruta absoluta | Navega desde la raíz `/` sin importar dónde te encuentres ubicado. |
| `cd carpeta` | Ruta relativa | Entra a una subcarpeta ubicada dentro de tu directorio actual. |
| `cd ..` | Subir un nivel | Retrocede a la carpeta padre inmediatamente superior. |
| `cd ~` | Ir al Home | Regresa de inmediato a tu carpeta personal (`/home/tu_usuario`). |
| `cd -` | Directorio previo | Alterna instantáneamente hacia la última carpeta en la que estuviste. |

## 💻 Ejemplos en acción

### 1. Saber dónde estás y listar con detalle humano

```bash
usuario@linux:~$ pwd
/home/usuario

usuario@linux:~$ ls -lh
total 16K
drwxr-xr-x 2 usuario usuario 4,0K nov 14 09:10 Descargas
drwxr-xr-x 4 usuario usuario 4,0K nov 14 09:12 Documentos
-rw-r--r-- 1 usuario usuario 2,4K nov 14 09:15 notas_servidor.txt
```

### 2. Ver archivos de configuración ocultos (`-la`)

En Linux, los archivos de configuración del usuario empiezan con un punto (como `.bashrc` o `.ssh`) y quedan ocultos por defecto:

```bash
usuario@linux:~$ ls -la
total 36
drwxr-x--- 5 usuario usuario 4096 nov 14 09:15 .
drwxr-xr-x 3 root    root    4096 nov 10 08:00 ..
-rw-r--r-- 1 usuario usuario  220 nov 10 08:00 .bash_logout
-rw-r--r-- 1 usuario usuario 3771 nov 10 08:00 .bashrc
drwx------ 2 usuario usuario 4096 nov 12 14:20 .ssh
drwxr-xr-x 2 usuario usuario 4096 nov 14 09:10 Descargas
```

### 3. Navegar entre rutas absolutas, relativas y atajos

```bash
usuario@linux:~$ cd /var/log
usuario@linux:/var/log$ pwd
/var/log

usuario@linux:/var/log$ cd ..
usuario@linux:/var$ pwd
/var

usuario@linux:/var$ cd -
/var/log

usuario@linux:/var/log$ cd ~
usuario@linux:~$ pwd
/home/usuario
```

> 💡 **Tip Pro:** Si escribes `cd` a secas (sin argumentos) y presionas Enter, Linux te llevará siempre a tu carpeta personal `~`, exactamente igual que `cd ~`. Y recuerda que `.` representa la carpeta actual mientras `..` representa la carpeta superior.

> ⚠️ **Cuidado con esto:** Olvidar la barra inicial `/` en una ruta absoluta es un error clásico. `cd etc` busca una carpeta `etc` dentro de donde estás ahora, mientras que `cd /etc` va directamente a la carpeta de configuración del sistema desde la raíz.

---

## ⚡ Mini-Reto de 3 minutos

1. Ejecuta `pwd` para confirmar tu ubicación inicial y luego entra a `/etc` usando una ruta absoluta.
2. Lista los archivos de `/etc` en formato largo y legible para humanos con `ls -lh` (si es muy largo, fíjate en las columnas de permisos, propietario y tamaño).
3. Retrocede un nivel con `cd ..` para comprobar que llegaste a `/`, y luego regresa a `/etc` usando `cd -`.
4. Vuelve a tu directorio personal con `cd ~` y muestra también los archivos ocultos ejecutando `ls -la`.
$md_linux_2$, 1)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513681921', 'custom-1794510366770', 'Lección 3: Creación y organización de archivos', '15 min lectura', $md_linux_3$
**⏱️ Tiempo estimado:** 15 min | **🎯 Objetivo:** Crear estructuras completas de directorios de un solo golpe, generar archivos vacíos, realizar copias de seguridad de archivos o carpetas enteras y mover o renombrar elementos con precisión.

---

## Organizar proyectos desde la terminal

Cuando despliegas una aplicación, preparas un entorno de pruebas o creas un respaldo rápido antes de modificar un archivo de configuración crítico en producción, necesitas manipular archivos y directorios sin depender de un gestor de ventanas. Con cuatro comandos dominarás el 90% de la gestión diaria de archivos en cualquier sistema Linux.

## ⌨️ Comandos clave

Sintaxis base:

```bash
mkdir [opciones] directorio
touch archivo1 archivo2
cp [opciones] origen destino
mv [opciones] origen destino
```

| Comando / Opción | Función | Descripción práctica |
| :--- | :--- | :--- |
| `mkdir nombre` | Crear directorio | Crea una carpeta nueva en la ruta indicada. |
| `mkdir -p a/b/c` | Rutas anidadas | Crea automáticamente todas las carpetas intermedias si aún no existen y no falla si ya están creadas. |
| `touch archivo` | Crear archivo vacío | Genera un archivo vacío nuevo (o actualiza la fecha de modificación si ya existe). |
| `cp archivo copia` | Copiar archivo | Duplica un archivo conservando intacto el original. |
| `cp -r dir1 dir2` | Copiar carpeta | Copia de forma **recursiva** un directorio junto con todo su contenido y subcarpetas. |
| `cp -v` | Modo detallado (*verbose*) | Imprime en pantalla exactamente qué archivo o carpeta se está copiando. |
| `mv origen destino` | Mover o renombrar | Traslada un archivo/carpeta a otra ruta o le cambia el nombre si permanece en el mismo directorio. |

## 💻 Ejemplos en acción

### 1. Crear una estructura de proyecto completa en un segundo

```bash
usuario@linux:~$ mkdir -p proyecto_web/src/components proyecto_web/backups
usuario@linux:~$ cd proyecto_web
usuario@linux:~/proyecto_web$ touch README.md .env src/index.js
usuario@linux:~/proyecto_web$ ls -la
total 16
drwxr-xr-x 4 usuario usuario 4096 nov 14 10:05 .
drwxr-x--- 6 usuario usuario 4096 nov 14 10:05 ..
-rw-r--r-- 1 usuario usuario    0 nov 14 10:05 .env
-rw-r--r-- 1 usuario usuario    0 nov 14 10:05 README.md
drwxr-xr-x 2 usuario usuario 4096 nov 14 10:05 backups
drwxr-xr-x 3 usuario usuario 4096 nov 14 10:05 src
```

### 2. Hacer copias de seguridad de archivos y carpetas completas

```bash
usuario@linux:~/proyecto_web$ cp -v .env backups/.env.bak
'.env' -> 'backups/.env.bak'

usuario@linux:~/proyecto_web$ cp -rv src backups/src_respaldo
'src' -> 'backups/src_respaldo'
'src/components' -> 'backups/src_respaldo/components'
'src/index.js' -> 'backups/src_respaldo/index.js'
```

### 3. Renombrar y mover archivos con `mv`

En Linux no existe un comando llamado `rename` de uso estándar para archivos sueltos: **mover dentro de la misma carpeta equivale a renombrar**:

```bash
usuario@linux:~/proyecto_web$ mv README.md LEEME.md
usuario@linux:~/proyecto_web$ mv LEEME.md backups/
usuario@linux:~/proyecto_web$ ls backups/
LEEME.md  src_respaldo
```

> ⚠️ **Cuidado con esto:** Tanto `cp` como `mv` **sobrescriben el archivo de destino sin pedir confirmación** si ya existe un archivo con ese mismo nombre. Si quieres que la terminal te pregunte antes de sobrescribir nada, añade la bandera `-i` (*interactive*): `cp -i` o `mv -i`.

> 💡 **Tip Pro:** Puedes crear varios archivos o carpetas numeradas en una sola línea usando expansión de llaves en Bash: `touch capitulo_{1..5}.md` creará al instante `capitulo_1.md` hasta `capitulo_5.md`.

---

## ⚡ Mini-Reto de 3 minutos

1. En tu carpeta personal `~`, crea de una sola vez la estructura `practica_linux/docs/notas` usando `mkdir -p`.
2. Entra a `practica_linux` y crea dos archivos vacíos llamados `borrador.txt` y `config.cfg` con un único comando `touch`.
3. Copia `config.cfg` dentro de `docs/` renombrándolo a `config.cfg.bak` usando `cp -v`, y luego duplica toda la carpeta `docs` como `docs_backup` con `cp -rv`.
4. Renombra `borrador.txt` a `final.txt` con `mv` y muévelo dentro de `docs/notas/`.
$md_linux_3$, 2)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513700121', 'custom-1794510366770', 'Lección 4: Eliminación segura y limpieza', '12 min lectura', $md_linux_4$
**⏱️ Tiempo estimado:** 12 min | **🎯 Objetivo:** Eliminar archivos y directorios de manera controlada, distinguir cuándo usar `rmdir` frente a `rm -r` y evitar accidentes irreversibles al trabajar con comodines y `rm -rf`.

---

## No hay papelera de reciclaje en la terminal

En un entorno gráfico, borrar un archivo lo envía a la Papelera por si cambias de opinión. **En la terminal de Linux, `rm` desvincula el archivo del sistema de forma directa e inmediata.** Por eso, limpiar logs antiguos, carpetas temporales o artefactos de compilación requiere precisión quirúrgica y buenos hábitos de verificación previa.

## ⌨️ Comandos clave

Sintaxis base:

```bash
rm [opciones] archivo_o_ruta
rmdir carpeta_vacia
```

| Comando / Opción | Función | Cuándo utilizarlo |
| :--- | :--- | :--- |
| `rm archivo` | Borrar archivo | Elimina uno o varios archivos puntuales. |
| `rm -i archivo` | Confirmación interactiva | Pregunta `¿borrar el fichero regular...?` antes de eliminar cada elemento. |
| `rm -v archivo` | Modo detallado | Imprime en consola cada archivo eliminado para llevar control visual. |
| `rmdir carpeta` | Borrar carpeta vacía | Solo elimina directorios completamente vacíos; falla de forma segura si hay algo dentro. |
| `rm -r carpeta` | Borrado recursivo | Elimina un directorio junto con todas sus subcarpetas y archivos internos. |
| `rm -rf carpeta` | Recursivo y forzado | Borra todo sin pedir confirmaciones ni mostrar avisos de archivos protegidos contra escritura. |

## 💻 Ejemplos en acción

### 1. Borrado seguro de archivos con confirmación y detalle

```bash
usuario@linux:~/practica_linux$ rm -iv temp_1.log temp_2.log
rm: ¿borrar el fichero regular vacío 'temp_1.log'? s
eliminado 'temp_1.log'
rm: ¿borrar el fichero regular vacío 'temp_2.log'? n
```

### 2. Diferencia práctica entre `rmdir` y `rm -r`

```bash
usuario@linux:~/practica_linux$ mkdir carpeta_vacia
usuario@linux:~/practica_linux$ rmdir carpeta_vacia

usuario@linux:~/practica_linux$ rmdir docs_backup
rmdir: fallo al borrar 'docs_backup': El directorio no está vacío

usuario@linux:~/practica_linux$ rm -rv docs_backup
eliminado 'docs_backup/config.cfg.bak'
eliminado el directorio 'docs_backup/notas'
eliminado el directorio 'docs_backup'
```

### 3. Regla de oro antes de usar comodines (`*`)

Si deseas eliminar todos los archivos `.tmp`, **lista primero exactamente qué coincide con el patrón** usando `ls` antes de sustituir `ls` por `rm`:

```bash
usuario@linux:~/practica_linux$ ls *.tmp
cache_01.tmp  sesion_02.tmp

usuario@linux:~/practica_linux$ rm -v *.tmp
eliminado 'cache_01.tmp'
eliminado 'sesion_02.tmp'
```

> ⚠️ **Cuidado con esto:** `rm -rf` es el comando más peligroso de Linux. Un simple espacio accidental en una ruta —por ejemplo escribir `rm -rf / tmp/prueba` en lugar de `rm -rf /tmp/prueba`— o ejecutar `sudo rm -rf *` en el directorio equivocado **puede destruir el sistema operativo o tus datos en milisegundos sin posibilidad de deshacerlo**. Nunca ejecutes `rm -rf` con prisas ni sin verificar antes con `pwd` dónde estás ubicado.

> 💡 **Tip Pro:** Si trabajas en un entorno con archivos importantes, acostúmbrate a usar `rm -ri carpeta` para directorios pequeños: te permitirá revisar carpeta por carpeta antes de borrar definitivamente.

---

## ⚡ Mini-Reto de 3 minutos

1. Crea una carpeta de pruebas `~/zona_limpieza` con dos archivos vacíos (`a.txt`, `b.log`) y una subcarpeta vacía llamada `vacia`.
2. Elimina la subcarpeta `vacia` usando `rmdir vacia`.
3. Borra `a.txt` utilizando `rm -iv a.txt` y confirma con `s` cuando la terminal te pregunte.
4. Sal un nivel hacia `~` con `cd ..`, verifica tu ruta con `pwd` y elimina toda la carpeta `zona_limpieza` con `rm -rv zona_limpieza`.
$md_linux_4$, 3)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513719449', 'custom-1794510366770', 'Lección 5: Lectura rápida de archivos de texto', '15 min lectura', $md_linux_5$
**⏱️ Tiempo estimado:** 15 min | **🎯 Objetivo:** Inspeccionar configuraciones, leer archivos extensos sin saturar la terminal, revisar encabezados o últimas líneas y monitorear registros (logs) en tiempo real.

---

## Leer sin abrir un editor pesado

En Linux, casi toda la configuración del sistema, registros de errores, variables de entorno y código fuente son archivos de texto plano. Abrir un archivo de logs de 500 MB en un editor visual puede colgar tu sesión SSH; en cambio, las herramientas de lectura en terminal muestran exactamente la parte del archivo que necesitas en una fracción de segundo.

## ⌨️ Comandos clave

Sintaxis base:

```bash
cat archivo
less archivo
head -n N archivo
tail -n N archivo
tail -f archivo.log
```

| Comando / Opción | Función | Uso recomendado |
| :--- | :--- | :--- |
| `cat archivo` | Volcado completo | Imprime todo el contenido en pantalla de una sola vez. Ideal para archivos cortos. |
| `cat -n archivo` | Con número de línea | Numera cada línea impresa para localizar configuraciones rápidamente. |
| `less archivo` | Lector paginado | Permite avanzar/retroceder por archivos grandes sin cargar todo en memoria de golpe. |
| `head -n 10` | Primeras líneas | Muestra solo las primeras 10 líneas (por defecto muestra 10 si omites `-n`). |
| `tail -n 20` | Últimas líneas | Muestra las 20 líneas finales, donde suelen quedar los errores más recientes. |
| `tail -f archivo` | Seguimiento en vivo | Mantiene el archivo abierto y muestra en tiempo real cada línea nueva que se escribe. |

## 💻 Ejemplos en acción

### 1. Inspeccionar configuraciones cortas con `cat` y ver el inicio con `head`

```bash
usuario@linux:~$ cat -n /etc/hostname
     1  servidor-produccion

usuario@linux:~$ head -n 5 /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
```

### 2. Navegar archivos extensos con `less`

Cuando abras un archivo largo con `less /var/log/syslog` (o `less /etc/services`), utiliza estas teclas internas:

- **`Espacio`** o **`AvPág`**: Avanzar una página completa.
- **`b`**: Retroceder una página hacia atrás.
- **`/texto`** + `Enter`: Buscar hacia abajo cualquier palabra; presiona **`n`** para saltar a la siguiente coincidencia.
- **`G`** (mayúscula): Saltar instantáneamente al final del archivo (`g` minúscula vuelve al principio).
- **`q`**: Salir de `less` limpiamente y volver al prompt.

### 3. Vigilar un registro en tiempo real con `tail -f`

```bash
usuario@linux:~$ tail -n 3 -f /var/log/auth.log
Nov 14 10:18:02 servidor sshd[4102]: Accepted publickey for deploy from 192.168.1.40
Nov 14 10:18:15 servidor sudo: deploy : TTY=pts/0 ; USER=root ; COMMAND=/usr/bin/apt update
Nov 14 10:19:01 servidor CRON[4155]: pam_unix(cron:session): session opened for user root
# (La terminal queda escuchando nuevas líneas; presiona Ctrl + C para detener el seguimiento)
```

> ⚠️ **Cuidado con esto:** Evita ejecutar `cat` sobre archivos binarios (imágenes, ejecutables o archivos `.zip`). Verter bytes aleatorios en tu terminal puede desconfigurar los caracteres de tu sesión. Si te pasa por error, escribe `reset` y pulsa Enter.

> 💡 **Tip Pro:** En desarrollo web o backend, `tail -f app.log` es tu mejor aliado: déjalo abierto en una pestaña dividida mientras pruebas peticiones para ver exactamente qué falla en el instante en que ocurre.

---

## ⚡ Mini-Reto de 3 minutos

1. Usa `head -n 8 /etc/passwd` para revisar las primeras 8 líneas de la lista de usuarios del sistema.
2. Ejecuta `tail -n 5 /etc/passwd` para inspeccionar únicamente los últimos 5 registros agregados al archivo.
3. Abre el catálogo de puertos estándar con `less /etc/services`, escribe `/ssh` y presiona `Enter` para buscar el puerto SSH, luego sal con `q`.
4. Ejecuta `tail -f /var/log/syslog` (o cualquier archivo de texto al que luego le añadas una línea desde otra terminal) durante unos segundos y detén la escucha con `Ctrl + C`.
$md_linux_5$, 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513753217', 'custom-1794510366770', 'Lección 6: Búsqueda y filtrado de información', '18 min lectura', $md_linux_6$
**⏱️ Tiempo estimado:** 18 min | **🎯 Objetivo:** Localizar archivos perdidos en cualquier rincón del disco con `find` y filtrar líneas específicas dentro de cientos de archivos de código o logs usando `grep`.

---

## Encontrar la aguja en el pajar

En un servidor real hay decenas de miles de archivos. No puedes revisar carpeta por carpeta para saber dónde quedó `nginx.conf` o en qué línea de un log de 100.000 entradas ocurrió un error `500`. **`find` busca archivos por sus propiedades** (nombre, tipo, fecha) y **`grep` busca contenido dentro de los archivos**.

## ⌨️ Comandos clave

Sintaxis base:

```bash
find [ruta_inicio] [criterios]
grep [opciones] "patron" [archivo_o_ruta]
```

| Comando / Opción | Función | Descripción |
| :--- | :--- | :--- |
| `find . -name "*.log"` | Buscar por nombre | Encuentra archivos que coincidan exactamente (respeta mayúsculas/minúsculas). |
| `find . -iname "*readme*"` | Ignorar mayúsculas | Busca por nombre sin distinguir entre mayúsculas y minúsculas. |
| `find . -type f` / `-type d` | Filtrar por tipo | `f` limita los resultados solo a archivos; `d` solo a directorios. |
| `grep -i "error" app.log` | Ignorar mayúsculas | Encuentra `Error`, `ERROR` o `error` indistintamente. |
| `grep -r "API_KEY" src/` | Búsqueda recursiva | Escanea dentro de todos los archivos y subcarpetas de una ruta. |
| `grep -n "port" config` | Número de línea | Muestra el número exacto de línea donde aparece cada coincidencia. |
| `grep -v "DEBUG" app.log` | Invertir búsqueda | Muestra todas las líneas que **NO** contienen el texto indicado (ideal para limpiar ruido). |

## 💻 Ejemplos en acción

### 1. Localizar archivos y directorios en el sistema con `find`

```bash
usuario@linux:~$ find /etc -maxdepth 2 -type f -name "*.conf" 2>/dev/null | head -n 5
/etc/sysctl.conf
/etc/rsyslog.conf
/etc/adduser.conf
/etc/nsswitch.conf
/etc/resolv.conf

usuario@linux:~$ find ~/ -iname "*linux*" -type d
/home/usuario/practica_linux
```

### 2. Filtrar errores con contexto y número de línea usando `grep`

```bash
usuario@linux:~$ grep -in "error" servidor.log
14: [2026-11-14 08:12:04] ERROR: No se pudo conectar a PostgreSQL en puerto 5432
48: [2026-11-14 08:15:19] error: Tiempo de espera agotado en /api/pagos
```

### 3. Buscar en todo un proyecto y excluir líneas informativas

```bash
usuario@linux:~$ grep -rn "TODO" ~/mi_proyecto/src/
src/server.ts:42: // TODO: validar límite de subida
src/utils/auth.ts:19: // TODO: cachear sesión activa

usuario@linux:~$ grep -v "INFO" servidor.log
[2026-11-14 08:12:04] ERROR: No se pudo conectar a PostgreSQL en puerto 5432
[2026-11-14 08:14:10] WARN: Uso de memoria al 84%
```

> ⚠️ **Cuidado con esto:** Cuando uses asteriscos o patrones en `find -name "*.txt"` o `grep "hola mundo"`, **envuelve siempre el patrón entre comillas**. Si no lo haces, el shell intentará expandir el `*` antes de pasárselo al comando y obtendrás resultados erróneos o errores de sintaxis.

> 💡 **Tip Pro:** Combina varias banderas de `grep` en una sola palabra: `grep -rnwi "token" ./src` busca de forma recursiva (`-r`), con número de línea (`-n`), palabra completa (`-w`) e ignorando mayúsculas (`-i`).

---

## ⚡ Mini-Reto de 3 minutos

1. Ejecuta `find ~ -type d -maxdepth 2` para listar todas las carpetas hasta dos niveles de profundidad dentro de tu directorio personal.
2. Busca en `/etc/passwd` las líneas que contengan tu nombre de usuario usando `grep -n "$USER" /etc/passwd`.
3. Prueba invertir la búsqueda con `grep -v "nologin" /etc/passwd` para ver únicamente las cuentas que tienen acceso a un shell interactivo.
4. Crea un archivo `notas.txt` con tres líneas (una con `ERROR`, otra con `info` y otra con `error crítico`) y comprueba la diferencia entre `grep "error" notas.txt` y `grep -in "error" notas.txt`.
$md_linux_6$, 5)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513770545', 'custom-1794510366770', 'Lección 7: Redirección y tuberías (Pipes)', '18 min lectura', $md_linux_7$
**⏱️ Tiempo estimado:** 18 min | **🎯 Objetivo:** Dominar los flujos estándar de entrada y salida de Linux, guardar resultados en archivos sin sobrescribir por accidente y encadenar múltiples comandos simples con `|` para resolver análisis complejos en una sola línea.

---

## Flujos estándar y la filosofía Unix

En Linux, cada programa que ejecutas maneja tres canales de comunicación estándar:

1. **Entrada estándar (`stdin` - descriptor 0):** De dónde recibe datos (por defecto, tu teclado).
2. **Salida estándar (`stdout` - descriptor 1):** Dónde envía resultados normales (por defecto, la pantalla).
3. **Error estándar (`stderr` - descriptor 2):** Dónde envía mensajes de fallo.

La magia real de Linux consiste en **desviar esa salida hacia un archivo** o **conectar la salida de un comando directamente a la entrada del siguiente** mediante una tubería (`|`). Así construyes flujos de procesamiento potentes sin escribir scripts largos.

## ⌨️ Comandos clave

Sintaxis base:

```bash
comando > archivo.txt
comando >> archivo.txt
comando1 | comando2 | comando3
```

| Operador / Comando | Función | Comportamiento exacto |
| :--- | :--- | :--- |
| `>` | Redirección (sobrescribir) | Crea el archivo si no existe, o **borra su contenido previo** y escribe la nueva salida. |
| `>>` | Redirección (añadir) | Conserva el contenido existente y **agrega la nueva salida al final** del archivo. |
| `2>` | Redirigir errores | Envía únicamente los mensajes de error (por ejemplo, `2>/dev/null` para silenciarlos). |
| `|` (*Pipe*) | Tubería | Toma el `stdout` del comando de la izquierda y lo entrega como `stdin` al de la derecha. |
| `sort` | Ordenar líneas | Ordena alfabéticamente (o numéricamente con `-n`) las líneas recibidas. |
| `wc -l` | Contar líneas | Cuenta cuántas líneas recibe en total (ideal al final de una tubería). |

## 💻 Ejemplos en acción

### 1. Guardar salidas en archivos (`>` vs `>>`)

```bash
usuario@linux:~$ echo "=== Reporte de archivos ===" > reporte.txt
usuario@linux:~$ ls -lh /var/log >> reporte.txt
usuario@linux:~$ cat reporte.txt
=== Reporte de archivos ===
total 1,2M
-rw-r----- 1 syslog adm   84K nov 14 10:25 auth.log
-rw-r--r-- 1 root   root 120K nov 14 10:20 dpkg.log
```

### 2. Encadenar `ls`, `grep`, `sort` y `wc -l` con tuberías

Imagina que quieres saber cuántos archivos de configuración `.conf` existen en `/etc` y ordenarlos alfabéticamente:

```bash
usuario@linux:~$ ls /etc | grep "\.conf$" | sort
adduser.conf
ca-certificates.conf
debconf.conf
deluser.conf
host.conf
...

usuario@linux:~$ ls /etc | grep "\.conf$" | wc -l
34
```

### 3. Analizar un archivo de texto filtrando y contando ocurrencias

```bash
usuario@linux:~$ cat accesos.log | grep "404" | sort | wc -l
12
```

> ⚠️ **Cuidado con esto:** Confundir `>` con `>>` es una de las fuentes más comunes de pérdida de datos en scripts. Si ya tienes un archivo `bitacora.txt` con meses de registros y ejecutas `date > bitacora.txt`, **sobrescribirás todo el archivo dejando únicamente la fecha de hoy**. Usa siempre `>>` cuando quieras acumular líneas.

> 💡 **Tip Pro:** Puedes añadir `| uniq` después de `sort` (`sort | uniq -c`) para eliminar duplicados y contar cuántas veces se repite exactamente cada línea en un archivo o log.

---

## ⚡ Mini-Reto de 3 minutos

1. Crea un archivo `sistema.txt` guardando en él la fecha actual con `date > sistema.txt`.
2. Añade al final del mismo archivo (sin borrar la fecha) tu nombre de usuario y directorio actual ejecutando `whoami >> sistema.txt` y `pwd >> sistema.txt`, luego verifica con `cat sistema.txt`.
3. Combina una tubería para listar todo el contenido de `/etc`, filtrar solo las entradas que contengan la palabra `ssh` (sin importar mayúsculas) y ordenarlas: `ls -a /etc | grep -i "ssh" | sort`.
4. Cuenta cuántas líneas tiene `/etc/passwd` usando `cat /etc/passwd | wc -l`.
$md_linux_7$, 6)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513796817', 'custom-1794510366770', 'Lección 8: Permisos y superusuario', '20 min lectura', $md_linux_8$
**⏱️ Tiempo estimado:** 20 min | **🎯 Objetivo:** Entender el modelo multiusuario de Linux, usar `sudo` con criterio de mínimo privilegio, interpretar las 10 posiciones de permisos en `ls -l` y modificar permisos o propietarios con `chmod` y `chown`.

---

## El modelo multiusuario y el usuario `root`

Linux nació pensado para que múltiples usuarios y servicios compartan una misma máquina sin pisarse entre sí. El administrador absoluto del sistema se llama **`root`** (superusuario) y tiene control total sobre cualquier archivo o proceso.

Por seguridad, nunca trabajas directamente como `root` todo el tiempo: utilizas tu cuenta normal y antepones **`sudo`** (*Superuser Do*) únicamente en el comando puntual que requiere privilegios administrativos (instalar paquetes, reiniciar servicios o editar `/etc`).

## Cómo leer los permisos en `ls -l`

Cuando ejecutas `ls -l`, la primera columna tiene 10 caracteres. Veamos cómo descifrar `-rwxr-xr--`:

- **Posición 1 (`-` o `d`):** Tipo de elemento (`-` archivo normal, `d` directorio, `l` enlace simbólico).
- **Posiciones 2-4 (`rwx`):** Permisos del **Propietario** (*User* / `u`) -> Lectura, escritura y ejecución.
- **Posiciones 5-7 (`r-x`):** Permisos del **Grupo** (*Group* / `g`) -> Lectura y ejecución (sin escritura).
- **Posiciones 8-10 (`r--`)**: Permisos de **Otros usuarios** (*Others* / `o`) -> Solo lectura.

### Equivalencia numérica (Modo Octal)

Cada permiso equivale a un valor que se suma por bloque (Propietario, Grupo, Otros):

- **`r` (Read / Lectura) = 4**
- **`w` (Write / Escritura) = 2**
- **`x` (Execute / Ejecución) = 1**
- **`-` (Sin permiso) = 0**

## ⌨️ Comandos clave

Sintaxis base:

```bash
sudo comando
chmod [modo] archivo
chown usuario:grupo archivo
```

| Modo / Comando | Significado | Uso habitual en producción |
| :--- | :--- | :--- |
| `chmod +x script.sh` | Modo simbólico | Añade permiso de ejecución a un script para poder lanzarlo con `./script.sh`. |
| `chmod 755 carpeta` | `rwxr-xr-x` | Estándar para **programas, scripts y directorios**: dueño controla todo; resto solo lee/ejecuta. |
| `chmod 644 archivo` | `rw-r--r--` | Estándar para **archivos normales** (HTML, texto, código): dueño edita; resto solo lee. |
| `chmod 600 clave.pem` | `rw-------` | **Máxima privacidad** (claves SSH, `.env`): solo el dueño lee y escribe; nadie más accede. |
| `chown user:grp doc` | Cambiar dueño | Asigna el archivo al usuario y grupo indicados (requiere `sudo`). |

## 💻 Ejemplos en acción

### 1. Hacer ejecutable un script en Bash

```bash
usuario@linux:~$ printf '#!/bin/bash\necho "Despliegue OK"\n' > deploy.sh
usuario@linux:~$ ./deploy.sh
bash: ./deploy.sh: Permiso denegado

usuario@linux:~$ chmod +x deploy.sh
usuario@linux:~$ ls -l deploy.sh
-rwxr-xr-x 1 usuario usuario 32 nov 14 10:30 deploy.sh

usuario@linux:~$ ./deploy.sh
Despliegue OK
```

### 2. Asegurar un archivo confidencial y cambiar propietario

```bash
usuario@linux:~$ touch secretos.env
usuario@linux:~$ chmod 600 secretos.env
usuario@linux:~$ ls -l secretos.env
-rw------- 1 usuario usuario 0 nov 14 10:32 secretos.env

usuario@linux:~$ sudo chown www-data:www-data /var/www/html/index.html
```

> ⚠️ **Cuidado con esto:** **Jamás uses `chmod 777`** para "arreglar" un problema de permisos en un servidor o proyecto. Dar lectura, escritura y ejecución a cualquier usuario del sistema (`rwxrwxrwx`) abre una brecha grave de seguridad y herramientas como SSH rechazarán directamente tus llaves privadas si tienen permisos demasiado abiertos.

> 💡 **Tip Pro:** Si necesitas cambiar el propietario de toda una carpeta de proyecto web junto con sus subarchivos, añade `-R` (recursivo): `sudo chown -R usuario:usuario /var/www/mi_app`.

---

## ⚡ Mini-Reto de 3 minutos

1. Crea un archivo vacío llamado `mi_script.sh` con `touch mi_script.sh` e inspecciona sus permisos iniciales con `ls -l mi_script.sh`.
2. Añádele permisos de ejecución usando modo simbólico (`chmod +x mi_script.sh`) y verifica con `ls -l` que apareció la `x`.
3. Cambia ahora los permisos a `600` con `chmod 600 mi_script.sh` (solo lectura y escritura para ti) y vuelve a comprobar con `ls -l`.
4. Ejecuta `sudo -v` o `sudo whoami` (si tu usuario tiene permisos `sudo`) para comprobar cómo eleva temporalmente tu identidad a `root`.
$md_linux_8$, 7)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513809985', 'custom-1794510366770', 'Lección 9: Gestión de software y monitoreo básico', '18 min lectura', $md_linux_9$
**⏱️ Tiempo estimado:** 18 min | **🎯 Objetivo:** Mantener actualizado e instalar software de forma segura con `apt` en Debian/Ubuntu, revisar la salud de disco y memoria RAM, y detectar o detener procesos bloqueados.

---

## Mantener un sistema sano y bajo control

En Linux no descargas instaladores aleatorios de internet: utilizas el **gestor de paquetes** oficial de tu distribución (en Ubuntu y Debian es **`apt`**), que verifica firmas criptográficas y resuelve dependencias automáticamente. Además, todo buen administrador sabe diagnosticar rápidamente por qué un servidor va lento revisando disco, RAM y CPU.

## ⌨️ Comandos clave

Sintaxis base:

```bash
sudo apt update && sudo apt upgrade
sudo apt install paquete
df -h
free -h
ps aux | grep nombre
kill PID
```

| Comando | Categoría | Qué hace exactamente |
| :--- | :--- | :--- |
| `sudo apt update` | Software | Descarga la lista más reciente de versiones disponibles desde los repositorios (no instala nada todavía). |
| `sudo apt upgrade` | Software | Actualiza los paquetes ya instalados a sus últimas versiones seguras. |
| `sudo apt install pkg` | Software | Instala un programa nuevo junto con todas sus librerías necesarias. |
| `sudo apt remove pkg` | Software | Desinstala el paquete (usa `purge` en lugar de `remove` si quieres borrar también su configuración). |
| `df -h` | Disco | Muestra el espacio total, usado y disponible de todas las particiones montadas en formato legible. |
| `free -h` | Memoria RAM | Muestra la memoria RAM total, usada, libre y caché disponible del sistema. |
| `ps aux` | Procesos | Fotografía instantánea de todos los procesos en ejecución con su usuario, `%CPU`, `%MEM` y `PID`. |
| `top` / `htop` | Monitor vivo | Panel interactivo en tiempo real de consumo de CPU y memoria (sal con `q`). |
| `kill PID` | Control | Envía señal de cierre ordenado al proceso con ese identificador (`kill -9 PID` lo fuerza). |

## 💻 Ejemplos en acción

### 1. Actualizar repositorios e instalar una herramienta útil (`htop` o `curl`)

```bash
usuario@linux:~$ sudo apt update
Obj:1 http://archive.ubuntu.com/ubuntu noble InRelease
Leyendo lista de paquetes... Hecho
Se pueden actualizar 14 paquetes.

usuario@linux:~$ sudo apt install -y curl htop
Leyendo lista de paquetes... Hecho
Instalando paquetes nuevos: curl htop
Configurando htop (3.3.0)...
```

### 2. Comprobar espacio en disco y memoria RAM

```bash
usuario@linux:~$ df -h
S.ficheros     Tamaño Usados  Disp Uso% Montado en
/dev/sda1         50G    18G   30G  38% /
tmpfs            3,9G   1,2M  3,9G   1% /dev/shm

usuario@linux:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:           7,8Gi       2,1Gi       3,4Gi       120Mi       2,3Gi       5,4Gi
Swap:          2,0Gi          0B       2,0Gi
```

### 3. Localizar un proceso concreto y detenerlo por su PID

```bash
usuario@linux:~$ ps aux | grep sleep
usuario    8421  0.0  0.0   5784  1024 pts/0    S    10:40   0:00 sleep 300
usuario    8429  0.0  0.0   6612  2304 pts/0    S+   10:40   0:00 grep --color=auto sleep

usuario@linux:~$ kill 8421
```

> ⚠️ **Cuidado con esto:** **Ejecuta siempre `sudo apt update` antes de instalar o actualizar software.** Si intentas instalar con listas desactualizadas, `apt` puede fallar con errores `404 Not Found`. Asimismo, reserva `kill -9` únicamente para procesos congelados que ignoran `kill` normal, ya que corta el programa de golpe sin dejarle guardar archivos abiertos.

> 💡 **Tip Pro:** En `free -h`, no te asustes si ves el campo `free` bajo: Linux aprovecha la RAM libre para caché de disco (`buff/cache`) y la libera al instante si una app la necesita. **El indicador real de RAM disponible es la columna `available`.**

---

## ⚡ Mini-Reto de 3 minutos

1. Revisa cuánto espacio libre queda en tu partición raíz `/` ejecutando `df -h`.
2. Comprueba cuánta memoria RAM tienes disponible en total usando `free -h`.
3. Lanza un proceso en segundo plano que duerma 120 segundos con `sleep 120 &`, encuéntralo usando `ps aux | grep sleep` y detén ese `PID` con `kill`.
4. Abre `top` (o `htop` si está instalado), observa durante unos segundos qué procesos consumen más CPU y sal con la tecla `q`.
$md_linux_9$, 8)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (id, course_id, title, duration, content, order_index)
VALUES ('lesson-1794513835473', 'custom-1794510366770', 'Lección 10: Red básica y Proyecto Final Integrador', '25 min lectura', $md_linux_10$
**⏱️ Tiempo estimado:** 25 min | **🎯 Objetivo:** Diagnosticar conectividad de red e interfaces IP desde la terminal, completar un Proyecto Final Integrador paso a paso aplicando todo el curso y llevarte tu hoja de referencia definitiva con los 30 comandos esenciales.

---

## Diagnóstico básico de red en Linux

Cuando una API no responde, un servidor no sale a internet o quieres comprobar qué IP tiene tu máquina, tres comandos resuelven la gran mayoría de diagnósticos de red sin necesidad de herramientas gráficas.

## ⌨️ Comandos clave

Sintaxis base:

```bash
ip a
ping -c 4 destino
curl -I https://dominio.com
```

| Comando | Función | Qué verifica exactamente |
| :--- | :--- | :--- |
| `ip a` | Interfaces de red | Lista tus tarjetas de red (`eth0`, `wlan0`, `lo`) y sus direcciones IPv4/IPv6 asignadas. |
| `ping -c 4 host` | Conectividad ICMP | Envía exactamente 4 paquetes de prueba y mide latencia y pérdida de paquetes (se detiene solo). |
| `curl -I url` | Cabeceras HTTP | Consulta una URL mostrando solo el código de estado (`200 OK`, `301`, `404`) y cabeceras del servidor. |

## 💻 Ejemplos en acción

```bash
usuario@linux:~$ ip a | grep "inet "
    inet 127.0.0.1/8 scope host lo
    inet 192.168.1.25/24 brd 192.168.1.255 scope global dynamic eth0

usuario@linux:~$ ping -c 4 1.1.1.1
PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.
64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=14.2 ms
--- 1.1.1.1 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms

usuario@linux:~$ curl -I https://example.com
HTTP/2 200
content-type: text/html; charset=UTF-8
```

*(Si ejecutas `curl -I`, recuerda que `-I` es i mayúscula para pedir solo las cabeceras HTTP.)*

> 💡 **Tip Pro:** Usar `ping -c 4` te ahorra tener que presionar `Ctrl + C` manualmente, algo fundamental cuando incluyes comprobaciones de conectividad dentro de scripts automáticos.

---

## 🏆 Proyecto Final Integrador (5 Pasos Guiados)

Pon a prueba todo lo aprendido en las 10 lecciones creando un pequeño sistema automatizado de auditoría en tu terminal. Ejecuta estos **5 pasos en orden**:

1. **Paso 1 — Estructura de carpetas:** En tu carpeta personal `~`, crea la estructura `mkdir -p ~/auditoria_linux/reportes ~/auditoria_linux/scripts` y entra a `~/auditoria_linux`.
2. **Paso 2 — Recolección de datos con redirección:** Guarda un inventario de sistema en `reportes/estado.txt` combinando `date > reportes/estado.txt`, `uname -a >> reportes/estado.txt` y `df -h >> reportes/estado.txt`.
3. **Paso 3 — Filtrado con `grep` y tuberías:** Crea un archivo `reportes/errores_simulados.log` con varias líneas (`INFO`, `WARN`, `ERROR`), filtra solo las líneas con `ERROR` ordenadas y guarda el conteo total en `reportes/resumen_errores.txt` usando pipes (`grep -i "error" reportes/errores_simulados.log | wc -l > reportes/resumen_errores.txt`).
4. **Paso 4 — Script ejecutable y permisos:** Crea `scripts/chequeo.sh` con un encabezado `#!/bin/bash` y un `echo "Auditoría completada"` más `ping -c 2 1.1.1.1`. Asígnale permisos seguros de ejecución con `chmod 750 scripts/chequeo.sh` y ejecútalo con `./scripts/chequeo.sh`.
5. **Paso 5 — Verificación y limpieza:** Verifica permisos y contenido con `ls -lh reportes scripts` y `cat reportes/resumen_errores.txt`. ¡Misión cumplida!

---

## 📋 Cheat Sheet: Los 30 Comandos Esenciales del Curso

| # | Comando | Función principal | Categoría |
| :--- | :--- | :--- | :--- |
| 1 | `whoami` | Muestra el usuario activo actual | Terminal |
| 2 | `uname -a` | Información del kernel y arquitectura | Terminal |
| 3 | `clear` | Limpia la pantalla de la terminal | Terminal |
| 4 | `history` | Lista comandos ejecutados previamente | Terminal |
| 5 | `man` / `--help` | Consulta manuales y ayuda de comandos | Terminal |
| 6 | `pwd` | Muestra la ruta del directorio actual | Navegación |
| 7 | `ls -la` | Lista archivos detallados incluyendo ocultos | Navegación |
| 8 | `cd` | Cambia entre carpetas (`..`, `~`, `-`) | Navegación |
| 9 | `mkdir -p` | Crea carpetas y rutas anidadas | Archivos |
| 10 | `touch` | Crea archivos vacíos o actualiza fechas | Archivos |
| 11 | `cp -rv` | Copia archivos o carpetas recursivamente | Archivos |
| 12 | `mv` | Mueve o renombra archivos y carpetas | Archivos |
| 13 | `rm -iv` | Elimina archivos pidiendo confirmación | Limpieza |
| 14 | `rmdir` | Elimina carpetas únicamente si están vacías | Limpieza |
| 15 | `rm -r` | Elimina directorios con contenido (¡precaución!) | Limpieza |
| 16 | `cat` | Muestra el contenido completo de un archivo | Lectura |
| 17 | `less` | Lee archivos largos por páginas (`/`, `q`) | Lectura |
| 18 | `head -n` | Muestra las primeras N líneas | Lectura |
| 19 | `tail -f` | Monitorea el final de un archivo en vivo | Lectura |
| 20 | `find` | Busca archivos y carpetas por criterios | Búsqueda |
| 21 | `grep -rn` | Busca texto dentro de archivos recursivamente | Búsqueda |
| 22 | `>` / `>>` | Redirige salida sobrescribiendo o añadiendo | Flujos |
| 23 | `|` (*Pipe*) | Conecta salida de un comando con la entrada de otro | Flujos |
| 24 | `sort` / `wc -l` | Ordena líneas y cuenta totales | Flujos |
| 25 | `sudo` | Ejecuta un comando como superusuario | Permisos |
| 26 | `chmod` | Cambia permisos (`+x`, `755`, `644`, `600`) | Permisos |
| 27 | `chown` | Cambia el usuario y grupo propietario | Permisos |
| 28 | `apt` | Actualiza, instala y elimina paquetes (Debian/Ubuntu) | Sistema |
| 29 | `df -h` / `free -h` | Revisa espacio en disco y memoria RAM | Monitoreo |
| 30 | `ps aux` / `kill` / `ip a` / `ping` / `curl` | Procesos activos y diagnóstico de red básico | Monitoreo y Red |

> ⚡ **¡Felicidades por completar el curso!** Ya cuentas con una base sólida para moverte con seguridad en cualquier servidor o terminal Linux. Sigue practicando los mini-retos en tu máquina local o en un contenedor de pruebas hasta que estos comandos salgan de memoria muscular.
$md_linux_10$, 9)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  content = EXCLUDED.content,
  order_index = EXCLUDED.order_index;
