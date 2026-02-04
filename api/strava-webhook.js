// Strava Webhook Handler for 100DayFit
// Deploy to Vercel - this handles webhook subscription verification and events

export default function handler(req, res) {
    if (req.method === 'GET') {
        // Webhook subscription verification
        // Strava sends a GET request with hub.challenge when setting up the webhook
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Your verify token - set this in Vercel environment variables
        const VERIFY_TOKEN = process.env.STRAVA_VERIFY_TOKEN || 'your-verify-token-here';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified');
            res.status(200).json({ 'hub.challenge': challenge });
        } else {
            console.log('Webhook verification failed');
            res.status(403).send('Forbidden');
        }
    } else if (req.method === 'POST') {
        // Handle webhook events
        const event = req.body;

        console.log('Received Strava webhook event:', JSON.stringify(event));

        // Event types:
        // - object_type: 'activity' or 'athlete'
        // - aspect_type: 'create', 'update', or 'delete'
        // - owner_id: the athlete's ID
        // - object_id: the activity ID (for activity events)

        if (event.object_type === 'athlete' && event.aspect_type === 'delete') {
            // Athlete has deauthorized the app
            // In a production app, you would:
            // 1. Store this event in a database
            // 2. Mark the user's Strava connection as revoked
            // 3. The app would check this on next launch and clear local tokens
            console.log(`Athlete ${event.owner_id} has deauthorized the app`);

            // TODO: Store deauthorization in database
            // await db.storeDeauthorization(event.owner_id);
        }

        if (event.object_type === 'activity') {
            // Activity was created, updated, or deleted
            // We don't need to handle this since we only upload activities
            // and don't read them
            console.log(`Activity event: ${event.aspect_type} for activity ${event.object_id}`);
        }

        // Always respond with 200 OK to acknowledge receipt
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
