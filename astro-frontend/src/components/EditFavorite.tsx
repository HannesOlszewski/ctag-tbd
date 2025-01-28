import { useStore } from "@nanostores/react";
import { $favorites, type FavoritePreset } from "@/stores/favoritesStore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface EditFavoriteProps {
	num: number;
	favoriteData?: FavoritePreset;
}

export default function EditCurrrentFavorite({
	num,
	favoriteData,
}: EditFavoriteProps) {
	const favorites = useStore($favorites);
	const currentFavorite = favoriteData ?? favorites.at(num);
	const [name, setName] = useState<string>("");
	const [ustring, setUstring] = useState<string>("");

	useEffect(() => {
		if (currentFavorite) {
			setName(currentFavorite.name);
			setUstring(currentFavorite.ustring);
		}
	}, [currentFavorite]);

	const handleSave = async () => {
		if (!currentFavorite) {
			return;
		}

		const data: FavoritePreset = {
			...currentFavorite,
			name,
			ustring,
		};

		const response = await fetch(`/api/v1/favorites/store/${num}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (response.ok) {
			favorites[num] = data;
			$favorites.set(favorites);
		}
	};

	return (
		<>
			<div className="grid w-full max-w-sm items-center gap-1.5">
				<Label htmlFor="name">Name </Label>
				<Input
					id="name"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			</div>

			<div className="grid w-full max-w-sm items-center gap-1.5">
				<Label htmlFor="ustring">User String</Label>
				<Input
					id="ustring"
					type="text"
					value={ustring}
					onChange={(e) => setUstring(e.target.value)}
				/>
			</div>

			<Button onClick={handleSave}>Save</Button>
		</>
	);
}
