export type FormatterUser = {
    id: string;
    name?: string | null;
    email: string;
    role?: string | null;
    created_at?: string | null;
    document_formatter_access?: boolean;
};

export type FormatterAccessRequest = {
    name: string;
    email: string;
    organization?: string;
    reason: string;
};

export const API_BASE_URL = (
    import.meta.env.VITE_API_URL ||
    "https://felix-platform-backend.onrender.com"
).replace(/\/$/, "");

export const TOKEN_STORAGE_KEY = "felix_formatter_token";
export const USER_STORAGE_KEY = "felix_formatter_user";

export const getStoredToken = () => {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const getStoredUser = (): FormatterUser | null => {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const rawValue = localStorage.getItem(USER_STORAGE_KEY);
        return rawValue ? (JSON.parse(rawValue) as FormatterUser) : null;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const saveAuthSession = (token: string, user: FormatterUser) => {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
};

export async function signInToFormatter(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Login failed with ${response.status}`);
    }

    const data = await response.json();
    saveAuthSession(data.token, data.user);
    return data.user as FormatterUser;
}

export async function requestFormatterAccess(payload: FormatterAccessRequest) {
    const response = await fetch(`${API_BASE_URL}/api/request-access`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: payload.name.trim(),
            email: payload.email.trim().toLowerCase(),
            organization: payload.organization?.trim() || undefined,
            reason: payload.reason.trim(),
        }),
    });

    if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const body = contentType.includes('application/json') ? await response.json() : await response.text();
        const message = typeof body === 'string' ? body : body?.message || 'Unable to submit the access request right now.';
        throw new Error(message);
    }

    const data = await response.json();

    if (data?.admin_email_sent === false || data?.customer_email_sent === false) {
        throw new Error(
            data?.message ||
            'Your request was saved, but the email notifications could not be sent right now. Please contact Felix Platform support directly.'
        );
    }

    return data;
}
