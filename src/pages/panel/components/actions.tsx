import Settings from "@assets/img/settings.svg";
import { Button } from "@nextui-org/button";
import { Image } from "@nextui-org/image";
import { Tooltip } from "@nextui-org/tooltip";
interface ActionsProps {
  checkDuplicate: () => void;
  checkInvalid: () => void;
  isHandling?: boolean;
  openSettings: () => void;
}
export const Actions = (props: ActionsProps) => {
  const { checkDuplicate, checkInvalid, isHandling, openSettings } = props;

  return (
    <div className="flex items-center w-full">
      <div className="flex gap-4">
        <Button
          color="primary"
          onPress={checkDuplicate}
          isDisabled={isHandling}
          endContent={
            <Tooltip content="检查收藏夹中是否存在重复的书签">
              <span>?</span>
            </Tooltip>
          }
        >
          检查重复书签
        </Button>
        <Button
          onPress={checkInvalid}
          color="danger"
          isDisabled={isHandling}
          endContent={
            <Tooltip content="检查收藏夹中是否存在无法访问的书签">
              <span>?</span>
            </Tooltip>
          }
        >
          检查失效书签
        </Button>
      </div>
      <Button isIconOnly className="ml-auto" onPress={openSettings}>
        <Image src={Settings} alt="设置" width={24} height={24} />
      </Button>
    </div>
  );
};
