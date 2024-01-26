import { ws } from "@stricjs/app";
import { watch } from "fs";

const wsRoute = ws.route({
	open(ws) {
		console.log("hmr started");
		ws.subscribe("hmr");
		ws.publish("hmr", "start");
	},
	message(ws, message) {
		console.log('Message from', ws.data.name, ':', message);
	},
	close(ws) {
		console.log('hmr stopped');
	}
});

const watcher = watch(import.meta.dir, { recursive: true });
watcher.on("change", () => {
	wsRoute.server.publish("hmr", "reload");
});

export default wsRoute;