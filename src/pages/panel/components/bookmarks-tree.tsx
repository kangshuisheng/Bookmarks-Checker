import Folder from "@assets/img/folder.svg";
import Delete from "@assets/img/delete.svg";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Image } from "@nextui-org/image";
import { Link } from "@nextui-org/link";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";

interface BookmarkProps {
  node: chrome.bookmarks.BookmarkTreeNode;
  handleDelete: (ids: string[]) => void;
}

export const BookmarkTreeItem = ({ node, handleDelete }: BookmarkProps) => {
  return (
    <Accordion
      defaultExpandedKeys={[
        node.id,
        ...(node.children || []).map((child) =>
          child.children ? child.id : ""
        ),
      ]}
      fullWidth
    >
      <AccordionItem
        key={node.id}
        title={
          <div className="flex gap-2 items-center">
            <Image src={Folder} width={30} height={30} />
            <span className="font-bold text-sm">{node.title}</span>
          </div>
        }
        textValue={node.title}
      >
        {node.children?.map((child) => {
          if (child.children) {
            return (
              <BookmarkTreeItem
                key={child.id}
                node={child}
                handleDelete={handleDelete}
              />
            );
          } else {
            return (
              <Bookmark
                key={child.id}
                node={child}
                handleDelete={handleDelete}
              />
            );
          }
        })}
      </AccordionItem>
    </Accordion>
  );
};

interface BookmarkProps {
  node: chrome.bookmarks.BookmarkTreeNode;
  handleDelete: (ids: string[]) => void;
}
export const Bookmark = (porps: BookmarkProps) => {
  const { node, handleDelete } = porps;
  return (
    <div className="flex items-center w-full gap-2 pb-4" key={node.id}>
      <Link
        href={node.url}
        className="text-xs flex flex-col justify-start w-full truncate text-start pl-6"
        target="_blank"
        rel="noreferrer"
      >
        <span className="w-full truncate">{node.title}</span>
        <Tooltip content={node.url}>
          <span className="text-gray-400 w-full truncate">{node.url}</span>
        </Tooltip>
      </Link>
      <Button isIconOnly onPress={() => handleDelete([node.id])} size="sm">
        <Image src={Delete} className=" max-w-6 max-h-6" />
      </Button>
    </div>
  );
};
