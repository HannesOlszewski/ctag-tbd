import type { ServerWebSocket } from "bun";

const MAX_PAYLOAD_SIZE = 2 ** 16;

type Route = {
	name: string;
	handler: (
		ws: ServerWebSocket<unknown>,
		payload: Uint8Array<ArrayBufferLike>,
	) => Promise<void>;
};

const MessageRequest = 0 as const;
const MessageResponse = 1 as const;
type MessageType = typeof MessageRequest | typeof MessageResponse;

type Message = {
	type: MessageType;
	route: Route;
	payload: Uint8Array<ArrayBufferLike>;
};

type AvailableProcessor = {
	id: string;
	name: string;
	isStereo: boolean;
	hint: string;
};

const routes: Route[] = [
	{
		name: "getPlugins",
		handler: async (ws) => {
			const configFile = Bun.file("../spiffs_image/data/spm-config.jsn");
			const availablePlugins = JSON.parse(await configFile.text())
				.availableProcessors as AvailableProcessor[];

			const buffer = new ArrayBuffer(MAX_PAYLOAD_SIZE, {
				maxByteLength: MAX_PAYLOAD_SIZE,
			});
			const view = new DataView(buffer);
			let offset = 0;

			// general header
			view.setUint8(offset++, MessageResponse);
			view.setUint8(offset++, 0); // route index
			const payloadLengthOffset = offset;
			view.setUint16(offset, 0, true); // Needs to be set afterwards when we know the whole paylaod size
			offset += 2;

			// payload
			view.setUint8(offset++, availablePlugins.length);

			for (const plugin of availablePlugins) {
				const encoder = new TextEncoder();
				const idBytes = encoder.encode(plugin.id);
				const nameBytes = encoder.encode(plugin.name);
				const hintBytes = encoder.encode(plugin.hint);

				// Payload length + flags + id length + id + name length + name + hint length + hint
				view.setUint8(
					offset++,
					5 + idBytes.length + nameBytes.length + hintBytes.length,
				);
				view.setUint8(offset++, plugin.isStereo ? 1 : 0);
				view.setUint8(offset++, idBytes.length);

				for (const byte of idBytes) {
					view.setUint8(offset++, byte);
				}

				view.setUint8(offset++, nameBytes.length);

				for (const byte of nameBytes) {
					view.setUint8(offset++, byte);
				}

				view.setUint8(offset++, hintBytes.length);

				for (const byte of hintBytes) {
					view.setUint8(offset++, byte);
				}
			}

			view.setUint16(
				payloadLengthOffset,
				offset - payloadLengthOffset - 1,
				true,
			);

			buffer.resize(offset);

			ws.send(view);
		},
	},
	{
		name: "getActivePlugin",
		handler: async (ws, payload) => {
			const configFile = Bun.file("../spiffs_image/data/spm-config.jsn");
			const channel = payload[0] as number;
			const activePlugins = JSON.parse(await configFile.text())
				.activeProcessors as string[];
			const activePluginId = activePlugins[channel];
			const idBytes = new TextEncoder().encode(activePluginId);

			const buffer = new ArrayBuffer(MAX_PAYLOAD_SIZE, {
				maxByteLength: MAX_PAYLOAD_SIZE,
			});
			const view = new DataView(buffer);
			let offset = 0;

			// general header
			view.setUint8(offset++, MessageResponse);
			view.setUint8(offset++, 1); // route index
			view.setUint16(offset, idBytes.length + 1, true);
			offset += 2;

			view.setUint8(offset++, channel);

			for (const byte of idBytes) {
				view.setUint8(offset++, byte);
			}

			buffer.resize(offset);

			ws.send(view);
		},
	},
	{
		name: "setActivePlugin",
		handler: async (_, payload) => {
			const configFile = Bun.file("../spiffs_image/data/spm-config.jsn");
			const config = JSON.parse(await configFile.text());
			const channel = payload[0] as number;
			const idLength = payload[1] as number;
			const id = new TextDecoder().decode(payload.slice(2, 2 + idLength));
			config.activeProcessors[channel] = id;
			configFile.write(JSON.stringify(config));
		},
	},
];

function parseMessage(message: string | Buffer<ArrayBufferLike>): Message {
	const buffer =
		typeof message === "string"
			? new TextEncoder().encode(message).buffer
			: message.buffer;
	const view = new DataView(buffer);
	let offset = 0;

	const type = view.getUint8(offset++) as MessageType;
	const route = routes[view.getUint8(offset++)];
	const payloadLength = view.getUint16(offset, true);
	offset += 2;
	const payload = new Uint8Array(buffer, offset, payloadLength);

	return {
		type,
		route,
		payload,
	};
}

console.log("Started server");

Bun.serve({
	fetch(req, server) {
		if (server.upgrade(req)) {
			return;
		}
		return new Response("Upgrade failed", { status: 500 });
	},
	websocket: {
		message(ws, message) {
			console.log("Received message over WebSocket", message);
			const parsedMessage = parseMessage(message);
			parsedMessage.route.handler(ws, parsedMessage.payload);
		},
		open() {
			console.log("Connection to WebSocket opened");
		},
		close(_, code, message) {
			console.log("Closed connection to WebSocket", code, message);
		},
	},
});
