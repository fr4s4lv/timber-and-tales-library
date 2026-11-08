import { forwardRef, type CSSProperties, type ReactNode } from "react";
import type { Finish, ShelfStyle, Variant } from "@/lib/bookcase/catalog";
import { finishCssVars } from "@/lib/bookcase/catalog";
import { IonicCapital } from "./IonicCapital";

interface Props {
  style: ShelfStyle;
  variant: Variant;
  finish: Finish;
  title?: string;
  children: ReactNode;
}

const band = (hl: number, sh: number) => ({ "--hl": hl, "--sh": sh }) as CSSProperties;

function ClassicCrown({ variant, title }: { variant: Variant; title: string }) {
  return (
    <>
      {variant.id === "frontone" ? <div className="pediment" /> : null}
      <div className="crown crown-shadow">
        <div className="crown-band h-[5px] sm:h-[8px]" style={band(0.35, 0.15)} />
        <div className="crown-line" />
        <div className="crown-band h-[9px] sm:h-[15px]" style={band(0.15, 0.4)} />
        <div className="crown-dentils mx-[3px] h-[8px] sm:mx-[6px] sm:h-[13px]" />
        <div className="crown-line mx-[3px] sm:mx-[6px]" />
        <div className="crown-frieze crown-band mx-[5px] h-[24px] text-[10px] sm:mx-[10px] sm:h-[42px] sm:text-[18px]">
          {title}
        </div>
        <div className="crown-line mx-[5px] sm:mx-[10px]" />
        <div className="crown-band mx-[6px] h-[4px] sm:mx-[12px] sm:h-[6px]" style={band(0.25, 0.2)} />
        <div className="crown-band mx-[7px] h-[5px] sm:mx-[14px] sm:h-[7px]" style={band(0.2, 0.3)} />
        <div className="crown-band mx-[8px] h-[6px] sm:mx-[16px] sm:h-[9px]" style={band(0.15, 0.45)} />
      </div>
    </>
  );
}

function ClassicColumn({ texture }: { texture?: string | undefined }) {
  return (
    <div className="col">
      <IonicCapital texture={texture} />
      <div className="col-ring -mt-[2px] h-[4px] w-[84%] sm:h-[6px]" />
      <div className="col-classic-shaft" />
      <div className="col-ring h-[5px] w-[86%] sm:h-[8px]" />
      <div className="col-block h-[3px] w-[78%] sm:h-[4px]" />
      <div className="col-ring h-[7px] w-full sm:h-[11px]" />
      <div className="col-block h-[9px] w-[114%] sm:h-[13px]" />
    </div>
  );
}

function AntiqueCrown({ variant, title }: { variant: Variant; title: string }) {
  return (
    <>
      {variant.id === "tortile" ? <div className="arch-crest" /> : null}
      <div className="crown crown-shadow">
        <div className="crown-band h-[6px] sm:h-[10px]" style={band(0.35, 0.15)} />
        <div className="crown-line" />
        <div className="crown-band h-[10px] sm:h-[16px]" style={band(0.15, 0.45)} />
        <div className="egg-dart mx-[3px] h-[10px] sm:mx-[6px] sm:h-[16px]" />
        <div className="crown-line mx-[3px] sm:mx-[6px]" />
        {variant.id === "biblioteca" ? (
          <div className="frieze-rosettes mx-[5px] h-[22px] sm:mx-[10px] sm:h-[38px]" />
        ) : (
          <div className="crown-frieze crown-band mx-[5px] h-[22px] text-[10px] sm:mx-[10px] sm:h-[38px] sm:text-[17px]">
            {title}
          </div>
        )}
        <div className="crown-line mx-[5px] sm:mx-[10px]" />
        <div className="crown-band mx-[6px] h-[6px] sm:mx-[12px] sm:h-[9px]" style={band(0.2, 0.45)} />
      </div>
    </>
  );
}

function AntiqueSide({ variant }: { variant: Variant }) {
  if (variant.id === "tortile") {
    return (
      <div className="col">
        <div className="finial -mt-[2px]" />
        <div className="col-ring h-[5px] w-[90%] sm:h-[8px]" />
        <div className="col-twist" />
        <div className="col-ring h-[5px] w-[90%] sm:h-[8px]" />
        <div className="finial" />
      </div>
    );
  }
  return (
    <div className="col">
      <div className="rosette" />
      <div className="col-pilaster" />
      <div className="rosette" />
    </div>
  );
}

function AntiqueBase() {
  return (
    <div className="relative z-[8] flex-none">
      <div className="crown-line" />
      <div className="crown-band h-[10px] sm:h-[16px]" style={band(0.25, 0.35)} />
      <div className="egg-dart h-[6px] sm:h-[9px]" />
      <div className="crown-band h-[8px] sm:h-[12px]" style={band(0.1, 0.55)} />
      <div className="flex justify-between px-[6px] sm:px-[12px]">
        <div className="bun-foot" />
        <div className="bun-foot" />
      </div>
    </div>
  );
}

function ClassicBase() {
  return (
    <div className="relative z-[8] flex-none">
      <div className="crown-line" />
      <div className="col-block h-[10px] sm:h-[16px]" />
      <div className="crown-band h-[6px] sm:h-[9px]" style={band(0.12, 0.6)} />
    </div>
  );
}

export const Bookcase = forwardRef<HTMLDivElement, Props>(function Bookcase(
  { style, variant, finish, title = "Librarium", children },
  interiorRef,
) {
  const vars = finishCssVars(finish) as CSSProperties;
  const gilt = variant.gilt ? "true" : "false";

  let crown: ReactNode = null;
  let left: ReactNode = null;
  let right: ReactNode = null;
  let base: ReactNode = null;

  if (style === "classico") {
    crown = <ClassicCrown variant={variant} title={title} />;
    left = <ClassicColumn texture={finish.texV} />;
    right = <ClassicColumn texture={finish.texV} />;
    base = <ClassicBase />;
  } else if (style === "antico") {
    crown = <AntiqueCrown variant={variant} title={title} />;
    left = <AntiqueSide variant={variant} />;
    right = <AntiqueSide variant={variant} />;
    base = <AntiqueBase />;
  } else if (variant.id === "cornice") {
    crown = <div className="mod-frame crown crown-shadow h-[14px] sm:h-[22px]" />;
    left = <div className="mod-frame relative z-[6] w-[12px] flex-none sm:w-[20px]" />;
    right = <div className="mod-frame relative z-[6] w-[12px] flex-none sm:w-[20px]" />;
    base = <div className="mod-frame relative z-[8] h-[18px] flex-none sm:h-[28px]" />;
  } else if (variant.id === "minimal") {
    crown = <div className="mod-frame crown h-[6px]" />;
    left = <div className="mod-frame relative z-[6] w-[5px] flex-none sm:w-[8px]" />;
    right = <div className="mod-frame relative z-[6] w-[5px] flex-none sm:w-[8px]" />;
    base = <div className="mod-frame relative z-[8] h-[8px] flex-none" />;
  }

  return (
    <div
      className="bookcase"
      data-style={style}
      data-variant={variant.id}
      data-tone={finish.tone}
      data-gilt={gilt}
      style={vars}
    >
      {crown}
      <div className="bc-body">
        {left}
        <div className="relative min-w-0 flex-1">
          <div ref={interiorRef} className="bc-interior absolute inset-0">
            {children}
          </div>
          <div className="bc-interior-shadow" />
        </div>
        {right}
      </div>
      {base}
    </div>
  );
});
