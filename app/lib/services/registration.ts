import { clearRegistrationId, getRegistrationId, saveRegistrationId } from '../storage/registration-storage';
import type {
    AddPayoutAccountDto,
    FarmerDetailsDto,
    PayoutAccount,
    RegistrationStatusData,
    RoleSaveResponse,
    SendOtpResponse,
    SetRoleDto,
    StartRegistrationData,
    Step1AccountDto,
    StepSavedResponse,
    TraderDetailsDto,
    TransporterDetailsDto,
    VerifyOtpDto,
    VerifyOtpResponse,
} from '../types/registration';
import type { ApiResponse } from '../utils/http';
import { http } from '../utils/http';

// Starts a new registration session and persists the registrationId
export async function startRegistration(): Promise<ApiResponse<StartRegistrationData>> {
    const res = await http.post<StartRegistrationData>('/api/registration/start', undefined, {
        headers: { Accept: 'text/plain' },
    });
    if (res?.success && res?.data?.registrationId) {
        await saveRegistrationId(res.data.registrationId);
    }
    return res;
}

// Fetches current registration status by id (uses stored id if omitted)
export async function getRegistrationStatus(registrationId?: string): Promise<ApiResponse<RegistrationStatusData>> {
    const id = registrationId || (await getRegistrationId());
    if (!id) {
        throw new Error('No registrationId available');
    }
    return http.get<RegistrationStatusData>(`/api/registration/${id}`, {
        headers: { Accept: 'text/plain' },
    });
}

// Step 1: account details
export async function step1Account(dto: Step1AccountDto) {
    try {
        return await http.post<SendOtpResponse>('/api/registration/step/1', dto, {
            headers: { Accept: 'text/plain' },
        });
    } catch (e: any) {
        const detail: string | undefined = e?.detail || e?.response?.error?.detail;
        const code: string | undefined = e?.code || e?.response?.error?.code;
        const isExpired =
            (code === 'invalid_operation' || e?.status === 400) &&
            typeof detail === 'string' && /session expired/i.test(detail);

        if (isExpired) {
            // Clear and silently start a new session, then retry once
            await clearRegistrationId();
            const start = await startRegistration();
            const newId = start.data.registrationId;
            const retryDto: Step1AccountDto = { ...dto, registrationId: newId };
            return await http.post<SendOtpResponse>('/api/registration/step/1', retryDto, {
                headers: { Accept: 'text/plain' },
            });
        }

        throw e;
    }
}

// Step 2: verify OTP
export function verifyOtp(dto: VerifyOtpDto) {
    return http.post<VerifyOtpResponse>('/api/registration/verify-otp', dto, {
        headers: { Accept: 'text/plain' },
    });
}

// Step 2b: set role name
export async function setRoleName(dto: SetRoleDto) {
    try {
        return await http.post<RoleSaveResponse>('/api/registration/step/2', dto, {
            headers: { Accept: 'text/plain' },
        });
    } catch (e: any) {
        const detail: string | undefined = e?.detail || e?.response?.error?.detail;
        const code: string | undefined = e?.code || e?.response?.error?.code;
        const isExpired =
            (code === 'invalid_operation' || e?.status === 400) &&
            typeof detail === 'string' && /session expired/i.test(detail);

        if (isExpired) {
            await clearRegistrationId();
            const start = await startRegistration();
            const newId = start.data.registrationId;
            const retryDto: SetRoleDto = { ...dto, registrationId: newId };
            return await http.post<RoleSaveResponse>('/api/registration/step/2', retryDto, {
                headers: { Accept: 'text/plain' },
            });
        }

        throw e;
    }
}

// Step 3 (farmer/trader/transporter) - we implement farmer example
export async function submitFarmerDetails(dto: FarmerDetailsDto) {
    // Ensure ISO string for date
    const body = {
        ...dto,
        birthDate: typeof dto.birthDate === 'string' ? dto.birthDate : dto.birthDate.toISOString(),
    };
    try {
        return await http.post<StepSavedResponse>('/api/registration/step/3/farmer', body, {
            headers: { Accept: 'text/plain' },
        });
    } catch (e: any) {
        const detail: string | undefined = e?.detail || e?.response?.error?.detail;
        const code: string | undefined = e?.code || e?.response?.error?.code;
        const isExpired =
            (code === 'invalid_operation' || e?.status === 400) &&
            typeof detail === 'string' && /session expired/i.test(detail);

        if (isExpired) {
            await clearRegistrationId();
            const start = await startRegistration();
            const newId = start.data.registrationId;
            const retryBody = { ...body, registrationId: newId };
            return await http.post<StepSavedResponse>('/api/registration/step/3/farmer', retryBody, {
                headers: { Accept: 'text/plain' },
            });
        }

        throw e;
    }
}

