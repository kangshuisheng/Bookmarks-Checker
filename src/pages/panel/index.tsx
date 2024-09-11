import { createRoot } from "react-dom/client";
import Panel from "@pages/panel/Panel";
import "@assets/styles/tailwind.css";
import { NextUIProvider } from "@nextui-org/system";

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Panel root element");
  const root = createRoot(rootContainer);
  root.render(
    <NextUIProvider>
      <Panel />
    </NextUIProvider>
  );
}

init();
