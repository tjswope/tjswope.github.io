// Contact form handler for the New Wave Apps website
// Sends messages via Resend (https://resend.com). Required env vars:
//   RESEND_API_KEY     - Resend API key
//   CONTACT_FROM_EMAIL - verified sender, e.g. "New Wave Apps <contact@newwaveapps.com>"
// Optional:
//   CONTACT_TO_EMAIL   - where messages are delivered (default support@newwaveapps.com)

export const config = {
    runtime: 'edge',
};

const LIMITS = { name: 100, email: 200, app: 100, topic: 60, message: 5000 };

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: { 'Allow': 'POST' },
        });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid request' }, 400);
    }

    // Honeypot: bots fill hidden fields. Pretend success.
    if (body.company) {
        return json({ ok: true });
    }

    const field = (k) => (typeof body[k] === 'string' ? body[k].trim().slice(0, LIMITS[k]) : '');
    const name = field('name');
    const email = field('email');
    const app = field('app');
    const topic = field('topic');
    const message = field('message');

    if (!name || !email || !message) {
        return json({ error: 'Name, email, and message are required' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: 'Please enter a valid email address' }, 400);
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL || 'support@newwaveapps.com';
    if (!apiKey || !from) {
        return json({ error: 'Contact form is not configured' }, 500);
    }

    const subjectParts = ['Website message', app, topic].filter(Boolean);
    const rows = [
        ['Name', name],
        ['Email', email],
        ['App', app || '—'],
        ['Topic', topic || '—'],
    ];
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${message}`;
    const html =
        '<table cellpadding="4">' +
        rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v)}</td></tr>`).join('') +
        '</table>' +
        `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: [to],
            reply_to: email,
            subject: subjectParts.join(' – '),
            text,
            html,
        }),
    });

    if (!res.ok) {
        console.error('Resend error', res.status, await res.text());
        return json({ error: 'Could not send message' }, 502);
    }

    return json({ ok: true });
}
