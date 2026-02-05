// Strava Webhook Handler for 100DayFit
// Using Vercel Edge Runtime for faster cold starts

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
        // Webhook subscription verification
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        const VERIFY_TOKEN = process.env.STRAVA_VERIFY_TOKEN || 'your-verify-token-here';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified');
            return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            console.log('Webhook verification failed');
            return new Response('Forbidden', { status: 403 });
        }
    } else if (request.method === 'POST') {
        // Handle webhook events
        const event = await request.json();

        console.log('Received Strava webhook event:', JSON.stringify(event));

        if (event.object_type === 'athlete' && event.aspect_type === 'delete') {
            console.log(`Athlete ${event.owner_id} has deauthorized the app`);
        }

        if (event.object_type === 'activity') {
            console.log(`Activity event: ${event.aspect_type} for activity ${event.object_id}`);
        }

        return new Response('EVENT_RECEIVED', { status: 200 });
    } else {
        return new Response(`Method ${request.method} Not Allowed`, {
            status: 405,
            headers: { 'Allow': 'GET, POST' },
        });
    }
}
