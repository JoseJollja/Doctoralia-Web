export interface DoctorData {
  fullName: string;
  specialty: string;
  city: string;
  address?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  rating?: number;
  reviewCount?: number;
  sourceProfileUrl: string;
}

export interface TreatmentData {
  name: string;
  price?: string;
  currency?: string;
  durationMinutes?: number;
}

export interface DoctorTreatmentsData {
  doctorIndex: number;
  treatments: TreatmentData[];
}

export interface AvailabilitySlotData {
  startAt: string;
  endAt: string;
  modality: 'in_person' | 'online';
}

export interface DoctorAvailabilityData {
  doctorIndex: number;
  availabilitySlots: AvailabilitySlotData[];
}
