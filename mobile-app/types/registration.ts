export type UserRole = 'farmer' | 'trader' | 'transporter';

export interface StartRegistrationData {
    registrationId: string;
    currentStep: number;
    expiresAt: string; // ISO
}

export interface RegistrationStatusData {
    registrationId: string;
    currentStep: number;
    roleName?: UserRole | null;
    isCompleted?: boolean;
    expired?: boolean;
    expiresAt?: string;
    accountFilled?: boolean;
    otpVerified?: boolean;
    roleSelected?: boolean;
    documentsUploaded?: boolean;
    payoutSet?: boolean;
}

export interface Step1AccountDto {
    registrationId: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
}

export interface SendOtpResponse {
    otpSent?: boolean;
    devOtp?: string; // for dev/testing
}

export interface VerifyOtpDto {
    registrationId: string;
    otp: string;
}

export interface VerifyOtpResponse {
    verified: boolean;
    nextStep?: number;
}

export interface RoleSaveResponse {
    saved: boolean;
    nextStep: number;
}

export interface StepSavedResponse {
    saved: boolean;
    nextStep: number;
}

export interface SetRoleDto {
    registrationId: string;
    roleName: UserRole;
}

// Farmer details payload (subset; extend as needed)
export interface FarmerDetailsDto {
    registrationId: string;
    nationality: string;
    birthDate: string | Date;
    birthPlace: string;
    province: string;
    district: string;
    farmAddress: string;
    locationLat: number;
    locationLng: number;
    storageAvailable: boolean;
    coldStorageCapacityKg: number;
    landOwnership: string;
    packagingMethods: string[];
}

export interface TraderDetailsDto {
    registrationId: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    activity: string;
    taxNumber: string;
    licenseNumber: string;
    canBuy: boolean;
    canImport: boolean;
    canExport: boolean;
}

export interface TransporterDetailsDto {
    registrationId: string;
    accountType: string;
    fleetCapacity: number;
    coverageAreaText: string;
}


// Step 5: Payouts
export interface AddPayoutAccountDto {
    registrationId: string;
    type: number;
    providerName: string;
    accountNumber: string;
    iban: string;
    isDefault: boolean;
}

export interface PayoutAccount {
    id: number;
    type: number;
    providerName: string;
    accountNumber: string;
    iban: string;
    isDefault: boolean;
}


