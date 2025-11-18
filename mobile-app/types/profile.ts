export interface ProfileMe {
    userId: number;
    fullName: string;
    email?: string | null;
    phone?: string | null;
}

export interface UserTypeInfo {
    roleId: number;
    roleName: string;
    description: string;
    userRoles: any[];
}


