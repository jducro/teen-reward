function readCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    return meta?.content ?? '';
}

function writeCsrfToken(token: string) {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;

    if (meta && token) {
        meta.content = token;
    }
}

export async function apiRequest(url: string, { method = 'GET', body }: { method?: string; body?: unknown } = {}) {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(method !== 'GET' ? { 'X-CSRF-TOKEN': readCsrfToken() } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (payload?.csrfToken) {
        writeCsrfToken(payload.csrfToken);
    }

    if (!response.ok) {
        throw {
            status: response.status,
            message: payload?.message ?? null,
            errors: payload?.errors ?? {},
        };
    }

    return payload;
}
