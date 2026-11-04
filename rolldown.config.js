import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";
import { globSync } from "fs";
import { join } from "path";

const external = ["fs", /^@dduix/];
const packageDirectories = globSync("packages/*");

export default defineConfig(
  packageDirectories.map((dir) => ({
    input: join(dir, "src/index.ts"),
    plugins: [dts({ eager: true })],
    external,
    output: {
      dir: join(dir, "dist"),
      format: "es",
      sourcemap: true,
    },
  })),
);
