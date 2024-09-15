# Usa una imagen oficial de Node.js como base
FROM node:16

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia los archivos de package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias de Node.js
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Exponer el puerto 3000
EXPOSE 3000

# Ejecuta el script de importación de datos y luego la aplicación
CMD ["bash", "-c", "node scripts/importCollections.js && npm start"]
