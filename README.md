# TFG (API LaLiga y Predicción de Partidos)

## Manual de Usuario:

Este proyecto permite desplegar una API que ofrece información sobre equipos, jugadores y partidos de la LaLiga en la temporada 2023-2024, así  como un servicio de predicción de resultados de los partidos utilizando un servicio de Machine Learning. El proyecto podrá desplegarse de forma local mediante un gestor de contenedores (Docker Desktop) o bien está disponible a través de AWS, usando infraestructuras Cloud. 

Para probar el servicio se puede usar plataformas como Postman o la consola del navegador.

## Despliegue en entorno local:

### Requisitos

Antes de comenzar, es imprescindible tener instalado:

1. [Docker Desktop](https://www.docker.com/products/docker-desktop) (para ejecutar y gestionar los contenedores).
2. [Git](https://git-scm.com/) (para clonar el repositorio). 

Se recomienda instalar Postman para interactuar con la API de forma cómoda (requiere registrarse y descargar la aplicación de escritorio si se quiere trabajar con una API local), aunque no es necesario:

- [Postman](https://www.postman.com/downloads)

### Pasos a seguir

Para poder ejecutar la API, se deberán seguir los siguientes pasos:
    
#### 1. Clonar el repositorio

Abrir una terminal y clonar el repositorio de GitHub en la máquina local:

    git clone https://github.com/juanpablozs/TFG.git

#### 2. Cambiar al directorio del proyecto:

    cd TFG/proyecto

#### 3. Construir y ejecutar los contenedores

Ejecutar los siguientes comandos en la terminal para iniciar los servicios con Docker:

    docker-compose build
    
    docker-compose up

Esto creará y ejecutará tres contenedores:
    - node_app: La API principal de Express.js.
    - ml_service: El servicio de predicción basado en Python.
    - mongodb: La base de datos MongoDB para almacenar datos de usuarios, partidos, jugadores y equipos.

#### 4. Importar datos a MongoDB

El contenedor node_app automáticamente ejecutará un script llamado "importCollections.js" que cargará los datos de equipos, jugadores y partidos desde los archivos JSON ubicados en node_app/data hacia la base de datos MongoDB.

## Probar el servicio:

### Opción 1: Usando Postman

1. Abrir Postman e importando rutas de prueba, como por ejemplo:

    Usuarios:
    - Registrar un usuario:
        - Método: POST
        - URL: http://localhost:3000/usuarios/registro
        - Cuerpo (JSON):
   
            ```json
        {
            "username": "juanpablozs",
            "email": "juanpablo.zuritasoto@usp.ceu.es",
            "password": "jp12345678",
            "role": "admin"
        }
         
            ```
        - Por defecto el rol es el de usuario pero es conveniente para usar el token de un usuario admin y ver todas las funcionalidades que proporciona el sistema.     

    Equipos:
    - Obtener todos los equipos:
        - Método GET

    