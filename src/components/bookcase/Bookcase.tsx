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

type Side = "left" | "right";

const band = (hl: number, sh: number) => ({ "--hl": hl, "--sh": sh }) as CSSProperties;

function Frieze({ title, size = "classic" }: { title: string; size?: "classic" | "antique" }) {
  return size === "classic" ? (
    <div className="crown-frieze crown-band mx-[5px] h-[24px] truncate px-2 text-[10px] sm:mx-[10px] sm:h-[42px] sm:text-[18px]">
      {title}
    </div>
  ) : (
    <div className="crown-frieze crown-band mx-[5px] h-[22px] truncate px-2 text-[10px] sm:mx-[10px] sm:h-[38px] sm:text-[17px]">
      {title}
    </div>
  );
}

function ClassicCrown({ variant, title }: { variant: Variant; title: string }) {
  const v = variant.id;
  return (
    <>
      {v === "rinascimentale" ? <div className="lunette wood-h-fill" /> : null}
      {v === "barocco" ? (
        <div className="baroque-crest" aria-hidden>
          <span className="bq-left" />
          <span className="bq-cartouche" />
          <span className="bq-right" />
        </div>
      ) : null}
      {v === "liberty" ? (
        <div className="liberty-arch" aria-hidden>
          <span className="liberty-flower" />
        </div>
      ) : null}
      <div className="crown crown-shadow">
        <div className="crown-band h-[5px] sm:h-[8px]" style={band(0.35, 0.15)} />
        <div className="crown-line" />
        {v === "liberty" ? (
          <>
            <div className="crown-band h-[7px] sm:h-[11px]" style={band(0.2, 0.35)} />
            <div className="crown-line mx-[3px] sm:mx-[6px]" />
          </>
        ) : (
          <>
            <div className="crown-band h-[9px] sm:h-[15px]" style={band(0.15, 0.4)} />
            {v === "barocco" ? (
              <div className="egg-dart mx-[3px] h-[10px] sm:mx-[6px] sm:h-[16px]" />
            ) : (
              <div className="crown-dentils mx-[3px] h-[8px] sm:mx-[6px] sm:h-[13px]" />
            )}
            {v === "rinascimentale" ? <div className="egg-dart mx-[3px] h-[7px] sm:mx-[6px] sm:h-[11px]" /> : null}
            <div className="crown-line mx-[3px] sm:mx-[6px]" />
          </>
        )}
        <Frieze title={title} />
        <div className="crown-line mx-[5px] sm:mx-[10px]" />
        <div className="crown-band mx-[6px] h-[4px] sm:mx-[12px] sm:h-[6px]" style={band(0.25, 0.2)} />
        <div className="crown-band mx-[7px] h-[5px] sm:mx-[14px] sm:h-[7px]" style={band(0.2, 0.3)} />
        <div className="crown-band mx-[8px] h-[6px] sm:mx-[16px] sm:h-[9px]" style={band(0.15, 0.45)} />
      </div>
    </>
  );
}

function ColumnBase() {
  return (
    <>
      <div className="col-ring h-[5px] w-[86%] sm:h-[8px]" />
      <div className="col-block h-[3px] w-[78%] sm:h-[4px]" />
      <div className="col-ring h-[7px] w-full sm:h-[11px]" />
      <div className="col-block h-[9px] w-[114%] sm:h-[13px]" />
    </>
  );
}

function ClassicColumn({ variant, texture, side }: { variant: Variant; texture?: string | undefined; side: Side }) {
  if (variant.id === "liberty") {
    return (
      <div className="col" data-side={side}>
        <div className="liberty-bracket" />
        <div className="liberty-tulip" />
        <div className="col-ring -mt-[1px] h-[4px] w-[60%] sm:h-[6px]" />
        <div className="col-liberty" />
        <div className="col-ring h-[5px] w-[64%] sm:h-[8px]" />
        <div className="liberty-tulip w-[70%] rotate-180" />
        <div className="col-block h-[7px] w-[96%] sm:h-[10px]" />
      </div>
    );
  }
  const shaft =
    variant.id === "barocco" ? "col-solomonic" : variant.id === "rinascimentale" ? "col-candelabra" : "col-classic-shaft";
  return (
    <div className="col" data-side={side}>
      <IonicCapital texture={texture} />
      <div className="col-ring -mt-[2px] h-[4px] w-[84%] sm:h-[6px]" />
      <div className={shaft} />
      <ColumnBase />
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
          <Frieze title={title} size="antique" />
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

function LibertyBase() {
  return (
    <div className="relative z-[8] flex-none">
      <div className="crown-line" />
      <div className="col-block h-[8px] sm:h-[12px]" />
      <div className="liberty-apron" />
    </div>
  );
}

const frameSide = "mod-frame relative z-[6] flex-none";

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
    left = <ClassicColumn variant={variant} texture={finish.texV} side="left" />;
    right = <ClassicColumn variant={variant} texture={finish.texV} side="right" />;
    base = variant.id === "barocco" ? <AntiqueBase /> : variant.id === "liberty" ? <LibertyBase /> : <ClassicBase />;
  } else if (style === "antico") {
    crown = <AntiqueCrown variant={variant} title={title} />;
    left = <AntiqueSide variant={variant} />;
    right = <AntiqueSide variant={variant} />;
    base = <AntiqueBase />;
  } else if (variant.id === "cornice") {
    crown = <div className="mod-frame crown crown-shadow h-[14px] sm:h-[22px]" />;
    left = <div className={`${frameSide} w-[12px] sm:w-[20px]`} />;
    right = <div className={`${frameSide} w-[12px] sm:w-[20px]`} />;
    base = <div className="mod-frame relative z-[8] h-[18px] flex-none sm:h-[28px]" />;
  } else if (variant.id === "minimal") {
    crown = <div className="mod-frame crown h-[6px]" />;
    left = <div className={`${frameSide} w-[5px] sm:w-[8px]`} />;
    right = <div className={`${frameSide} w-[5px] sm:w-[8px]`} />;
    base = <div className="mod-frame relative z-[8] h-[8px] flex-none" />;
  } else if (variant.id === "scandinavo") {
    crown = <div className="mod-frame crown scandi-top crown-shadow h-[12px] sm:h-[18px]" />;
    left = <div className={`${frameSide} w-[10px] sm:w-[16px]`} />;
    right = <div className={`${frameSide} w-[10px] sm:w-[16px]`} />;
    base = (
      <div className="scandi-base">
        <div className="mod-frame" />
        <div className="scandi-legs">
          <span className="mod-frame" />
          <span className="mod-frame" />
        </div>
      </div>
    );
  } else if (variant.id === "industriale") {
    crown = <div className="steel-bar" />;
    left = <div className="steel-post" />;
    right = <div className="steel-post" />;
    base = <div className="steel-bar h-[14px] sm:h-[18px]" />;
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
