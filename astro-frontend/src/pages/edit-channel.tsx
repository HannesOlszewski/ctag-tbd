import { useParams } from "react-router";
import PluginParams from "@/components/PluginParams";
import Layout from "@/layouts/layout";

export default function EditChannelPage() {
	const { channel } = useParams();
	return (
		<Layout name={`Channel ${channel}`}>
			<PluginParams channel={channel} />
		</Layout>
	);
}
