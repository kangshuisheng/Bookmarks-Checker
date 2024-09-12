import Settings from "@assets/img/settings.svg";
import { Button } from "@nextui-org/button";
import { Image } from "@nextui-org/image";
import { Select, SelectItem } from "@nextui-org/select";
import { Tooltip } from "@nextui-org/tooltip";
interface ActionsProps {
  checkDuplicate: () => void;
  checkInvalid: () => void;
  isHandling?: boolean;
  openSettings: () => void;
  selectFolders: (folders: chrome.bookmarks.BookmarkTreeNode[]) => void;
  allFolders: chrome.bookmarks.BookmarkTreeNode[];
  selectedFolders: chrome.bookmarks.BookmarkTreeNode[];
}
export const Actions = (props: ActionsProps) => {
  const {
    checkDuplicate,
    checkInvalid,
    isHandling,
    openSettings,
    selectFolders,
    allFolders,
    selectedFolders,
  } = props;

  return (
    <div className="flex w-full">
      <div className="flex gap-4">
        <Button
          color="primary"
          onPress={checkDuplicate}
          isDisabled={isHandling}
          endContent={
            <Tooltip content="Check for duplicate bookmarks">
              <span>?</span>
            </Tooltip>
          }
        >
          Check Duplicate
        </Button>
        <Button
          onPress={checkInvalid}
          color="danger"
          isDisabled={isHandling}
          endContent={
            <Tooltip content="Check for invalid bookmarks">
              <span>?</span>
            </Tooltip>
          }
        >
          Check Invalid
        </Button>
        <div>
          <Select
            placeholder="Select folders"
            selectionMode="multiple"
            className="max-w-xs min-w-[200px]"
            aria-label="Select folders"
            onChange={(e) => {
              const v = e.target.value.split(",");
              const folders = allFolders.filter((folder) =>
                v.includes(folder.id)
              );
              selectFolders(folders);
            }}
            endContent={
              <Tooltip content="Select folders to check, leave empty to check all">
                <span>?</span>
              </Tooltip>
            }
          >
            {allFolders.map((folder) => (
              <SelectItem
                key={folder.id}
                value={folder.id}
                aria-selected={selectedFolders.some(
                  (selectedFolder) => selectedFolder.id === folder.id
                )}
              >
                {folder.title}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      <Button isIconOnly className="ml-auto" onPress={openSettings}>
        <Image src={Settings} alt="Settings" width={24} height={24} />
      </Button>
    </div>
  );
};
