# API Endpoints - Doctoralia Demo

## 📋 Base URL

```
http://localhost:3000
```

## 🔧 Configuración

- **CORS**: Habilitado para todas las rutas
- **Content-Type**: `application/json`
- **Validación**: Automática con `class-validator`
- **Formato de fechas**: ISO 8601 (ej: `2025-11-26T10:00:00Z`)
- **Autenticación**: JWT Bearer Token (requerido para endpoints de admin)

## 📦 Estructura de Respuesta Estándar

Todas las respuestas de la API siguen una estructura estándar:

**Respuesta exitosa:**

```json
{
  "state": true,
  "status": 200,
  "message": "El proceso se completó satisfactoriamente.",
  "payload": {
    "state": true,
    "message": "Mensaje específico del endpoint.",
    "body": {
      "data": [] // Los datos reales van aquí
    }
  }
}
```

**Respuesta de error:**

```json
{
  "state": false,
  "status": 400,
  "message": "Mensaje de error.",
  "payload": {
    "state": false,
    "message": "Mensaje de error.",
    "body": {
      "data": null,
      "errors": [] // Errores de validación (opcional)
    }
  }
}
```

**Nota:** En todos los ejemplos de JavaScript, accede a los datos usando `response.payload.body.data`.

---

## 🔐 Autenticación

### Login (Admin)

**Endpoint:**

```
POST /auth/login
```

**Body (JSON):**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Inicio de sesión exitoso.",
  "payload": {
    "state": true,
    "message": "Inicio de sesión exitoso.",
    "body": {
      "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "username": "admin",
          "role": "admin"
        }
      }
    }
  }
}
```

**Códigos de estado:**

- `200 OK`: Login exitoso
- `401 Unauthorized`: Credenciales inválidas
- `400 Bad Request`: Datos inválidos

**Credenciales por defecto:**

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambiar estas credenciales en producción!

**Ejemplo en JavaScript:**

```javascript
async function login(username, password) {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Credenciales inválidas');
  }

  const responseData = await response.json();

  // Acceder a los datos desde la estructura estándar
  const data = responseData.payload.body.data;

  // Guardar token en localStorage o sessionStorage
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
}

// Uso
const loginData = await login('admin', 'admin123');
console.log('Token:', loginData.access_token);
```

### Usar Token en Peticiones Protegidas

Los endpoints protegidos requieren el token JWT en el header `Authorization`:

```javascript
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    // Token expirado o inválido
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    // Redirigir al login
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }

  return response;
}

// Ejemplo: Obtener calendario (requiere autenticación)
async function getCalendarAppointments(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetchWithAuth(
    `http://localhost:3000/appointments/calendar?${params}`,
  );
  const responseData = await response.json();
  return responseData.payload.body.data;
}
```

### Verificar si el Usuario Está Autenticado

```javascript
function isAuthenticated() {
  const token = localStorage.getItem('access_token');
  return !!token;
}

function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  // Redirigir al login
  window.location.href = '/login';
}
```

---

---

## 🔍 Búsqueda de Doctores

### 1. Buscar Doctores por Especialidad y/o Ciudad

**Endpoint:**

```
GET /doctors/search
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `specialty` | string | No | Especialidad médica (búsqueda parcial, case-insensitive) | `"Nutrición"`, `"Cardiología"` |
| `city` | string | No | Ciudad (búsqueda parcial, case-insensitive) | `"Arequipa"`, `"Lima"` |

**Ejemplos de uso:**

