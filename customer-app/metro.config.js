const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return {
      filePath: path.resolve(__dirname, "src/components/Map/index.web.tsx"),
      type: "sourceFile",
    };
  }

  // Prevent zustand ESM from pulling in import.meta on web
  if (moduleName === "zustand" || moduleName.startsWith("zustand/")) {
    const subpath =
      moduleName === "zustand"
        ? "index.js"
        : moduleName.replace("zustand/", "") + ".js";
    return {
      filePath: path.resolve(__dirname, "node_modules/zustand", subpath),
      type: "sourceFile",
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
