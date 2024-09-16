# Usa una imagen oficial de Python como base
FROM python:3.9

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia los archivos requeridos en el contenedor
COPY requirements.txt ./

# Instala las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto de la aplicación en el contenedor
COPY . .

# Exponer el puerto 5000
EXPOSE 5000

# Comando para correr el servicio
CMD ["python", "ml_service.py"]