```javascript
// Buscar por especialidad y ciudad
GET /doctors/search?specialty=Nutrición&city=Arequipa

// Solo por especialidad
GET /doctors/search?specialty=Cardiología

// Solo por ciudad
GET /doctors/search?city=Lima

// Sin filtros (devuelve todos)
GET /doctors/search
```

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Búsqueda de doctores completada exitosamente.",
  "payload": {
    "state": true,
    "message": "Búsqueda de doctores completada exitosamente.",
    "body": {
      "data": [
        {
          "id": "11",
          "fullName": "Dra. Sofía Ramírez Luna",
          "specialty": "Nutrición",
          "city": "Arequipa",
          "address": "Calle San José 123, Yanahuara",
          "phoneCountryCode": "+51",
          "phoneNumber": "912345678",
          "rating": "4.7",
          "reviewCount": 128,
          "sourceProfileUrl": "https://s3-sa-east-1.amazonaws.com/doctoralia.pe/doctor/..."
        }
      ]
    }
  }
}
```

**Códigos de estado:**

- `200 OK`: Búsqueda exitosa
- `400 Bad Request`: Parámetros inválidos

**Ejemplo en JavaScript:**

```javascript
async function searchDoctors(specialty, city) {
  const params = new URLSearchParams();
  if (specialty) params.append('specialty', specialty);
  if (city) params.append('city', city);

  const response = await fetch(
    `http://localhost:3000/doctors/search?${params}`,
  );
  const responseData = await response.json();
  return responseData.payload.body.data;
}

// Uso
const doctors = await searchDoctors('Nutrición', 'Arequipa');
```

---

### 2. Obtener Lista de Especialidades Disponibles

**Endpoint:**

```
GET /doctors/specialties/list
```

**Query Parameters:** Ninguno

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Lista de especialidades obtenida correctamente.",
  "payload": {
    "state": true,
    "message": "Lista de especialidades obtenida correctamente.",
    "body": {
      "data": [
        "Cardiología",
        "Dermatología",
        "Ginecología",
        "Nutrición",
        "Pediatría",
        "Traumatología"
      ]
    }
  }
}
```

**Ejemplo en JavaScript:**

```javascript
async function getSpecialties() {
  const response = await fetch(
    'http://localhost:3000/doctors/specialties/list',
  );
  const responseData = await response.json();
  return responseData.payload.body.data;
}

// Uso para llenar un selector
const specialties = await getSpecialties();
// specialties.forEach(s => selectElement.add(new Option(s, s)));
```

---

### 3. Obtener Lista de Ciudades Disponibles

**Endpoint:**

```
GET /doctors/cities/list
```

**Query Parameters:** Ninguno

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Lista de ciudades obtenida correctamente.",
  "payload": {
    "state": true,
    "message": "Lista de ciudades obtenida correctamente.",
    "body": {
      "data": ["Arequipa", "Lima"]
    }
  }
}
```

**Ejemplo en JavaScript:**

```javascript
async function getCities() {
  const response = await fetch('http://localhost:3000/doctors/cities/list');
  const responseData = await response.json();
  return responseData.payload.body.data;
}
```

---

### 4. Obtener Detalles Completos de un Doctor

**Endpoint:**

```
GET /doctors/:id/details
```

**Path Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | number | Sí | ID del doctor |

**Ejemplo:**

```
GET /doctors/11/details
```

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Detalles del doctor obtenidos correctamente.",
  "payload": {
    "state": true,
    "message": "Detalles del doctor obtenidos correctamente.",
    "body": {
      "data": {
        "id": "11",
        "fullName": "Dra. Sofía Ramírez Luna",
        "specialty": "Nutrición",
        "city": "Arequipa",
        "address": "Calle San José 123, Yanahuara",
        "phoneCountryCode": "+51",
        "phoneNumber": "912345678",
        "rating": "4.7",
        "reviewCount": 128,
        "sourceProfileUrl": "https://...",
        "availability": [
          {
            "id": "1",
            "doctorId": "11",
            "startAt": "2025-11-26T09:00:00.000Z",
            "endAt": "2025-11-26T10:00:00.000Z",
            "modality": "in_person"
          },
          {
            "id": "2",
            "doctorId": "11",
            "startAt": "2025-11-26T14:00:00.000Z",
            "endAt": "2025-11-26T15:00:00.000Z",
            "modality": "online"
          }
        ],
        "treatments": [
          {
            "id": "45",
            "doctorId": "11",
            "name": "Consulta Nutricional",
            "price": "150.00",
            "currency": "PEN",
            "durationMinutes": 60
          },
          {
            "id": "46",
            "doctorId": "11",
            "name": "Plan Nutricional Personalizado",
            "price": "300.00",
            "currency": "PEN",
            "durationMinutes": 90
          }
        ]
      }
    }
  }
}
```

