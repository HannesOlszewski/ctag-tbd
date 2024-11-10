import { map, onMount, task } from "nanostores";
import { $ws } from "./websocketStore";

const channels = ["0", "1"] as const;

export type Channel = (typeof channels)[number];

export interface Plugin {
	id: string;
	name: string;
	isStereo: boolean;
	hint: string;
}

export interface Preset {
	name: string;
	number: number;
}

export interface ChannelPreset {
	activePresetNumber: number;
	presets: Preset[];
}

export type PluginsMap = Record<string, Plugin>;

type ActivePlugins = Record<Channel, Pick<Plugin, "id"> | undefined>;

type ChannelPresets = Record<Channel, ChannelPreset | undefined>;

export const $plugins = map<PluginsMap>({});

onMount($plugins, () => {
	task(async () => {
		if (!globalThis.window) {
			return;
		}

		$ws.subscribe((ws) => {
			if (!ws) {
				return;
			}

			ws.addEventListener("message", async (event) => {
				const decoder = new TextDecoder();
				const buffer = await new Response(event.data).arrayBuffer();
				const view = new DataView(buffer);
				let offset = 0;

				const messageType = view.getUint8(offset++);
				const route = view.getUint8(offset++);

				if (messageType !== 1 || route !== 0) {
					return;
				}

				const payloadLength = view.getUint16(offset, true);
				offset += 2;
				offset++; // don't need the number of plugins

				while (offset < payloadLength) {
					offset++; // don't need the plugin length
					const isStereo = view.getUint8(offset++) === 1;

					const idLength = view.getUint8(offset++);
					const idBytes = new Uint8Array(buffer, offset, idLength);
					const id = decoder.decode(idBytes);
					offset += idLength;

					const nameLength = view.getUint8(offset++);
					const nameBytes = new Uint8Array(buffer, offset, nameLength);
					const name = decoder.decode(nameBytes);
					offset += nameLength;

					const hintLength = view.getUint8(offset++);
					const hintBytes = new Uint8Array(buffer, offset, hintLength);
					const hint = decoder.decode(hintBytes);
					offset += hintLength;

					$plugins.setKey(id, {
						id,
						name,
						isStereo,
						hint,
					});
				}
			});

			const buffer = new ArrayBuffer(4);
			const view = new DataView(buffer);
			let offset = 0;

			view.setUint8(offset++, 0); // 0 = Request
			view.setUint8(offset++, 0); // 0 = getPlugins
			view.setUint16(offset, 0, true); // Payload length

			ws.send(view);
		});
	});
});

export const $activePlugins = map<ActivePlugins>({
	0: undefined,
	1: undefined,
});

onMount($activePlugins, () => {
	task(async () => {
		if (!globalThis.window) {
			return;
		}

		$ws.subscribe((ws) => {
			if (!ws) {
				return;
			}

			ws.addEventListener("message", async (event) => {
				const decoder = new TextDecoder();
				const buffer = await new Response(event.data).arrayBuffer();
				const view = new DataView(buffer);
				let offset = 0;

				const messageType = view.getUint8(offset++);
				const route = view.getUint8(offset++);

				if (messageType !== 1 || route !== 1) {
					return;
				}

				const payloadLength = view.getUint16(offset, true);
				offset += 2;

				const channel = view.getUint8(offset++);
				const idBytes = new Uint8Array(buffer, offset, payloadLength - 1);
				const id = decoder.decode(idBytes);

				$activePlugins.setKey(channel.toString() as Channel, { id });
			});

			for (const channel of channels) {
				const buffer = new ArrayBuffer(5); // 4 base header + 1 payload (channel number)
				const view = new DataView(buffer);
				let offset = 0;

				view.setUint8(offset++, 0); // 0 = Request
				view.setUint8(offset++, 1); // 1 = getActivePlugin
				view.setUint16(offset, 1, true); // Payload length
				offset += 2;
				view.setUint8(offset, Number.parseInt(channel));

				ws.send(view);
			}
		});
	});
});

export const $channelPresets = map<ChannelPresets>({
	0: undefined,
	1: undefined,
});

onMount($channelPresets, () => {
	task(async () => {
		if (!globalThis.window) {
			return;
		}

		await Promise.all(
			channels.map((ch) =>
				fetch(`/api/v1/getPresets/${ch}`)
					.then((r) => r.json())
					.then((pr: ChannelPreset) => $channelPresets.setKey(ch, pr)),
			),
		);
	});
});
