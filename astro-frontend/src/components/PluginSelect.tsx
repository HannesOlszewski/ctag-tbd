import { useStore } from "@nanostores/react";
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

interface PluginSelectProps {
	channel: Channel;
}

export default function PluginSelect({ channel }: PluginSelectProps) {
	const plugins = useStore($plugins);
	const activePlugins = useStore($activePlugins);
	const activePlugin = activePlugins[channel] ?? undefined;
	const isOtherPluginStereo = Object.entries(activePlugins).some(
		([key, p]) => p !== undefined && key !== channel && plugins[p.id]?.isStereo,
	);

	const handlePluginChange = (newId: string) => {
		fetch(`/api/v1/setActivePlugin/${channel}?id=${newId}`).then((r) => {
			if (r.ok) {
				$activePlugins.setKey(channel, { id: newId });
			}
		});

		if (
			channel === "0" &&
			!plugins[newId]?.isStereo &&
			activePlugins["1"]?.id !== undefined
		) {
			fetch(`/api/v1/setActivePlugin/1?id=${activePlugins["1"].id}`).then(
				(r) => {
					if (r.ok) {
						$activePlugins.setKey(channel, { id: newId });
					}
				},
			);
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
					<a href={`/${channel}/edit/`}>Edit channel</a>
				</Button>
				<Button asChild disabled={isOtherPluginStereo} variant="ghost">
					<a href={`/${channel}/load/`}>Load preset</a>
				</Button>
				<Button asChild disabled={isOtherPluginStereo} variant="ghost">
					<a href={`/${channel}/save/`}>Save preset</a>
				</Button>
			</>
		</>
	);
}
