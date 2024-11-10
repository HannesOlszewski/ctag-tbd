import { $channelPresets, type Channel } from "@/stores/pluginsStore";
import { useStore } from "@nanostores/react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface LoadChannelPresetProps {
	channel: Channel;
}

export default function LoadChannelPreset({ channel }: LoadChannelPresetProps) {
	const { activePresetNumber, presets } =
		useStore($channelPresets)[channel] ?? {};

	const handleClick = (presetNumber: number) => {
		if (!presets) {
			return;
		}

		fetch(`/api/v1/loadPreset/${channel}?number=${presetNumber}`).then((r) => {
			if (r.ok) {
				$channelPresets.setKey(channel, {
					presets,
					activePresetNumber: presetNumber,
				});
			}
		});
	};

	return (
		<RadioGroup
			value={activePresetNumber?.toString()}
			onValueChange={(value) => {
				const newValue = Number.parseInt(value, 10);

				if (!Number.isNaN(newValue)) {
					handleClick(newValue);
				}
			}}
		>
			{presets?.map((preset) => (
				<div className="flex items-center space-x-2">
					<RadioGroupItem
						key={preset.number}
						value={preset.number.toString()}
						id={`option-${preset.number}`}
					/>
					<Label htmlFor={`option-${preset.number}`}>{preset.name}</Label>
				</div>
			))}
		</RadioGroup>
	);
}
