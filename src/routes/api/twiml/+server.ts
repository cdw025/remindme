import type { RequestHandler } from './$types';

// Twilio calls this URL when the outbound call is answered.
// It returns TwiML XML telling Twilio what to say.
export const GET: RequestHandler = async ({ url }) => {
	const label = url.searchParams.get('label') ?? 'your reminder';

	const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello! This is your RemindMe assistant. 
    Your reminder is: ${escapeXml(label)}.
    Have a great day!
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna">Goodbye!</Say>
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
