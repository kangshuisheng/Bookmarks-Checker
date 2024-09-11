import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { Checkbox } from "@nextui-org/checkbox";
import { Input } from "@nextui-org/input";
import { Image } from "@nextui-org/image";
import WX from "@assets/img/wx.jpg";
import ZFB from "@assets/img/zfb.png";
import { Divider } from "@nextui-org/divider";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
  maxRequests: number;
  setMaxRequests: (maxRequests: number) => void;
  requestTimeout: number;
  setRequestTimeout: (requestTimeout: number) => void;
  useDomainForDuplicationCheck: boolean; //使用域名作为重复书签的判断标准
  setUseDomainForDuplicationCheck: (flag: boolean) => void;
  saveSettings: () => void;
}
export const Settings = (props: SettingsProps) => {
  const {
    visible,
    onClose,
    maxRequests,
    setMaxRequests,
    requestTimeout,
    setRequestTimeout,
    useDomainForDuplicationCheck,
    setUseDomainForDuplicationCheck,
    saveSettings,
  } = props;
  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalContent>
        <ModalHeader>设置</ModalHeader>
        <Divider />
        <ModalBody className="gap-2">
          <Card>
            <CardHeader>重复书签检查</CardHeader>
            <Divider />
            <CardBody>
              <Checkbox
                isSelected={useDomainForDuplicationCheck}
                onValueChange={(flag) => setUseDomainForDuplicationCheck(flag)}
              >
                使用域名作为重复书签的判断标准
              </Checkbox>
              <p className="text-xs text-gray-500">
                默认情况下，如果两个书签的 URL
                完全相同，我们将它们视为重复书签。如果启用此选项，我们将使用域名作为判断标准。
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>失效书签检查</CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
              <Input
                label="最大并发请求数"
                type="number"
                value={maxRequests + ""}
                min={1}
                onChange={(e) => setMaxRequests(Number(e.target.value))}
                description="最大并发请求数越大，检查速度越快，但可能会导致服务器拒绝服务"
                max={10}
              />
              <Input
                label="请求超时时间"
                type="number"
                value={requestTimeout + ""}
                min={1}
                max={30}
                onChange={(e) => setRequestTimeout(Number(e.target.value))}
                endContent="秒"
                description="如果一个请求超过此时间没有响应，我们将认为它是失效的"
              />
            </CardBody>
          </Card>
          <Button
            color="primary"
            onPress={() => {
              saveSettings(); // 保存设置
              onClose(); // 关闭设置对话框
            }}
          >
            保存设置
          </Button>
        </ModalBody>
        <Divider />
        <ModalFooter className="flex flex-col">
          <p>此工具是免费的，如果您觉得它对您有帮助，欢迎赞赏！</p>
          <div className="flex justify-around text-gray-500">
            <center>
              <Image src={WX} alt="微信赞赏码" width={125} height={125} />
              <p>微信</p>
            </center>
            <center>
              <Image src={ZFB} alt="支付宝赞赏码" width={125} height={125} />
              <p>支付宝</p>
            </center>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
