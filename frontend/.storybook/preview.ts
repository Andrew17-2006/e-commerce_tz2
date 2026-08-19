import type { Preview } from "@storybook/react";
import "../src/styles/index.css";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: "app",
      values: [{ name: "app", value: "#F8F7F4" }],
    },
  },
};

export default preview;
