import { useStore } from "@nanostores/react";
import { Link } from "react-router";
import {
	$activePlugins,
	$plugins,
	type Channel,
	type Plugin,
} from "@/stores/pluginsStore";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { $ws } from "@/stores/websocketStore";

const PING_BATCH_COUNT = 10;
const PING_BATCH_WAIT_MS = 1000;

interface PluginSelectProps {
	channel: Channel;
}

export default function PluginSelect({ channel }: PluginSelectProps) {
	const ws = useStore($ws);
	const plugins = useStore($plugins);
	const activePlugins = useStore($activePlugins);
	const activePlugin = activePlugins[channel] ?? undefined;
	const isOtherPluginStereo = Object.entries(activePlugins).some(
		([key, p]) => p !== undefined && key !== channel && plugins[p.id]?.isStereo,
	);

	const performPluginChange = (ch: string, newId: string) => {
		if (!ws) {
			return;
		}

		const idBytes = new TextEncoder().encode(newId);
		const buffer = new ArrayBuffer(4 + 2 + idBytes.length);
		const view = new DataView(buffer);
		let offset = 0;

		view.setUint8(offset++, 0);
		view.setUint8(offset++, 2);
		view.setUint16(offset, 2 + idBytes.length, true);
		offset += 2;
		view.setUint8(offset++, ch === "0" ? 0 : 1);
		view.setUint8(offset++, idBytes.length);

		for (const byte of idBytes) {
			view.setUint8(offset++, byte);
		}

		ws.send(view);
	};

	const handlePluginChange = (newId: string) => {
		performPluginChange(channel, newId);
		$activePlugins.setKey(channel, { id: newId });

		if (
			channel === "0" &&
			!plugins[newId]?.isStereo &&
			activePlugins["1"]?.id !== undefined
		) {
			performPluginChange("1", newId);
		}
	};

	return (
		<>
			<Select value={activePlugin?.id ?? ""} onValueChange={handlePluginChange}>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Plugin" />
				</SelectTrigger>
				<SelectContent>
					{Object.values(plugins)
						.filter((plugin) => (channel === "1" ? !plugin.isStereo : true))
						.toSorted((a: Plugin, b: Plugin) =>
							a.name.localeCompare(b.name, undefined, { numeric: true }),
						)
						.map((plugin: Plugin) => (
							<SelectItem value={plugin.id} key={plugin.id}>
								{plugin.name} ({plugin.isStereo ? "ST" : "M"})
							</SelectItem>
						))}
				</SelectContent>
			</Select>
			<>
				<Button asChild disabled={isOtherPluginStereo} variant="ghost">
					<Link to={`/ch/${channel}/edit/`}>Edit channel</Link>
				</Button>
				<Button
					onClick={async () => {
						const start = new Date().getTime();
						await fetch("/api/v1/ping?q=Test");
						const end = new Date().getTime();
						const elapsed = end - start;
						console.log({ start, end, elapsed });
					}}
					variant="ghost"
				>
					Ping HTTP
				</Button>
				<Button
					onClick={async () => {
						const times: number[] = [];

						for (let i = 0; i < PING_BATCH_COUNT; i++) {
							const start = new Date().getTime();
							await fetch("/api/v1/ping?q=Test");
							const end = new Date().getTime();
							const elapsed = end - start;
							times.push(elapsed);
						}

						const average =
							times.reduce((prev, curr) => prev + curr) / times.length;
						const median = times.slice().sort()[
							Math.floor(times.length / 2 - 1)
						];
						console.log({
							average,
							median,
							count: times.length,
							times,
						});
					}}
					variant="ghost"
				>
					Ping HTTP x{PING_BATCH_COUNT}
				</Button>
				<Button
					onClick={async () => {
						const times: number[] = [];

						for (let i = 0; i < PING_BATCH_COUNT; i++) {
							const start = new Date().getTime();
							await fetch("/api/v1/ping?q=Test");
							const end = new Date().getTime();
							const elapsed = end - start;
							times.push(elapsed);
							await new Promise((resolve) =>
								setTimeout(() => resolve({}), PING_BATCH_WAIT_MS),
							);
						}

						const average =
							times.reduce((prev, curr) => prev + curr) / times.length;
						const median = times.slice().sort()[
							Math.floor(times.length / 2 - 1)
						];
						console.log({
							average,
							median,
							count: times.length,
							times,
						});
					}}
					variant="ghost"
				>
					Ping HTTP x{PING_BATCH_COUNT} (wait {PING_BATCH_WAIT_MS}ms)
				</Button>
				<Button
					onClick={() => {
						if (!ws) {
							console.log("WebSocket not initialized yet");
							return;
						}

						const start = new Date().getTime();
						ws.send("Test");
						ws.addEventListener("message", function pingListener() {
							const end = new Date().getTime();
							console.log({ start, end, elapsed: end - start });
							ws.removeEventListener("message", pingListener);
						});
					}}
					variant="ghost"
				>
					Ping WS
				</Button>
				<Button
					onClick={async () => {
						if (!ws) {
							console.log("WebSocket not initialized yet");
							return;
						}

						const times: number[] = [];

						for (let i = 0; i < PING_BATCH_COUNT; i++) {
							await new Promise((resolve) => {
								const start = new Date().getTime();
								ws.send("Test");
								ws.addEventListener("message", function pingListener() {
									const end = new Date().getTime();
									const elapsed = end - start;
									times.push(elapsed);
									ws.removeEventListener("message", pingListener);
									resolve(true);
								});
							});
						}

						const average =
							times.reduce((prev, curr) => prev + curr) / times.length;
						const median = times.slice().sort()[
							Math.floor(times.length / 2 - 1)
						];
						console.log({
							average,
							median,
							count: times.length,
							times,
						});
					}}
					variant="ghost"
				>
					Ping WS x{PING_BATCH_COUNT}
				</Button>
				<Button
					onClick={async () => {
						if (!ws) {
							console.log("WebSocket not initialized yet");
							return;
						}

						const times: number[] = [];

						for (let i = 0; i < PING_BATCH_COUNT; i++) {
							await new Promise((resolve) => {
								const start = new Date().getTime();
								ws.send("Test");
								ws.addEventListener("message", function pingListener() {
									const end = new Date().getTime();
									const elapsed = end - start;
									times.push(elapsed);
									ws.removeEventListener("message", pingListener);
									setTimeout(() => resolve({}), PING_BATCH_WAIT_MS);
								});
							});
						}

						const average =
							times.reduce((prev, curr) => prev + curr) / times.length;
						const median = times.slice().sort()[
							Math.floor(times.length / 2 - 1)
						];
						console.log({
							average,
							median,
							count: times.length,
							times,
						});
					}}
					variant="ghost"
				>
					Ping WS x{PING_BATCH_COUNT} (wait {PING_BATCH_WAIT_MS}ms)
				</Button>
			</>
		</>
	);
}
