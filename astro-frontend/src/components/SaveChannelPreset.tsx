import { useEffect, useState, type FormEvent } from "react";
import type { Channel } from "@/stores/pluginsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Preset = {
	name: string;
	number: number;
};

interface GetPresetsResponse {
	activePresetNumber: number;
	presets: Preset[];
}

interface SaveChannelPresetProps {
	channel: Channel;
}

export default function SaveChannelPreset({ channel }: SaveChannelPresetProps) {
	const [fetched, setFetched] = useState(false);
	const [activePresetNumber, setActivePresetNumber] = useState<number>(-1);
	const [presets, setPresets] = useState(new Map<number, Preset>());
	const [newPreset, setNewPreset] = useState<Preset>({ number: -1, name: "" });
	const isOverwritingPreset = presets.has(newPreset.number);

	useEffect(() => {
		if (!fetched) {
			setFetched(true);

			fetch(`/api/v1/getPresets/${channel}`)
				.then((r) => r.json())
				.then((r: GetPresetsResponse) => {
					const loadedPresets = new Map<number, Preset>(
						r.presets.map((p) => [p.number, p]),
					);
					setPresets(new Map<number, Preset>(loadedPresets));
					setActivePresetNumber(r.activePresetNumber);
					setNewPreset({
						number: loadedPresets.size,
						name: "",
					});
				});
		}
	}, [fetched]);

	const handleSave = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (newPreset === undefined) {
			return;
		}

		fetch(
			`/api/v1/savePreset/${channel}?number=${newPreset.number}&name=${newPreset.name}`,
		).then((r) => {
			if (r.ok) {
				setActivePresetNumber(newPreset.number);
				setPresets((prev) => new Map(prev).set(newPreset.number, newPreset));
			}
		});
	};

	if (activePresetNumber === -1) {
		return <></>;
	}

	return (
		<>
			<h4>
				Current preset {activePresetNumber}:{" "}
				{presets.get(activePresetNumber)?.name}
			</h4>
			<form onSubmit={handleSave}>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="number">Patch Number</Label>
					<Input
						id="number"
						type="number"
						value={newPreset.number}
						onChange={(e) =>
							setNewPreset({
								number: e.target.valueAsNumber,
								name: presets.get(e.target.valueAsNumber)?.name ?? "",
							})
						}
						min={0}
						max={presets.size}
						required
					/>
				</div>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="name">Patch Name</Label>
					<Input
						id="name"
						type="text"
						value={newPreset.name}
						onChange={(e) =>
							setNewPreset((prev) => ({
								...prev,
								name: e.target.value,
							}))
						}
						minLength={1}
						required
					/>
				</div>
				<Button type="submit">
					{isOverwritingPreset ? "Overwrite ?!" : "Save"}
				</Button>
			</form>
		</>
	);
}
