import { useStore } from "@nanostores/react";
import { $currentFavoriteNum, $favorites } from "@/stores/favoritesStore";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function FavoritesSelect() {
	const favorites = useStore($favorites);
	const currentFavorite = useStore($currentFavoriteNum);

	const handleChange = (value: string) => {
		const newFavorite = Number.parseInt(value, 10);

		if (!Number.isNaN(newFavorite)) {
			$currentFavoriteNum.set(newFavorite);
		}
	};

	return (
		<Select value={currentFavorite.toString()} onValueChange={handleChange}>
			<SelectTrigger className="w-[180px]">
				<SelectValue placeholder="Favorite" />
			</SelectTrigger>
			<SelectContent>
				{favorites.map((favorite, i) => (
					<SelectItem value={i.toString()} key={i.toString()}>
						{i}: {favorite.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