**Códigos de estado:**

- `200 OK`: Doctor encontrado
- `404 Not Found`: Doctor no existe

**Ejemplo en JavaScript:**

```javascript
async function getDoctorDetails(doctorId) {
  const response = await fetch(
    `http://localhost:3000/doctors/${doctorId}/details`,
  );
  if (!response.ok) {
    throw new Error('Doctor no encontrado');
  }
  const responseData = await response.json();
  return responseData.payload.body.data;
}
```

---

### 5. Obtener Disponibilidad de un Doctor

**Endpoint:**

```
GET /doctors/:id/availability
```

**Path Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | number | Sí | ID del doctor |

**Nota:** Solo devuelve horarios futuros, ordenados por fecha ascendente.

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Disponibilidad del doctor obtenida correctamente.",
  "payload": {
    "state": true,
    "message": "Disponibilidad del doctor obtenida correctamente.",
    "body": {
      "data": [
        {
          "id": "1",
          "doctorId": "11",
          "startAt": "2025-11-26T09:00:00.000Z",
          "endAt": "2025-11-26T10:00:00.000Z",
          "modality": "in_person"
        },
        {
          "id": "2",
          "doctorId": "11",
          "startAt": "2025-11-26T14:00:00.000Z",
          "endAt": "2025-11-26T15:00:00.000Z",
          "modality": "online"
        }
      ]
    }
  }
}
```

**Ejemplo en JavaScript:**

```javascript
async function getDoctorAvailability(doctorId) {
  const response = await fetch(
    `http://localhost:3000/doctors/${doctorId}/availability`,
  );
  const responseData = await response.json();
  return responseData.payload.body.data;
}
```

---

### 6. Obtener Tratamientos de un Doctor

**Endpoint:**

```
GET /doctors/:id/treatments
```

**Path Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | number | Sí | ID del doctor |

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Tratamientos del doctor obtenidos correctamente.",
  "payload": {
    "state": true,
    "message": "Tratamientos del doctor obtenidos correctamente.",
    "body": {
      "data": [
        {
          "id": "45",
          "doctorId": "11",
          "name": "Consulta Nutricional",
          "price": "150.00",
          "currency": "PEN",
          "durationMinutes": 60
        }
      ]
    }
  }
}
```

---

## 📅 Calendario de Citas (Admin) 🔒

> ⚠️ **Requiere Autenticación**: Todos los endpoints de `/appointments` requieren un token JWT válido.

### 1. Obtener Todas las Citas (con filtros opcionales) 🔒

**Endpoint:**

```
GET /appointments
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `doctorId` | number | No | ID del doctor | `1`, `11` |
| `startDate` | string (ISO 8601) | No | Fecha inicio del rango | `"2025-11-01T00:00:00Z"` |
| `endDate` | string (ISO 8601) | No | Fecha fin del rango | `"2025-11-30T23:59:59Z"` |

**Ejemplos de uso:**

```javascript
// Todas las citas
GET /appointments

// Citas de un doctor específico
GET /appointments?doctorId=11

// Citas en un rango de fechas
GET /appointments?startDate=2025-11-01T00:00:00Z&endDate=2025-11-30T23:59:59Z

// Citas de un doctor en un rango de fechas
GET /appointments?doctorId=11&startDate=2025-11-01T00:00:00Z&endDate=2025-11-30T23:59:59Z
```

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Información de citas obtenida correctamente.",
  "payload": {
    "state": true,
    "message": "Información de citas obtenida correctamente.",
    "body": {
      "data": [
        {
          "id": "1",
          "doctorId": "1",
          "patientId": "1",
          "treatmentId": "1",
          "startAt": "2025-11-26T10:00:00.000Z",
          "endAt": "2025-11-26T11:00:00.000Z",
          "status": "scheduled",
          "doctor": {
            "id": "1",
            "fullName": "Dr. Carlos Mendoza López",
            "specialty": "Cardiología"
          },
          "patient": {
            "id": "1",
            "fullName": "Juan Pérez"
          },
          "treatment": {
            "id": "1",
            "name": "Consulta Cardiológica"
          }
        }
      ]
    }
  }
}
```

