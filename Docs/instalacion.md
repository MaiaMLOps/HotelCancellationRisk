# Manual de Instalación: Tablero de Predicción

## 1. Introducción

Este documento explica cómo instalar y preparar el tablero de predicción en su computadora. Usted necesita instalar un programa principal (backend) y un programa visual (frontend).

## 2. Requisitos Previos

Asegúrese de tener estos programas en su computadora:
*   **Python**: Versión 3.11 o más nueva.
*   **Node.js**: Versión 18 o más nueva.
*   **Git**: Para descargar el código.

## 3. Descargar el Código

1. Abra la consola de comandos de su computadora (Terminal o Símbolo del sistema).
2. Escriba este comando para descargar el código:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    ```
    *(Nota: Reemplace `<URL_DEL_REPOSITORIO>` con la dirección real del proyecto).*
3. Escriba este comando para entrar a la carpeta del proyecto:
    ```bash
    cd HotelCancellationRisk
    ```
4. Pulse la tecla **Enter**.

## 4. Instalar el Programa Principal (Backend)

El programa principal hace los cálculos de predicción.

1. Asegúrese de estar en la carpeta principal `HotelCancellationRisk`.
2. Escriba este comando para instalar las herramientas necesarias:
    ```bash
    pip install -r requirements/serve.txt
    ```
3. Pulse **Enter**.
4. Escriba este comando para iniciar el programa principal:
    ```bash
    uvicorn src.api:app --host 0.0.0.0 --port 8000
    ```
5. Pulse **Enter**.
6. Deje esta ventana de comandos abierta.

*(Alternativa: Usted también puede usar Docker. Escriba `docker build -t api-hotel .` y luego `docker run -p 8000:8000 api-hotel` para iniciar el servicio).*

## 5. Instalar el Programa Visual (Frontend)

El programa visual muestra el tablero en su pantalla.

1. Abra una nueva ventana de comandos.
2. Escriba este comando para ir a la carpeta del frontend:
    ```bash
    cd frontend
    ```
3. Pulse **Enter**.
4. Escriba este comando para instalar las herramientas necesarias:
    ```bash
    npm install
    ```
5. Pulse **Enter** y espere a que termine la instalación.
6. Escriba este comando para iniciar el programa visual:
    ```bash
    npm run dev
    ```
7. Pulse **Enter**.

## 6. Usar el Tablero

1. Lea el mensaje final en la ventana de comandos del frontend.
2. Copie la dirección web local que aparece (por ejemplo, `http://localhost:5173`).
3. Abra su navegador de internet.
4. Pegue la dirección web en la barra de direcciones.
5. Pulse **Enter**.

El tablero de predicción está ahora listo para usar.
