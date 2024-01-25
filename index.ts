import { init } from "@stricjs/app"

await init({
	routes: ["./src"],
	serve: {
		reusePort: true,
	},
});
