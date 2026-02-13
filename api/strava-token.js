// Strava Token Exchange Proxy for 100DayFit
// Keeps client_secret server-side, away from the app binary

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: { 'Allow': 'POST' },
        });
    }

    const body = await request.json();
    const { grant_type, code, refresh_token } = body;

    if (!grant_type) {
        return new Response(JSON.stringify({ error: 'grant_type is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const stravaBody = {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type,
    };

    if (grant_type === 'authorization_code') {
        if (!code) {
            return new Response(JSON.stringify({ error: 'code is required for authorization_code grant' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        stravaBody.code = code;
    } else if (grant_type === 'refresh_token') {
        if (!refresh_token) {
            return new Response(JSON.stringify({ error: 'refresh_token is required for refresh_token grant' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        stravaBody.refresh_token = refresh_token;
    } else {
        return new Response(JSON.stringify({ error: 'Invalid grant_type' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stravaBody),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
    });
}
