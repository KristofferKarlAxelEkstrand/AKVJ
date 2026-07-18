const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin });

rl.on('line', line => {
	let msg;
	try {
		msg = JSON.parse(line);
	} catch {
		return;
	}

	if (msg.method === 'initialize') {
		process.stdout.write(
			JSON.stringify({
				jsonrpc: '2.0',
				id: msg.id,
				result: {
					protocolVersion: 1,
					agentCapabilities: {},
					authMethods: []
				}
			}) + '\n'
		);
	} else if (msg.method === 'session/new') {
		process.stdout.write(
			JSON.stringify({
				jsonrpc: '2.0',
				id: msg.id,
				result: { sessionId: 'test-session-001' }
			}) + '\n'
		);
	} else if (msg.method === 'session/prompt') {
		process.stdout.write(
			JSON.stringify({
				jsonrpc: '2.0',
				method: 'session/update',
				params: {
					sessionUpdate: 'agent_message_chunk',
					content: { text: 'Processing...' }
				}
			}) + '\n'
		);
		process.stdout.write(
			JSON.stringify({
				jsonrpc: '2.0',
				id: msg.id,
				result: { stopReason: 'end_turn' }
			}) + '\n'
		);
	} else if (msg.method === 'session/cancel') {
		// Notification — no response
	} else if (msg.id !== undefined) {
		process.stdout.write(
			JSON.stringify({
				jsonrpc: '2.0',
				id: msg.id,
				error: { code: -32601, message: `Method not found: ${msg.method}` }
			}) + '\n'
		);
	}
});
