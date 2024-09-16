# TFG (API LaLiga y Predicción de Partidos)

## Manual de Usuario:

Este proyecto permite desplegar una API que ofrece información sobre equipos, jugadores y partidos de la LaLiga en la temporada 2023-2024, así  como un servicio de predicción de resultados de los partidos utilizando un servicio de Machine Learning. El proyecto podrá desplegarse de forma local mediante un gestor de contenedores (Docker Desktop), para mayor facilidad del tribunal, o bien está disponible a través de AWS, usando infraestructuras Cloud, que es lo que se ha indicado en la memoria del trabajo y como se mostrará en la defensa. El código de la rama "cloud" no varía salvo el archivo node_app/.env, que es distinto, de acorde a su modo de despliegue.

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

- **node_app**: La API principal de Express.js.
- **ml_service**: El servicio de predicción basado en Python.
- **mongodb**: La base de datos MongoDB para almacenar datos de usuarios, partidos, jugadores y equipos.


#### 4. Importar datos a MongoDB

El contenedor node_app automáticamente ejecutará un script llamado "importCollections.js" que cargará los datos de equipos, jugadores y partidos desde los archivos JSON ubicados en node_app/data hacia la base de datos MongoDB.

## Probar el servicio:

### Opción 1: Usando Postman

1. Abrir Postman e importando rutas de prueba. Estos son algunos de los ejemplos que se pueden llevar a cabo:

- Usuarios:
    - **Registrar un usuario**:
        - **Método**: `POST`
        - **URL**: `http://localhost:3000/usuarios/registro`
        - **Cuerpo (JSON)**:

        ```json
        {
            "username": "juanpablozs",
            "email": "juanpablo.zuritasoto@usp.ceu.es",
            "password": "jp12345678",
            "role": "admin"
        }
        ```

        - Por defecto, el rol es el de usuario, pero es conveniente usar el token de un usuario admin para ver todas las funcionalidades que proporciona el sistema.     

    - **Iniciar sesión**:
        - **Método**: `POST`
        - **URL**: `http://localhost:3000/usuarios/login`
        - **Cuerpo (JSON)**:

        ```json
        {
            "email": "juanpablo.zuritasoto@usp.ceu.es",
            "password": "jp12345678",
        }
        ```
        - Copiar el token proporcionado para usarlo más adelante en distintas funcionalidades

- Equipos:
    - **Obtener todos los equipos**:
        - **Método**: `GET`
        - **URL**: `http://localhost:3000/equipos`
    
    - **Obtener equipo por ID**:
        - **Método**: `GET`
        - **URL**: `http://localhost:3000/equipos/{_id}`
        - Obtener el campo _id que proporciona MongoDB de cada objeto para buscarlo
    
- Predicciones:

    - **Hacer una predicción en base a estadísticas**:
        - **Método**: `POST`
        - **URL**: `http://localhost:3000/predicciones`
        - **Authorization**: (Type: Bearer Token): "introducir el token del login"
        - **Cuerpo (JSON)**:

        ```json
        {
            "features": {
                "home_shotsOnGoal": 10,
                "home_shotsOffGoal": 8,
                "home_totalShots": 18,
                "home_blockedShots": 4,
                "home_shotsInsideBox": 12,
                "home_shotsOutsideBox": 6,
                "home_cornerKicks": 7,
                "home_goalkeeperSaves": 5,
                "home_totalPasses": 500,
                "home_accuratePasses": 450,
                "home_expectedGoals": 2.5,
                "away_shotsOnGoal": 2,
                "away_shotsOffGoal": 3,
                "away_totalShots": 5,
                "away_blockedShots": 1,
                "away_shotsInsideBox": 3,
                "away_shotsOutsideBox": 2,
                "away_cornerKicks": 2,
                "away_goalkeeperSaves": 4,
                "away_totalPasses": 300,
                "away_accuratePasses": 250,
                "away_expectedGoals": 0.8
            }
        }
        ```
        - Este cuerpo ha de tener siempre el mismo formato para realizar las predicciones

Se pueden experimentar más rutas y operaciones CRUD sobre las mismas dependiendo del tipo de usuario que las realice (anónimo, registrado o administrador).

2. Enviar las solicitudes y observar las respuestas proporcionadas.

### Opción 2: Usando la consola del navegador

Si se opta por usar la consola del navegador, se pueden hacer las solicitudes con fetch de la siguiente manera:

1. Abrir herramientas de desarrollo del navegador(F12 o Ctrl+Shift+I) y seleccionar la pestaña "Consola"

2. Realizar solicitudes con operaciones CRUD usando fetch. Aquí se encuentran algunos ejemplos:

- Registrar un usuario:

```javascript
fetch('http://localhost:3000/usuarios/registro', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'juanpablo',
    email: 'juanpablo.zuritasoto@usp.ceu.es',
    password: 'jp12345678'.
    role: 'admin'
  })
})
  .then(response => response.json())
  .then(data => console.log('Registro exitoso:', data))
  .catch(error => console.error('Error en el registro:', error));
```

- Iniciar sesión:

```javascript
fetch('http://localhost:3000/usuarios/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'juanpablo.zuritasoto@usp.ceu.es',
    password: 'jp12345678'
  })
})
  .then(response => response.json())
  .then(data => {
    console.log('Login exitoso:', data);
    const token = data.token;
    console.log('Token:', token);
  })
  .catch(error => console.error('Error en el login:', error));
```
Este código enviará la solicitud de inicio de sesión al servidor y se devolverá un token de autenticación, que se podrá utilizar en las solicitudes posteriores (como la predicción o acceder a rutas protegidas).


- Predicción:

```javascript
const token = 'token_propocionado';

fetch('http://localhost:3000/predicciones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    features: {
      home_shotsOnGoal: 10,
      home_shotsOffGoal: 8,
      home_totalShots: 18,
      home_blockedShots: 4,
      home_shotsInsideBox: 12,
      home_shotsOutsideBox: 6,
      home_cornerKicks: 7,
      home_goalkeeperSaves: 5,
      home_totalPasses: 500,
      home_accuratePasses: 450,
      home_expectedGoals: 2.5,
      away_shotsOnGoal: 2,
      away_shotsOffGoal: 3,
      away_totalShots: 5,
      away_blockedShots: 1,
      away_shotsInsideBox: 3,
      away_shotsOutsideBox: 2,
      away_cornerKicks: 2,
      away_goalkeeperSaves: 4,
      away_totalPasses: 300,
      away_accuratePasses: 250,
      away_expectedGoals: 0.8
    }
  })
})
  .then(response => response.json())
  .then(data => console.log('Predicción:', data))
  .catch(error => console.error('Error en la predicción:', error));

```


## Solución de Problemas

### Contenedor no se incia
Si el contenedor no se iniciar correctamente, ejecutar los siguientes comandos para revisar los logs:

- docker-compose logs

### Verificar estado de los contenedores
Para asegurarse que todos los contenedores están en ejecución:
- docker ps

### Detener todos los contenedores
Para detener todos los contenedores:
- docker-compose down
    