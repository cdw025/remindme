import twilio from 'twilio';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

export function getTwilioClient() {
	return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Makes an outbound call to the given number.
 * Twilio will GET /api/twiml?label=... to get the TwiML script.
 */
export async function makeReminderCall(to: string, label: string, id: number) {
	const client = getTwilioClient();
	const encodedLabel = encodeURIComponent(label);
	const twimlUrl = `${PUBLIC_BASE_URL}/api/twiml?label=${encodedLabel}&id=${id}`;

	const call = await client.calls.create({
		to,
		from: TWILIO_FROM_NUMBER,
		url: twimlUrl
	});

	return call.sid;
}
