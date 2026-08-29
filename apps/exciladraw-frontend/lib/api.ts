import axios from "axios";
import { HTTP_BACKEND } from "@/config";

const TOKEN_KEY = "token";

export function getToken() {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(TOKEN_KEY);
    } catch {
        // a browser with site data blocked throws rather than returning null
        return null;
    }
}

export function setToken(token: string) {
    try {
        window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
        /* nothing we can do; the session just won't survive a reload */
    }
}

export function clearToken() {
    try {
        window.localStorage.removeItem(TOKEN_KEY);
    } catch {
        /* ignore */
    }
}

export const api = axios.create({ baseURL: HTTP_BACKEND });

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

/**
 * Turns whatever an endpoint failed with into a sentence worth showing. Axios'
 * own message ("Request failed with status code 409") never is.
 */
export function errorMessage(err: unknown, fallback: string) {
    if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: string } | undefined)?.message;
        if (message) return message;
        if (!err.response) return "Can't reach the server. Check your connection and try again.";
    }
    return fallback;
}

/** True when the server rejected the token, so the session should be dropped. */
export function isAuthError(err: unknown) {
    if (!axios.isAxiosError(err)) return false;
    return err.response?.status === 401 || err.response?.status === 403;
}
