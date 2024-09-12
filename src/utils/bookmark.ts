import axios from "axios";
import { ActionType, dfs } from "@src/utils";
import async from "async";

export const checkDuplicate = (
  bookmarks: chrome.bookmarks.BookmarkTreeNode[],
  selectedFolders: chrome.bookmarks.BookmarkTreeNode[],
  useDomainForDuplicationCheck: boolean,
  setResults: React.Dispatch<
    React.SetStateAction<
      Map<string, chrome.bookmarks.BookmarkTreeNode[] | undefined>
    >
  >,
  changeAction: (action: ActionType) => void
) => {
  if (bookmarks.length === 0) return;
  changeAction(ActionType.CHECK_DUPLICATE);
  const duplicates: Map<string, chrome.bookmarks.BookmarkTreeNode[]> =
    new Map();

  const handleLeafNode = (node: chrome.bookmarks.BookmarkTreeNode) => {
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

  if (selectedFolders.length > 0) {
    selectedFolders.forEach((folder) => {
      dfs(folder, handleLeafNode);
    });
  } else {
    bookmarks.forEach((folder) => {
      dfs(folder, handleLeafNode);
    });
  }
  const filteredDuplicates = new Map(
    Array.from(duplicates.entries()).filter(([, nodes]) => nodes.length > 1)
  );
  setResults(filteredDuplicates);
};

export const checkInvalid = async (
  bookmarks: chrome.bookmarks.BookmarkTreeNode[],
  selectedFolders: chrome.bookmarks.BookmarkTreeNode[],
  requestTimeout: number,
  maxRequests: number,
  setResults: React.Dispatch<
    React.SetStateAction<
      Map<string, chrome.bookmarks.BookmarkTreeNode[] | undefined>
    >
  >,
  setProgress: React.Dispatch<React.SetStateAction<number>>,
  setIsHandling: React.Dispatch<React.SetStateAction<boolean>>,
  changeAction: (action: ActionType) => void
) => {
  if (bookmarks.length === 0 && selectedFolders.length === 0) return;
  setIsHandling(true);
  changeAction(ActionType.CHECK_INVALID);
  const invalids = new Map<string, chrome.bookmarks.BookmarkTreeNode[]>();
  let totalBookmarks =
    selectedFolders.length > 0
      ? countBookmarks(selectedFolders)
      : countBookmarks(bookmarks);

  let processedBookmarks = 0;
  const handleLeafNode = async (node: chrome.bookmarks.BookmarkTreeNode) => {
    if (!node.url) return;
    try {
      const res = await axios.get(node.url, {
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
          status = "Request Timeout";
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
  asyncQueue.push(selectedFolders.length > 0 ? selectedFolders : bookmarks);
  asyncQueue.drain(() => {
    setIsHandling(false);
  });
};

export const removeBookmarks = async (ids: string[]) => {
  const promises = ids.map(async (id) => {
    await chrome.bookmarks.remove(id);
  });
  await Promise.all(promises);
};

export const removeNodesByIds = (
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

const countBookmarks = (node: chrome.bookmarks.BookmarkTreeNode[]): number => {
  return node.reduce((count, n) => {
    if (n.children) {
      return count + countBookmarks(n.children);
    }
    return count + 1;
  }, 0);
};
