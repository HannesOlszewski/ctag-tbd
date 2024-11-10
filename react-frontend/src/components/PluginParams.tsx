import { useEffect, useState } from "react";
import type { Plugin } from "@/stores/pluginsStore";
import useFetchQueue from "@/hooks/useFetchQueue";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type ParameterUi = {
	id: string;
	name: string;
} & (
	| {
			type: "group";
			params: ParameterUi[];
	  }
	| {
			type: "bool";
	  }
	| {
			type: "int";
			min: number;
			max: number;
			step: number;
	  }
);

type ParameterCurrent = {
	id: string;
	current: number;
	trig?: number;
	cv?: number;
};

interface PluginWithParams extends Plugin {
	params: ParameterUi[];
}

interface PatchWithParams {
	activePatch: number;
	patches: {
		name: string;
		params: ParameterCurrent[];
	}[];
}

interface PluginParamProps {
	param: ParameterUi;
	paramsCurrent: ParameterCurrent[];
	onChange: (
		param: ParameterUi,
		value: number,
		type: "current" | "trig" | "cv",
	) => void;
}

function PluginParam({ param, paramsCurrent, onChange }: PluginParamProps) {
	const paramCurrent = paramsCurrent.find((it) => it.id === param.id);
	const [current, setCurrent] = useState<number>(paramCurrent?.current ?? 0);

	switch (param.type) {
		case "group":
			return (
				<>
					<Separator />
					<div>{param.name}</div>
					<Separator />
					<div>
						{param.params.map((it) => (
							<PluginParam
								param={it}
								paramsCurrent={paramsCurrent}
								onChange={onChange}
							/>
						))}
					</div>
				</>
			);
		case "bool":
			return (
				<div className="flex h-12 items-center">
					<div className="flex-none w-5/12">{param.name}</div>
					<div className="flex-none w-6/12">
						<Switch
							defaultChecked={current !== 0}
							onClick={() => onChange(param, current == 0 ? 1 : 0, "current")}
						/>
					</div>
					<div className="flex-none w-1/12">
						<Select
							defaultValue={paramCurrent?.trig?.toString() ?? "-1"}
							onValueChange={(value) => {
								const newValue = Number.parseInt(value, 10);

								if (!Number.isNaN(newValue)) {
									onChange(param, newValue, "trig");
								}
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="TRIG" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="-1">None</SelectItem>
								<SelectItem value="0">TRIG0</SelectItem>
								<SelectItem value="1">TRIG1</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			);
		case "int":
			return (
				<div className="flex h-12 items-center">
					<div className="flex-none w-4/12">{param.name}</div>
					<div className="flex-none w-1/12">
						<Input
							type="number"
							value={current}
							onChange={(event) => {
								const newValue = event.target.valueAsNumber;

								if (!Number.isNaN(newValue)) {
									setCurrent(newValue);
									onChange(param, newValue, "current");
								}
							}}
						/>
					</div>
					<div className="flex-none w-6/12">
						<Slider
							min={param.min}
							max={param.max}
							step={1}
							value={[current]}
							className="range"
							onValueChange={(newValues) => {
								const newValue = newValues[0] ?? current;
								setCurrent(newValue);
								onChange(param, newValue, "current");
							}}
						/>
					</div>
					<div className="flex-none w-1/12">
						<Select
							value={paramCurrent?.cv?.toString() ?? "-1"}
							onValueChange={(value) => {
								const newValue = Number.parseInt(value, 10);

								if (!Number.isNaN(newValue)) {
									onChange(param, newValue, "cv");
								}
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="CV" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="-1">None</SelectItem>
								<SelectItem value="0">CV0</SelectItem>
								<SelectItem value="1">CV1</SelectItem>
								<SelectItem value="2">POT0</SelectItem>
								<SelectItem value="3">POT1</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			);
		default:
			return null;
	}
}

interface PluginParamsProps {
	channel: string;
}

export default function PluginParams({ channel }: PluginParamsProps) {
	const [fetched, setFetched] = useState(false);
	const [paramsUi, setParamsUi] = useState<ParameterUi[]>();
	const [paramsCurrent, setParamsCurrent] = useState<ParameterCurrent[]>();
	const { addToQueue } = useFetchQueue();

	useEffect(() => {
		if (!fetched) {
			setFetched(true);

			fetch(`/api/v1/getPluginParamsUI/${channel}`)
				.then((r) => r.json())
				.then((plugin: PluginWithParams) => setParamsUi(plugin.params));

			fetch(`/api/v1/getPluginParamsP/${channel}`)
				.then((r) => r.json())
				.then((plugin: PatchWithParams) =>
					setParamsCurrent(plugin.patches[0]?.params),
				);
		}
	}, [fetched]);

	const handleChange: PluginParamProps["onChange"] = (
		changedParam,
		newValue,
		type,
	) => {
		let routeSuffix = "";

		if (type === "trig") {
			routeSuffix = "TRIG";
		} else if (type === "cv") {
			routeSuffix = "CV";
		}

		addToQueue({
			url: `/api/v1/setPluginParam${routeSuffix}/${channel}?id=${changedParam.id}&${type}=${newValue}`,
		});
	};

	if (paramsUi === undefined || paramsCurrent === undefined) {
		return <></>;
	}

	return (
		<>
			{paramsUi.map((param) => (
				<PluginParam
					param={param}
					paramsCurrent={paramsCurrent}
					onChange={handleChange}
				/>
			))}
		</>
	);
}
