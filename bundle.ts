import * as esbuild from "https://deno.land/x/esbuild@v0.24.0/mod.js";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ["./src/photos-stack.ts"],
  outfile: "./dist/photo-stack.js",
  bundle: true,
  format: "esm",
});

esbuild.stop();
