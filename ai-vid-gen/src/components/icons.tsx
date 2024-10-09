import { Bot, Command, Loader, Moon, SunMedium, Zap, TestTubeDiagonal } from "lucide-react";

export type IconKeys = keyof typeof icons;

type IconsType = {
  [key in IconKeys]: React.ElementType;
};

const icons = {
  logo: Command,
  sun: SunMedium,
  moon: Moon,
  bot: Bot,
  loader: Loader,
  zap: Zap,
  testTubeDiagonal: TestTubeDiagonal,
};

export const Icons: IconsType = icons;
