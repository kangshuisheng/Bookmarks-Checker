export enum ActionType {
  CHECK_DUPLICATE = "checkDuplicate",
  CHECK_INVALID = "checkInvalid",
}

export const dfs = async (
  node: chrome.bookmarks.BookmarkTreeNode,
  leafNodeCallback: (
    node: chrome.bookmarks.BookmarkTreeNode
  ) => Promise<void> | void
) => {
  if (!node.children) {
    await leafNodeCallback(node);
    return;
  }
  for (const child of node.children) {
    await dfs(child, leafNodeCallback);
  }
};
