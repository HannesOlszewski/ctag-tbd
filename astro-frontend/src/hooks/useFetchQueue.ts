import { useRef } from "react";

interface QueueItem {
	url: string | URL;
	options?: RequestInit;
}

export default function useFetchQueue() {
	const queue = useRef<QueueItem[]>([]);
	const activeItem = useRef<QueueItem>(null);

	const runQueue = async () => {
		while (queue.current.length > 0) {
			const item = queue.current.shift();
			activeItem.current = item ?? null;

			if (!item) {
				break;
			}

			await fetch(item.url, item.options);
			activeItem.current = null;
		}
	};

	const addToQueue = (item: QueueItem) => {
		queue.current.push(item);

		if (queue.current.length === 1 && !activeItem.current) {
			runQueue();
		}
	};

	return { addToQueue };
}
