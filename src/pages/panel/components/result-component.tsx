import { Progress } from "@nextui-org/progress";
import { Bookmark } from "./bookmarks-tree";
import { ActionType } from "@src/utils";
import { Spacer } from "@nextui-org/spacer";

interface ResultProps {
  data: Map<string, chrome.bookmarks.BookmarkTreeNode[] | undefined>;
  handleDelete: (key: string, ids: string[]) => void;
  progress: number;
  action?: string;
  isHandling: boolean;
}

export const ResultComponent = ({
  data,
  handleDelete,
  progress,
  action,
  isHandling,
}: ResultProps) => {
  const renderBookmarkNode = (
    key: string,
    node: chrome.bookmarks.BookmarkTreeNode
  ) => (
    <Bookmark
      key={node.id}
      node={node}
      handleDelete={(ids: string[]) => handleDelete(key, ids)}
    />
  );

  const renderProgress = () => (
    <Progress
      value={progress}
      showValueLabel
      aria-label="检查进度"
      color="success"
    />
  );

  const renderBookmarkList = (
    label: (key: string) => string,
    data: Map<string, chrome.bookmarks.BookmarkTreeNode[] | undefined>
  ) => {
    if (!data.size && !isHandling) {
      const message =
        action === ActionType.CHECK_DUPLICATE
          ? "没有找到重复书签"
          : "没有找到无效书签";
      return (
        <div>
          <h4 className="text-lg font-bold text-center">{message}</h4>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 w-full truncate">
        {action === ActionType.CHECK_INVALID && renderProgress()}
        {Array.from(data.entries()).map(([key, nodes]) => (
          <div key={key}>
            <h4 className="text-lg font-bold text-danger-500">{label(key)}</h4>
            <Spacer y={2} />
            {nodes?.map((node) => renderBookmarkNode(key, node))}
          </div>
        ))}
      </div>
    );
  };

  switch (action) {
    case ActionType.CHECK_DUPLICATE:
      return renderBookmarkList((key) => `URL: ${key}`, data);
    case ActionType.CHECK_INVALID:
      return renderBookmarkList((key) => `状态码: ${key}`, data);
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center text-gray-500">
          <p className="text-sm">
            此插件提供了检查重复书签和失效书签的功能，您可以通过点击上方的按钮来使用。
          </p>
        </div>
      );
  }
};
