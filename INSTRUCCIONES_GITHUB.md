# Cómo subir tu proyecto a GitHub

Sigue estos pasos para subir tu código a un repositorio de GitHub. Deberás tener [Git](https://git-scm.com/downloads) instalado en tu computadora.

## Paso 1: Inicializar un repositorio Git local

Abre una terminal o línea de comandos en la carpeta raíz de tu proyecto y ejecuta el siguiente comando. Esto creará un nuevo repositorio Git en tu proyecto.

```sh
git init -b main
```

## Paso 2: Añadir todos los archivos al repositorio

Ahora, añade todos los archivos de tu proyecto al área de preparación (staging) de Git.

```sh
git add .
```

## Paso 3: Crear tu primer commit

Un "commit" es como una instantánea de tu código en un momento determinado. Guarda tus cambios con un mensaje descriptivo.

```sh
git commit -m "Primer commit del proyecto"
```

## Paso 4: Crear un nuevo repositorio en GitHub

1.  Ve a [GitHub](https://github.com) e inicia sesión.
2.  Haz clic en el icono **+** en la esquina superior derecha y selecciona **New repository**.
3.  Dale un nombre a tu repositorio (por ejemplo, `smart-expense-ai`).
4.  Puedes dejarlo como "Public" (Público) o "Private" (Privado).
5.  **Importante**: No selecciones "Add a README file", "Add .gitignore" o "Choose a license", porque tu proyecto ya tiene estos archivos.
6.  Haz clic en **Create repository**.

## Paso 5: Conectar tu repositorio local con GitHub

En la página de tu nuevo repositorio en GitHub, verás una sección titulada **"…or push an existing repository from the command line"**. Copia y ejecuta los dos comandos que aparecen ahí. Serán similares a estos:

```sh
git remote add origin https://github.com/TU_USUARIO/NOMBRE_DEL_REPO.git
git push -u origin main
```

- **Recuerda reemplazar `TU_USUARIO` y `NOMBRE_DEL_REPO`** con tu nombre de usuario de GitHub y el nombre que le diste a tu repositorio.

¡Y eso es todo! Tu proyecto estará ahora en GitHub. Para futuros cambios, solo necesitarás ejecutar `git add .`, `git commit -m "mensaje"` y `git push`.
