# Doctoralia Demo - Data Migration Project

## 📋 Overview

This project is a data migration pipeline that loads medical data (doctors, treatments, availability) from JSON files and generates fictional patient and appointment data, inserting everything into a PostgreSQL database using Prisma ORM.

The entire process is automated and can be executed with a single Docker Compose command.

## 🛠️ Tech Stack

- **Backend Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Containerization**: Docker & Docker Compose
- **Data Generation**: Faker.js

## 📁 Project Structure

```
doctoralia-demo/
├── data/                       # Dummy JSON data files
│   ├── doctors.json           # Doctors information
│   ├── treatments.json        # Treatments per doctor
│   └── availability.json      # Doctor availability schedules
├── prisma/
│   └── schema.prisma          # Prisma schema definition
├── src/
│   ├── database/              # Database service and module
│   │   ├── database.service.ts
│   │   └── database.module.ts
│   ├── migration/             # Migration logic
│   │   ├── interfaces/        # TypeScript interfaces
│   │   ├── services/          # Migration services
│   │   │   ├── data-loader.service.ts
│   │   │   ├── patient-generator.service.ts
│   │   │   ├── appointment-generator.service.ts
│   │   │   └── migration.service.ts
│   │   └── migration.module.ts
│   ├── app.module.ts
│   └── main.ts
├── schema.sql                 # PostgreSQL schema
├── docker-compose.yml         # Docker orchestration
├── Dockerfile                 # Application container
└── package.json

```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)

### Running with Docker Compose (Recommended)

1. **Clone the repository** (or navigate to the project directory)

2. **Start the entire stack**:
   ```bash
   docker-compose up --build
   ```

   This command will:
   - Start PostgreSQL database
   - Create the database schema from `schema.sql`
   - Build and start the NestJS application
   - Run the migration process automatically
   - Populate the database with all data

3. **Check the logs** to see the migration progress. You should see:
   - Doctors being inserted
   - Treatments being inserted
   - Availability slots being inserted
   - Patients being generated and inserted
   - Appointments being generated and inserted

4. **The application will continue running** on port 3000 after migration completes.

5. **To stop the services**:
   ```bash
   docker-compose down
   ```

6. **To completely reset** (remove volumes):
   ```bash
   docker-compose down -v
   ```

### Running Locally (Development)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start PostgreSQL** (you can use Docker):
   ```bash
   docker run -d \
     --name clinic_postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=clinic_db \
     -p 5432:5432 \
     postgres:16-alpine
   ```

3. **Apply the database schema**:
   ```bash
   docker exec -i clinic_postgres psql -U postgres -d clinic_db < schema.sql
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinic_db?schema=clinic"
   NODE_ENV=development
   PORT=3000
   ```

5. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

6. **Run the migration**:
   ```bash
   npm run migrate
   ```

## 📊 Database Schema

The database uses PostgreSQL with a custom `clinic` schema containing:

### Tables

- **doctors**: Medical professionals with their contact info, ratings, and reviews
- **treatments**: Medical services offered by doctors with pricing
- **doctor_availability**: Time slots when doctors are available
- **patients**: Fictional patient records
- **appointments**: Scheduled medical appointments linking doctors, patients, and treatments

### Enums

- **appointment_status**: `scheduled`, `completed`, `cancelled`
- **visit_modality**: `in_person`, `online`

## 🔍 Exploring the Data

### Using Prisma Studio

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can browse all the data.

### Using psql

Connect to the database:
```bash
docker exec -it clinic_db psql -U postgres -d clinic_db
```

Example queries:
```sql
-- Set schema
SET search_path TO clinic;

-- View all doctors
SELECT id, full_name, specialty, city, rating FROM doctors;

-- View appointments with details
SELECT 
  a.id,
  d.full_name as doctor,
  p.full_name as patient,
  t.name as treatment,
  a.start_at,
  a.status
FROM appointments a
JOIN doctors d ON a.doctor_id = d.id
JOIN patients p ON a.patient_id = p.id
JOIN treatments t ON a.treatment_id = t.id
LIMIT 10;

-- Statistics
SELECT 
  d.full_name,
  COUNT(a.id) as total_appointments
FROM doctors d
LEFT JOIN appointments a ON d.id = a.doctor_id
GROUP BY d.id, d.full_name
ORDER BY total_appointments DESC;
```

