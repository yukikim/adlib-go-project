import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
};

export default function Container({ children }: ContainerProps) {
  return <div className="max-w-7xl mx-auto px-6 md:px-12">{children}</div>;
}
