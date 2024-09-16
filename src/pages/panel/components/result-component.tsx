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
      aria-label="progress"
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
          ? "No duplicate bookmarks found"
          : "No invalid bookmarks found";
      return (
        <div>
          <h4 className="text-lg font-bold text-center">{message}</h4>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 w-full h-full overflow-y-auto">
        {action === ActionType.CHECK_INVALID && (
          <div className="flex flex-col gap-2">
            {renderProgress()}
            <h4 className="text-lg font-bold text-center text-gray-500">
              There may be errors in the checking results, so please be careful
              when deleting.
            </h4>
          </div>
        )}
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
      return renderBookmarkList((key) => `Status: ${key}`, data);
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center text-gray-500 text-lg">
          This Extension is used to manage your bookmarks. Please select an
          action to start.
        </div>
      );
  }
};
