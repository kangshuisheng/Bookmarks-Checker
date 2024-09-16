import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { ActionType, dfs } from "@src/utils";
import { ResultComponent } from "./components/result-component";
import { BookmarkTreeItem } from "./components/bookmarks-tree";
import { Actions } from "./components/actions";
import { Settings } from "./components/settings";
import {
  checkDuplicate,
  checkInvalid,
  removeBookmarks,
  removeNodesByIds,
} from "@src/utils/bookmark";
import { useSettings } from "./hooks/use-settings";

export default function Panel(): JSX.Element {
  const [bookmarks, setBookmarks] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([]);
  const [action, setAction] = useState<ActionType>();
  const [results, setResults] = useState<
    Map<string, chrome.bookmarks.BookmarkTreeNode[] | undefined>
  >(new Map());
  const [isHandling, setIsHandling] = useState<boolean>(false);
  const [openSettings, setOpenSettings] = useState<boolean>(false);
  const [selectedFolders, setSelectedFolders] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([]);
  const [progress, setProgress] = useState<number>(0);
  const {
    useDomainForDuplicationCheck,
    setUseDomainForDuplicationCheck,
    requestTimeout,
    setRequestTimeout,
    maxRequests,
    setMaxRequests,
    loadSettings,
    saveSettings,
  } = useSettings();

  const getBookmarks = async () => {
    const res = await chrome?.bookmarks?.getTree();
    if (!res) return;
    setBookmarks(res[0].children || []);
  };

  useEffect(() => {
    getBookmarks();
    loadSettings();
  }, [loadSettings]);

  const changeAction = (action: ActionType) => {
    setAction(action);
    setResults(new Map());
    setProgress(0);
  };

  const handleDeleteForMap = async (key: string, ids: string[]) => {
    await removeBookmarks(ids);
    const updatedResults = new Map(results);
    const nodes = updatedResults.get(key);
    if (nodes) {
      ids.forEach((id) => {
        const index = nodes.findIndex((node) => node.id === id);
        if (index !== -1) {
          nodes.splice(index, 1);
        }
      });
      if (nodes.length === 0) {
        updatedResults.delete(key);
      } else {
        updatedResults.set(key, nodes);
      }
    }
    setResults(updatedResults);
    getBookmarks();
  };

  const handleDeleteFromArray = async (ids: string[]) => {
    await removeBookmarks(ids);
    const updatedBookmarks = removeNodesByIds(bookmarks, ids);
    setBookmarks(updatedBookmarks);
    getBookmarks();
  };

  const selectFolders = (folders: chrome.bookmarks.BookmarkTreeNode[]) => {
    setSelectedFolders(folders);
  };

  return (
    <div className="flex h-screen max-w-screen-2xl mx-auto p-4 gap-4">
      <Card className="overflow-y-auto w-4/12 min-w-[350px]">
        {bookmarks.map((node) => (
          <BookmarkTreeItem
            key={node.id}
            node={node}
            handleDelete={handleDeleteFromArray}
          />
        ))}
      </Card>
      <Card fullWidth className="overflow-y-auto">
        <CardHeader>
          <Actions
            checkDuplicate={() =>
              checkDuplicate(
                bookmarks,
                selectedFolders,
                useDomainForDuplicationCheck,
                setResults,
                changeAction
              )
            }
            checkInvalid={() =>
              checkInvalid(
                bookmarks,
                selectedFolders,
                requestTimeout,
                maxRequests,
                setResults,
                setProgress,
                setIsHandling,
                changeAction
              )
            }
            isHandling={isHandling}
            openSettings={() => setOpenSettings(true)}
            selectFolders={selectFolders}
            allFolders={bookmarks.reduce(
              (acc, node) => acc.concat(node, node.children || []),
              [] as chrome.bookmarks.BookmarkTreeNode[]
            )}
            selectedFolders={selectedFolders}
          />
        </CardHeader>
        <Divider />
        <CardBody>
          <ResultComponent
            data={results}
            handleDelete={handleDeleteForMap}
            progress={progress}
            action={action}
            isHandling={isHandling}
          />
        </CardBody>
      </Card>
      <Settings
        visible={openSettings}
        onClose={() => setOpenSettings(false)}
        maxRequests={maxRequests}
        setMaxRequests={setMaxRequests}
        requestTimeout={requestTimeout}
        setRequestTimeout={setRequestTimeout}
        useDomainForDuplicationCheck={useDomainForDuplicationCheck}
        setUseDomainForDuplicationCheck={setUseDomainForDuplicationCheck}
        saveSettings={saveSettings}
      />
    </div>
  );
}