**Ejemplo en JavaScript:**

```javascript
async function getAppointments(filters = {}) {
  const token = localStorage.getItem('access_token');
  const params = new URLSearchParams();
  if (filters.doctorId) params.append('doctorId', filters.doctorId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`http://localhost:3000/appointments?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error('No autenticado');
  }

  const responseData = await response.json();
  return responseData.payload.body.data;
}

// Uso
const appointments = await getAppointments({
  doctorId: 11,
  startDate: '2025-11-01T00:00:00Z',
  endDate: '2025-11-30T23:59:59Z',
});
```

---

### 2. Obtener Calendario Completo (para vista de calendario)

**Endpoint:**

```
GET /appointments/calendar
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `startDate` | string (ISO 8601) | No | Fecha inicio del rango | `"2025-11-01T00:00:00Z"` |
| `endDate` | string (ISO 8601) | No | Fecha fin del rango | `"2025-11-30T23:59:59Z"` |
| `doctorId` | number | No | Filtrar por doctor (opcional) | `11` |

**Nota:** Este endpoint devuelve información completa de doctor, paciente y tratamiento, ordenada por fecha y doctor. Ideal para vistas de calendario.

**Ejemplo:**

```
GET /appointments/calendar?startDate=2025-11-01T00:00:00Z&endDate=2025-11-30T23:59:59Z
```

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Calendario de citas obtenido correctamente.",
  "payload": {
    "state": true,
    "message": "Calendario de citas obtenido correctamente.",
    "body": {
      "data": [
        {
          "id": "1",
          "doctorId": "1",
          "patientId": "1",
          "treatmentId": "1",
          "startAt": "2025-11-26T10:00:00.000Z",
          "endAt": "2025-11-26T11:00:00.000Z",
          "status": "scheduled",
          "doctor": {
            "id": "1",
            "fullName": "Dr. Carlos Mendoza López",
            "specialty": "Cardiología",
            "city": "Lima"
          },
          "patient": {
            "id": "1",
            "fullName": "Juan Pérez",
            "email": "juan.perez@example.com",
            "phoneNumber": "987654321"
          },
          "treatment": {
            "id": "1",
            "name": "Consulta Cardiológica",
            "price": "200.00",
            "currency": "PEN"
          }
        }
      ]
    }
  }
}
```

**Ejemplo en JavaScript:**

```javascript
async function getCalendarAppointments(startDate, endDate, doctorId = null) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (doctorId) params.append('doctorId', doctorId);

  const response = await fetch(
    `http://localhost:3000/appointments/calendar?${params}`,
  );
  const responseData = await response.json();
  return responseData.payload.body.data;
}

// Obtener citas del mes actual
const now = new Date();
const startOfMonth = new Date(
  now.getFullYear(),
  now.getMonth(),
  1,
).toISOString();
const endOfMonth = new Date(
  now.getFullYear(),
  now.getMonth() + 1,
  0,
  23,
  59,
  59,
).toISOString();

