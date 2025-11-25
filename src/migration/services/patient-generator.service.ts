import { Injectable, Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';

export interface GeneratedPatient {
  fullName: string;
  documentNumber: string;
  phoneNumber: string;
  email: string;
}

@Injectable()
export class PatientGeneratorService {
  private readonly logger = new Logger(PatientGeneratorService.name);

  generatePatients(count: number): GeneratedPatient[] {
    this.logger.log(`Generating ${count} fictional patients...`);
    
    const patients: GeneratedPatient[] = [];
    
    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;
      
      patients.push({
        fullName,
        documentNumber: this.generateDocumentNumber(),
        phoneNumber: this.generatePhoneNumber(),
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      });
    }
    
    this.logger.log(`Generated ${patients.length} patients`);
    return patients;
  }

  private generateDocumentNumber(): string {
    // Generate a Peruvian DNI (8 digits)
    return faker.string.numeric(8);
  }

  private generatePhoneNumber(): string {
    // Generate a Peruvian mobile phone number (9 digits starting with 9)
    return '9' + faker.string.numeric(8);
  }
}


