import { useEffect, useState } from "react";
import { deviceClassFor, type DeviceClass } from "@/lib/bookcase/shelf";

export function useDeviceClass(): DeviceClass {
  const [device, setDevice] = useState<DeviceClass>("tablet");
  useEffect(() => {
    const update = () =>
      setDevice(deviceClassFor(window.screen.width, window.screen.height, window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return device;
}