## 📝 Data Overview

### Dummy Data Included

- **20 Doctors** across 3 cities (Lima, Arequipa, Cusco)
- **Multiple specialties**: Cardiology, Pediatrics, Dermatology, Gynecology, etc.
- **80+ Treatments** with prices in PEN (Peruvian Soles)
- **100+ Availability slots** for in-person and online consultations
- **100 Generated patients** with realistic Peruvian data (DNI, phone, email)
- **300+ Appointments** distributed across doctors and patients

### Appointment Generation Logic

- Each appointment is linked to:
  - A real doctor from the JSON data
  - A treatment that the doctor offers
  - An availability slot that matches the doctor's schedule
  - A fictional patient
- Appointments are scheduled with realistic time slots (rounded to 15-minute intervals)
- Status distribution: 70% scheduled, 20% completed, 10% cancelled

## 🧪 Testing the Application

### Health Check

Once the application is running:
```bash
curl http://localhost:3000
```

### Verify Data

Check that all data was inserted:
```bash
docker exec clinic_db psql -U postgres -d clinic_db -c "SET search_path TO clinic; SELECT 'doctors' as table_name, COUNT(*) FROM doctors UNION ALL SELECT 'treatments', COUNT(*) FROM treatments UNION ALL SELECT 'patients', COUNT(*) FROM patients UNION ALL SELECT 'appointments', COUNT(*) FROM appointments;"
```

## 🔧 Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)
- `PORT`: Application port (default: 3000)

### Customization

To modify the data generation:

1. **Change patient count**: Edit `patientsToGenerate` in `migration.service.ts`
2. **Change appointments per doctor**: Edit `appointmentsPerDoctor` in `migration.service.ts`
3. **Modify dummy data**: Edit JSON files in the `data/` directory

## 📚 Scripts

- `npm run build`: Build the application
- `npm run start`: Start the application
- `npm run start:dev`: Start in watch mode
- `npm run start:prod`: Start in production mode
- `npm run prisma:generate`: Generate Prisma Client
- `npm run prisma:studio`: Open Prisma Studio
- `npm run migrate`: Build and run migration

## 🐛 Troubleshooting

### Database connection issues

```bash
# Check if PostgreSQL is running
docker ps | grep clinic_db

# Check database logs
docker logs clinic_db
```

### Migration fails

```bash
# Check application logs
docker logs clinic_app

# Restart with fresh data
docker-compose down -v
docker-compose up --build
```

### Port already in use

Change the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # For PostgreSQL
  - "3001:3000"  # For the app
```

## 📋 Requirements Checklist

- ✅ NestJS with TypeScript
- ✅ Prisma ORM for database access
- ✅ PostgreSQL database
- ✅ Docker & Docker Compose orchestration
- ✅ Automated data migration on startup
- ✅ Dummy data from JSON files
- ✅ Fictional patient generation
- ✅ Intelligent appointment generation
- ✅ Respects doctor availability constraints
- ✅ Links appointments to valid treatments
- ✅ Clean code with separation of concerns
- ✅ Comprehensive logging

## 🏗️ Architecture & Design Patterns

### Service Layer Pattern
The application uses a service-oriented architecture with clear separation of concerns:
- **DatabaseService**: Manages Prisma connection and cleanup
- **DataLoaderService**: Handles JSON file reading
- **PatientGeneratorService**: Generates fictional patient data
- **AppointmentGeneratorService**: Creates valid appointments
- **MigrationService**: Orchestrates the entire migration process

### Dependency Injection
NestJS's built-in DI container manages all service dependencies, making the code testable and maintainable.

### Repository Pattern
Prisma Client acts as a repository layer, providing type-safe database access.

## 👨‍💻 Development Notes

- The application automatically runs migration on startup
- Database is cleaned before each migration run
- All timestamps use timezone-aware dates (TIMESTAMPTZ)
- Prisma handles BigInt serialization for IDs
- Error handling includes logging and graceful failures

## 📄 License

UNLICENSED - For demonstration purposes only.

## 🤝 Contributing

This is a technical assessment project. For any questions or issues, please contact the development team.

---

**Built with ❤️ using NestJS, Prisma, and Docker**
