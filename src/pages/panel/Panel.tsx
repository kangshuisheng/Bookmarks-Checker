import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import axios from "axios";
import { ActionType, dfs } from "@src/utils";
import { ResultComponent } from "./components/result-component";
import { BookmarkTreeItem } from "./components/bookmarks-tree";
import { Actions } from "./components/actions";
import { Settings } from "./components/settings";
import async from "async";
import { Divider } from "@nextui-org/divider";

export default function Panel(): JSX.Element {
  const [bookmarks, setBookmarks] = React.useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([]);

  const [action, setAction] = useState<ActionType>();

  const [results, setResults] = useState<
    Map<string, chrome.bookmarks.BookmarkTreeNode[] | undefined>
  >(new Map());

  const [isHandling, setIsHandling] = useState<boolean>(false);

  const [openSettings, setOpenSettings] = useState<boolean>(false);

  // 重复书签检查
  const [useDomainForDuplicationCheck, setUseDomainForDuplicationCheck] =
    useState<boolean>(false);

  // 失效书签检查
  const [requestTimeout, setRequestTimeout] = useState<number>(10);
  const [maxRequests, setMaxRequests] = useState<number>(5);
  const [progress, setProgress] = useState<number>(0);

  const getBookmarks = async () => {
    const res = await chrome?.bookmarks?.getTree();
    if (!res) return;
    setBookmarks(res[0].children || []);
  };

  const loadSettings = async () => {
    const settings = await chrome.storage.local.get([
      "useDomainForDuplicationCheck",
      "maxRequests",
      "requestTimeout",
    ]);
    setUseDomainForDuplicationCheck(
      settings.useDomainForDuplicationCheck || false
    );
    setMaxRequests(settings.maxRequests || 4);
    setRequestTimeout(settings.requestTimeout || 10);
  };

  const saveSettings = async () => {
    await chrome.storage.local.set({
      useDomainForDuplicationCheck,
      maxRequests,
      requestTimeout,
    });
  };

  useEffect(() => {
    getBookmarks();
    loadSettings();
  }, []);

  const changeAction = (action: ActionType) => {
    setAction(action);
    setResults(new Map());
    setProgress(0);
  };

  const checkDuplicate = async () => {
    if (bookmarks.length === 0 || isHandling) return;
    changeAction(ActionType.CHECK_DUPLICATE);
    const duplicates: Map<string, chrome.bookmarks.BookmarkTreeNode[]> =
      new Map();

    const handleLeafNode = async (node: chrome.bookmarks.BookmarkTreeNode) => {
      if (!node.url) return;
      if (useDomainForDuplicationCheck) {
        const domain = new URL(node.url).hostname;
        const nodes = duplicates.get(domain);
        if (nodes) {
          nodes.push(node);
        } else {
          duplicates.set(domain, [node]);
        }
      } else {
        const url = node.url;
        const nodes = duplicates.get(url);
        if (nodes) {
          nodes.push(node);
        } else {
          duplicates.set(url, [node]);
        }
      }
    };

    const promises = bookmarks.map((node) => dfs(node, handleLeafNode));
    await Promise.all(promises);
    const filteredDuplicates = new Map(
      Array.from(duplicates.entries()).filter(([, nodes]) => nodes.length > 1)
    );
    setResults(filteredDuplicates);
  };

  const countBookmarks = (node: chrome.bookmarks.BookmarkTreeNode): number => {
    if (!node.children) return 1;
    return node.children.reduce(
      (count, child) => count + countBookmarks(child),
      0
    );
  };

  const checkInvalid = async () => {
    if (bookmarks.length === 0 || isHandling) return;
    setIsHandling(true);
    changeAction(ActionType.CHECK_INVALID);
    const invalids = new Map<string, chrome.bookmarks.BookmarkTreeNode[]>();
    const totalBookmarks = bookmarks.reduce(
      (count, node) => count + countBookmarks(node),
      0
    );
    let processedBookmarks = 0;
    const handleLeafNode = async (node: chrome.bookmarks.BookmarkTreeNode) => {
      if (!node.url) return;
      try {
        const res = await axios.head(node.url, {
          timeout: requestTimeout * 1000,
        });
        if (!res.status.toString().startsWith("2")) {
          const nodes = invalids.get(res.status.toString());
          if (nodes) {
            nodes.push(node);
          } else {
            invalids.set(res.status.toString(), [node]);
          }
          setResults(new Map(invalids)); // 实时更新状态
        }
      } catch (error: unknown) {
        let status = "Unknown";
        if (axios.isAxiosError(error)) {
          if (error.response) {
            status = error.response.status.toString();
          } else if (error.request) {
            status = "无响应";
          } else {
            status = error.message;
          }
        } else if (error instanceof Error) {
          status = error.message;
        }
        const nodes = invalids.get(status);
        if (nodes) {
          nodes.push(node);
        } else {
          invalids.set(status, [node]);
        }
        setResults(new Map(invalids)); // 实时更新状态
      } finally {
        setProgress((++processedBookmarks / totalBookmarks) * 100);
      }
    };

    const asyncQueue = async.queue(
      async (node: chrome.bookmarks.BookmarkTreeNode) => {
        await dfs(node, handleLeafNode);
      },
      maxRequests
    );
    asyncQueue.push(bookmarks);
    asyncQueue.drain(() => {
      setIsHandling(false);
    });
  };

  const removeBookmarks = async (ids: string[]) => {
    const promises = ids.map(async (id) => {
      await chrome.bookmarks.remove(id);
    });
    await Promise.all(promises);
  };

  const handleDeleteForMap = async (key: string, ids: string[]) => {
    await removeBookmarks(ids);
    // 更新 results 状态
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
  };

  const removeNodesByIds = (
    nodes: chrome.bookmarks.BookmarkTreeNode[],
    ids: string[]
  ): chrome.bookmarks.BookmarkTreeNode[] => {
    return nodes
      .map((node) => {
        if (node.children) {
          node.children = removeNodesByIds(node.children, ids);
        }
        return node;
      })
      .filter((node) => !ids.includes(node.id));
  };

  const handleDeleteFromArray = async (ids: string[]) => {
    await removeBookmarks(ids);
    // 更新 bookmarks 状态
    const updatedBookmarks = removeNodesByIds(bookmarks, ids);
    setBookmarks(updatedBookmarks);
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
      <Card fullWidth>
        <CardHeader>
          <Actions
            checkDuplicate={checkDuplicate}
            checkInvalid={checkInvalid}
            isHandling={isHandling}
            openSettings={() => setOpenSettings(true)}
          />
        </CardHeader>
        <Divider />
        <CardBody>
          <div>
            <ResultComponent
              data={results}
              handleDelete={handleDeleteForMap}
              progress={progress}
              action={action}
              isHandling={isHandling}
            />
          </div>
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