const calendarAppointments = await getCalendarAppointments(
  startOfMonth,
  endOfMonth,
);
```

---

### 3. Obtener Citas de un Doctor Específico

**Endpoint:**

```
GET /appointments/doctor/:doctorId
```

**Path Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `doctorId` | number | Sí | ID del doctor |

**Ejemplo:**

```
GET /appointments/doctor/11
```

**Respuesta exitosa (200 OK):**

```json
{
  "state": true,
  "status": 200,
  "message": "Citas del doctor obtenidas correctamente.",
  "payload": {
    "state": true,
    "message": "Citas del doctor obtenidas correctamente.",
    "body": {
      "data": [
        {
          "id": "1",
          "doctorId": "11",
          "patientId": "1",
          "treatmentId": "45",
          "startAt": "2025-11-26T10:00:00.000Z",
          "endAt": "2025-11-26T11:00:00.000Z",
          "status": "scheduled",
          "patient": {
            "id": "1",
            "fullName": "Juan Pérez",
            "email": "juan.perez@example.com",
            "phoneNumber": "987654321"
          },
          "treatment": {
            "id": "45",
            "name": "Consulta Nutricional",
            "price": "150.00",
            "currency": "PEN",
            "durationMinutes": 60
          }
        }
      ]
    }
  }
}
```

**Ejemplo en JavaScript:**

```javascript
async function getDoctorAppointments(doctorId) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(
    `http://localhost:3000/appointments/doctor/${doctorId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status === 401) {
    throw new Error('No autenticado');
  }

  const responseData = await response.json();
  return responseData.payload.body.data;
}
```

---

## 🎯 Flujo Completo de Búsqueda (Frontend)

### Paso 1: Cargar Selectores

```javascript
// Al cargar la página, obtener opciones para los selectores
async function loadSearchFilters() {
  const [specialtiesRes, citiesRes] = await Promise.all([
    fetch('http://localhost:3000/doctors/specialties/list').then((r) =>
      r.json(),
    ),
    fetch('http://localhost:3000/doctors/cities/list').then((r) => r.json()),
  ]);

  // Extraer datos de la estructura estándar
  const specialties = specialtiesRes.payload.body.data;
  const cities = citiesRes.payload.body.data;

  // Llenar selectores
  populateSelect('specialty-select', specialties);
  populateSelect('city-select', cities);
}
```

### Paso 2: Buscar Doctores

```javascript
// Cuando el usuario hace clic en "Buscar"
async function searchDoctors() {
  const specialty = document.getElementById('specialty-select').value;
  const city = document.getElementById('city-select').value;

  const params = new URLSearchParams();
  if (specialty) params.append('specialty', specialty);
  if (city) params.append('city', city);

  const response = await fetch(
    `http://localhost:3000/doctors/search?${params}`,
  );
  const responseData = await response.json();
  const doctors = responseData.payload.body.data;

  // Mostrar resultados
  displayDoctors(doctors);
}
```

### Paso 3: Ver Detalles del Doctor

```javascript
// Cuando el usuario hace clic en un doctor
async function showDoctorDetails(doctorId) {
  const response = await fetch(
    `http://localhost:3000/doctors/${doctorId}/details`,
  );
  const responseData = await response.json();
  const doctor = responseData.payload.body.data;

  // Mostrar información completa con horarios y tratamientos
  displayDoctorDetails(doctor);
}
```

---

## 📊 Calendario Admin - Flujo Completo

### Cargar Calendario del Mes (Requiere Login)

```javascript
async function loadCalendarMonth(year, month) {
  // Verificar autenticación
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  const token = localStorage.getItem('access_token');
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const response = await fetch(
    `http://localhost:3000/appointments/calendar?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status === 401) {
    logout();
    throw new Error('Sesión expirada');
  }

  const responseData = await response.json();
  const appointments = responseData.payload.body.data;

  // Renderizar en el calendario
  renderCalendar(appointments);
}
```

---

## ⚠️ Manejo de Errores

### Códigos de Estado HTTP

| Código                      | Significado           | Acción Recomendada                |
| --------------------------- | --------------------- | --------------------------------- |
| `200 OK`                    | Petición exitosa      | Procesar respuesta                |
| `400 Bad Request`           | Parámetros inválidos  | Validar parámetros enviados       |
| `404 Not Found`             | Recurso no encontrado | Mostrar mensaje al usuario        |
| `500 Internal Server Error` | Error del servidor    | Mostrar mensaje de error genérico |

### Ejemplo de Manejo de Errores

```javascript
async function fetchWithErrorHandling(url) {
  try {
    const response = await fetch(url);
    const responseData = await response.json();

    // Verificar el estado de la respuesta
    if (!responseData.state) {
      // Error de la API
      const errorMessage = responseData.message;
      const errors = responseData.payload?.body?.errors || [];

      throw new Error(
        errorMessage + (errors.length > 0 ? `: ${errors.join(', ')}` : ''),
      );
    }

    // Retornar los datos
    return responseData.payload.body.data;
  } catch (error) {
    console.error('Error en la petición:', error);
    // Mostrar mensaje al usuario
    showErrorMessage(error.message);
    throw error;
  }
}
```

### Ejemplo de Respuesta de Error

**Error 400 (Validación):**

```json
{
  "state": false,
  "status": 400,
  "message": "Error de validación.",
  "payload": {
    "state": false,
    "message": "Error de validación.",
    "body": {
      "data": null,
      "errors": [
        "username must be a string",
        "password must be longer than or equal to 6 characters"
      ]
    }
  }
}
```

**Error 401 (No autorizado):**

```json
{
  "state": false,
  "status": 401,
  "message": "No autorizado. Credenciales inválidas o token expirado.",
  "payload": {
    "state": false,
    "message": "No autorizado. Credenciales inválidas o token expirado.",
    "body": {
      "data": null
    }
  }
}
```

**Error 404 (No encontrado):**

```json
{
  "state": false,
  "status": 404,
  "message": "Recurso no encontrado.",
  "payload": {
    "state": false,
    "message": "Recurso no encontrado.",
    "body": {
      "data": null
    }
  }
}
```

---

## 📝 Notas Importantes

### Estructura de Respuesta

- **Todas las respuestas** siguen la estructura estándar con `state`, `status`, `message` y `payload`
- **Los datos reales** siempre están en `payload.body.data`
- **En caso de error**, `payload.body.data` será `null` y puede incluir `errors` con detalles

### Tipos de Datos

- **IDs**: Se devuelven como strings (BigInt serializado)
- **Fechas**: Formato ISO 8601 (ej: `2025-11-26T10:00:00.000Z`)
- **Decimales**: Se devuelven como strings (ej: `"4.7"`, `"150.00"`)

### Búsqueda

- La búsqueda de `specialty` y `city` es **case-insensitive** y **parcial**
- Ejemplo: `specialty=nutri` encontrará "Nutrición"

### Disponibilidad

- El endpoint `/doctors/:id/availability` solo devuelve horarios **futuros**
- Los horarios están ordenados por fecha ascendente

### Ordenamiento

- Doctores: Ordenados por rating (descendente)
- Citas: Ordenadas por fecha (ascendente)
- Tratamientos: Ordenados alfabéticamente

---

## 🔗 Endpoints Resumen

| Método | Endpoint                         | Descripción                   | Autenticación |
| ------ | -------------------------------- | ----------------------------- | ------------- |
| `POST` | `/auth/login`                    | Login de admin                | ❌ Público    |
| `GET`  | `/doctors/search`                | Buscar doctores               | ❌ Público    |
| `GET`  | `/doctors/specialties/list`      | Lista de especialidades       | ❌ Público    |
| `GET`  | `/doctors/cities/list`           | Lista de ciudades             | ❌ Público    |
| `GET`  | `/doctors/:id`                   | Obtener doctor por ID         | ❌ Público    |
| `GET`  | `/doctors/:id/details`           | Detalles completos del doctor | ❌ Público    |
| `GET`  | `/doctors/:id/availability`      | Disponibilidad del doctor     | ❌ Público    |
| `GET`  | `/doctors/:id/treatments`        | Tratamientos del doctor       | ❌ Público    |
| `GET`  | `/appointments`                  | Listar citas (con filtros)    | ✅ Requerido  |
| `GET`  | `/appointments/calendar`         | Calendario completo           | ✅ Requerido  |
| `GET`  | `/appointments/doctor/:doctorId` | Citas de un doctor            | ✅ Requerido  |

---

---

## 🔄 Migración de Código Existente

Si tienes código que usa la API anterior, actualiza el acceso a los datos:

**Antes:**

```javascript
const response = await fetch(url);
const data = await response.json();
// data es directamente el array u objeto
```

**Ahora:**

```javascript
const response = await fetch(url);
const responseData = await response.json();
const data = responseData.payload.body.data;
// data contiene los datos reales
```

**Última actualización:** Diciembre 2024