export async function submitTraderDetails(dto: TraderDetailsDto) {
    try {
        return await http.post<StepSavedResponse>('/api/registration/step/3/trader', dto, {
            headers: { Accept: 'text/plain' },
        });
    } catch (e: any) {
        const detail: string | undefined = e?.detail || e?.response?.error?.detail;
        const code: string | undefined = e?.code || e?.response?.error?.code;
        const isExpired =
            (code === 'invalid_operation' || e?.status === 400) &&
            typeof detail === 'string' && /session expired/i.test(detail);

        if (isExpired) {
            await clearRegistrationId();
            const start = await startRegistration();
            const newId = start.data.registrationId;
            const retryDto = { ...dto, registrationId: newId };
            return await http.post<StepSavedResponse>('/api/registration/step/3/trader', retryDto, {
                headers: { Accept: 'text/plain' },
            });
        }

        throw e;
    }
}

export async function submitTransporterDetails(dto: TransporterDetailsDto) {
    try {
        return await http.post<StepSavedResponse>('/api/registration/step/3/transporter', dto, {
            headers: { Accept: 'text/plain' },
        });
    } catch (e: any) {
        const detail: string | undefined = e?.detail || e?.response?.error?.detail;
        const code: string | undefined = e?.code || e?.response?.error?.code;
        const isExpired =
            (code === 'invalid_operation' || e?.status === 400) &&
            typeof detail === 'string' && /session expired/i.test(detail);

        if (isExpired) {
            await clearRegistrationId();
            const start = await startRegistration();
            const newId = start.data.registrationId;
            const retryDto = { ...dto, registrationId: newId };
            return await http.post<StepSavedResponse>('/api/registration/step/3/transporter', retryDto, {
                headers: { Accept: 'text/plain' },
            });
        }

        throw e;
    }
}

// Step 4: Documents
export interface RegistrationDocumentUploadDto {
    registrationId: string;
    docType: number; // role-specific mapping
    number?: string;
    issuedBy?: string;
    expiryDate?: string; // ISO
    file: File | { uri: string; name: string; type: string };
}

export async function uploadRegistrationDocument(dto: RegistrationDocumentUploadDto) {
    const form = new FormData();
    form.append('RegistrationId', dto.registrationId);
    form.append('DocType', String(dto.docType));
    if (dto.number) form.append('Number', dto.number);
    if (dto.issuedBy) form.append('IssuedBy', dto.issuedBy);
    if (dto.expiryDate) form.append('ExpiryDate', dto.expiryDate);
    
    // Handle both File objects (web) and uri-based files (mobile)
    if (dto.file instanceof File) {
        form.append('File', dto.file);
    } else {
        // For web, convert uri to File if needed
        const response = await fetch(dto.file.uri);
        const blob = await response.blob();
        const file = new File([blob], dto.file.name || 'document', { type: dto.file.type || 'application/octet-stream' });
        form.append('File', file);
    }

    return http.post<any>('/api/registration/step/4/document', form, {
        headers: { Accept: 'text/plain' },
    });
}

export function listRegistrationDocuments(registrationId: string) {
    return http.get<any>(`/api/registration/step/4/documents/${registrationId}`, {
        headers: { Accept: 'text/plain' },
    });
}

export function deleteRegistrationDocument(registrationId: string, documentId: number) {
    const url = `/api/registration/step/4/document/${documentId}?registrationId=${encodeURIComponent(registrationId)}`;
    return http.delete<any>(url, {
        headers: { Accept: 'text/plain' },
    });
}

export function completeRegistrationStep4(registrationId: string) {
    // Endpoint expects a JSON string value (e.g., "uuid") not a raw string
    return http.post<any>('/api/registration/step/4/complete', JSON.stringify(registrationId), {
        headers: { Accept: '*/*' },
    });
}


// Step 5: Payout
export async function addPayoutAccount(dto: AddPayoutAccountDto) {
    return http.post<any>('/api/registration/step/5/payout', dto, {
        headers: { Accept: 'text/plain' },
    });
}

export async function getPayoutAccounts(registrationId: string) {
    return http.get<PayoutAccount[]>(`/api/registration/step/5/payout/${registrationId}`, {
        headers: { Accept: 'text/plain' },
    });
}

export async function setDefaultPayout(payoutId: number, registrationId: string) {
    // API expects registrationId JSON string body; swagger shows PATCH
    return http.patch<any>(`/api/registration/step/5/payout/${payoutId}/default`, JSON.stringify(registrationId), {
        headers: { Accept: '*/*' },
    });
}

export async function completeRegistrationStep5(registrationId: string) {
    return http.post<any>('/api/registration/step/5/complete', JSON.stringify(registrationId), {
        headers: { Accept: '*/*' },
    });
}

export async function submitRegistration(registrationId: string) {
    return http.post<any>('/api/registration/submit', JSON.stringify(registrationId), {
        headers: { Accept: '*/*' },
    });
}

