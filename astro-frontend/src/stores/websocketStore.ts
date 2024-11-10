import { atom, onMount, task } from "nanostores";

export const $ws = atom<WebSocket | null>(null);

onMount($ws, () => {
  task(
    () =>
      new Promise<void>((resolve, reject) => {
        const ws = new WebSocket("ws://localhost:3000/api/v1/ws");

        ws.onopen = () => {
          $ws.set(ws);
          resolve();
        };
        ws.onerror = () => reject();
      }),
  );
});
