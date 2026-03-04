declare module "embla-carousel-react" {
  export type EmblaCarouselApi = {
    canScrollPrev: () => boolean;
    canScrollNext: () => boolean;
    scrollPrev: () => void;
    scrollNext: () => void;
    on: (
      event: "reInit" | "select",
      callback: (api: EmblaCarouselApi) => void
    ) => void;
    off: (
      event: "reInit" | "select",
      callback: (api: EmblaCarouselApi) => void
    ) => void;
  };

  export type UseEmblaCarouselType = [
    (node: HTMLDivElement | null) => void,
    EmblaCarouselApi | undefined
  ];

  export default function useEmblaCarousel(
    options?: { axis?: "x" | "y" } & Record<string, unknown>,
    plugins?: unknown[]
  ): UseEmblaCarouselType;
}
