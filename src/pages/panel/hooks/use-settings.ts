import { useState, useCallback } from "react";

export const useSettings = () => {
  const [useDomainForDuplicationCheck, setUseDomainForDuplicationCheck] =
    useState<boolean>(false);
  const [requestTimeout, setRequestTimeout] = useState<number>(15);
  const [maxRequests, setMaxRequests] = useState<number>(5);

  const loadSettings = useCallback(async () => {
    const settings = await chrome.storage.local.get([
      "useDomainForDuplicationCheck",
      "maxRequests",
      "requestTimeout",
    ]);
    setUseDomainForDuplicationCheck(
      settings.useDomainForDuplicationCheck || false
    );
    setMaxRequests(settings.maxRequests || 5);
    setRequestTimeout(settings.requestTimeout || 15);
  }, []);

  const saveSettings = useCallback(async () => {
    await chrome.storage.local.set({
      useDomainForDuplicationCheck,
      maxRequests,
      requestTimeout,
    });
  }, [useDomainForDuplicationCheck, maxRequests, requestTimeout]);

  return {
    useDomainForDuplicationCheck,
    setUseDomainForDuplicationCheck,
    requestTimeout,
    setRequestTimeout,
    maxRequests,
    setMaxRequests,
    loadSettings,
    saveSettings,
  };
};
