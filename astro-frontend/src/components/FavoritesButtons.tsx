import { useStore } from "@nanostores/react";
import { $currentFavoriteNum } from "@/stores/favoritesStore";
import { $activePlugins, type Plugin } from "@/stores/pluginsStore";
import { Button } from "@/components/ui/button";

export default function FavoritesButtons() {
	const currentFavorite = useStore($currentFavoriteNum);

	const handleRecall = async () => {
		const response = await fetch(
			`/api/v1/favorites/recall/${currentFavorite}`,
			{ method: "POST" },
		);

		if (!response.ok) {
			return;
		}

		const channelOneFetch = fetch("/api/v1/getActivePlugin/0")
			.then((r) => r.json())
			.then(({ id }: Pick<Plugin, "id">) => $activePlugins.setKey("0", { id }));
		const channelTwoFetch = fetch("/api/v1/getActivePlugin/1")
			.then((r) => r.json())
			.then(({ id }: Pick<Plugin, "id">) => $activePlugins.setKey("1", { id }));

		await Promise.all([channelOneFetch, channelTwoFetch]);
	};

	return (
		<>
			<Button variant="ghost" onClick={handleRecall}>
				Recall
			</Button>
			<Button variant="ghost" asChild>
				<a role="button" className="btn" href={`/fav/${currentFavorite}/snap`}>
					Snap
				</a>
			</Button>
			<Button variant="ghost" asChild>
				<a role="button" className="btn" href={`/fav/${currentFavorite}/edit`}>
					Edit
				</a>
			</Button>
		</>
	);
}
