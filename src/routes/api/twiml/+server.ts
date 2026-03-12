import type { RequestHandler } from './$types';
import { PUBLIC_BASE_URL } from '$env/static/public';

// Twilio calls this URL when the outbound call is answered.
// It returns TwiML XML telling Twilio what to say, then listens for a spoken response.
export const GET: RequestHandler = async ({ url }) => {
	const label = url.searchParams.get('label') ?? 'your reminder';
	const id = url.searchParams.get('id') ?? '';

	const respondUrl = `${PUBLIC_BASE_URL}/api/twiml/respond?id=${encodeURIComponent(id)}&label=${encodeURIComponent(label)}`;

	const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello! This is your RemindMe assistant. 
    Your reminder is: ${escapeXml(label)}.
  </Say>
  <Gather input="speech" action="${escapeXml(respondUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">
      You can say: got it to dismiss, snooze to be called back in 5 minutes, or reschedule followed by a time.
    </Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Goodbye!</Say>
</Response>`;

	return new Response(twiml, {
		headers: { 'Content-Type': 'text/xml' }
	});
};

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
