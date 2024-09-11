import { useEffect } from "react";

export default function Popup(): JSX.Element {
  useEffect(() => {
    const onLoad = async () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("src/pages/panel/index.html"),
      });
    };
    onLoad();
  }, []);
  return <div></div>;
}
