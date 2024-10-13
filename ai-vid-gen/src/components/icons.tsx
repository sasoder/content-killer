import {
  Bot,
  Command,
  Loader,
  Moon,
  SunMedium,
  Zap,
  TestTubeDiagonal,
  Pencil,
  Minus,
  Plus,
  MoveRight,
  Info,
  ChevronLeft,
} from "lucide-react";

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
  pencil: Pencil,
  minus: Minus,
  plus: Plus,
  moveRight: MoveRight,
  info: Info,
  chevronLeft: ChevronLeft,
};

export const Icons: IconsType = icons;
