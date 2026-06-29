"use client";

import Image from "next/image";
import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type TouchEvent,
  type WheelEvent,
} from "react";

import { contactLinks, films, platformLinks } from "@/data/films";
import { withBasePath } from "@/lib/assets";
import type { Film } from "@/types/film";

import styles from "./portfolio-scene.module.css";

const MOBILE_BREAKPOINT = 640;
const DESKTOP_RANGE = 4;
const MOBILE_RANGE = 2;

const DESKTOP_GEOMETRY = {
  range: DESKTOP_RANGE,
  spineWidth: 2.8,
  spineHeight: 18.2,
  gap: 1.9,
  silhouetteWidth: 15.2,
  activeWidth: 12.1,
  activeHeight: 17.2,
  sceneHeight: 19.2,
  sceneBottom: 8.4,
};

const MOBILE_GEOMETRY = {
  range: MOBILE_RANGE,
  spineWidth: 2.15,
  spineHeight: 13.2,
  gap: 1.2,
  silhouetteWidth: 13.8,
  activeWidth: 10.8,
  activeHeight: 15.4,
  sceneHeight: 16.6,
  sceneBottom: 8.7,
};

function normalizeIndex(index: number, length: number) {
  return (index + length) % length;
}

function getShortestOffset(index: number, activeIndex: number, length: number) {
  const raw = index - activeIndex;
  const wrapped = raw > 0 ? raw - length : raw + length;

  return Math.abs(raw) <= Math.abs(wrapped) ? raw : wrapped;
}

function getSpineStyle(index: number) {
  const palettes = [
    "linear-gradient(180deg, #3154ab, #10204a 70%, #6c8ef8)",
    "linear-gradient(180deg, #3c3a3a, #101111 60%, #8a2424)",
    "linear-gradient(180deg, #c7b489, #6f5331 56%, #fff1cb)",
    "linear-gradient(180deg, #0d291f, #091010 55%, #4db38e)",
    "linear-gradient(180deg, #3e435f, #111318 60%, #9a6f23)",
  ];

  return {
    ["--spine-gradient" as string]: palettes[index % palettes.length],
  };
}

function SpineFace({ film, index }: { film: Film; index: number }) {
  if (film.spineSrc) {
    return (
      <div className={styles.spineOnly}>
        <Image
          className={styles.spineImage}
          src={film.spineSrc}
          alt={`Корешок ${film.title}`}
          fill
          sizes="(max-width: 640px) 2.15rem, 2.8rem"
        />
      </div>
    );
  }

  return (
    <div className={styles.spineOnly} style={getSpineStyle(index)}>
      <span className={styles.spineLabel}>{film.spineLabel}</span>
    </div>
  );
}

function changeIndex(current: number, delta: number) {
  return normalizeIndex(current + delta, films.length);
}

function getGeometry(isMobile: boolean) {
  return isMobile ? MOBILE_GEOMETRY : DESKTOP_GEOMETRY;
}

function getSceneWidth(range: number, silhouetteWidth: number, spineWidth: number, gap: number) {
  return silhouetteWidth + 2 * (gap + range * spineWidth + (range - 1) * gap);
}

function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.navGroup} aria-label="Контакты">
        <a className={styles.navLink} href={contactLinks.email}>
          ПОЧТА
        </a>
        <a
          className={styles.navLink}
          href={contactLinks.telegram}
          target="_blank"
          rel="noreferrer noopener"
        >
          ТЕЛЕГРАМ
        </a>
      </nav>

      <div className={styles.brand}>
        <span className={styles.brandName}>SERGEY KLEIN</span>
      </div>

      <nav className={styles.navGroup} data-align="right" aria-label="Площадки фильма">
        <a
          className={styles.navLink}
          href={platformLinks.kinopoisk}
          target="_blank"
          rel="noreferrer noopener"
        >
          КИНОПОИСК
        </a>
        <a
          className={styles.navLink}
          href={platformLinks.vimeo}
          target="_blank"
          rel="noreferrer noopener"
        >
          ВИМЕО
        </a>
      </nav>
    </header>
  );
}

function FilmMeta({
  film,
  onPrevious,
  onNext,
}: {
  film: Film;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className={styles.metaBlock}>
      <div className={styles.titleRow}>
        <button
          type="button"
          className={styles.titleArrow}
          aria-label="Предыдущая кассета"
          onClick={onPrevious}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h1 className={styles.title}>{film.title.toUpperCase()}</h1>
        <button
          type="button"
          className={styles.titleArrow}
          aria-label="Следующая кассета"
          onClick={onNext}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <p className={styles.production}>{film.productionLine}</p>
      <p className={styles.year}>{film.year}</p>
    </div>
  );
}

export function PortfolioScene() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [shelfScale, setShelfScale] = useState(1);
  const [transitionDirection, setTransitionDirection] = useState<-1 | 0 | 1>(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null);
  const wheelLockRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const transitionResetRef = useRef<number | null>(null);
  const pulseResetRef = useRef<number | null>(null);

  const geometry = getGeometry(isMobile);
  const activeFilm = films[activeIndex];

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    const syncLayout = () => {
      setIsMobile(mediaQuery.matches);
    };

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncLayout);
    };
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const scene = sceneRef.current;

    if (!viewport || !scene) {
      return;
    }

    const updateScale = () => {
      const widthScale = (viewport.clientWidth - 24) / scene.offsetWidth;
      const heightScale = (viewport.clientHeight - 16) / scene.offsetHeight;
      setShelfScale(Math.min(1, widthScale, heightScale));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(viewport);
    resizeObserver.observe(scene);
    window.addEventListener("resize", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [activeIndex, isMobile]);

  useEffect(() => {
    return () => {
      if (transitionResetRef.current !== null) {
        window.clearTimeout(transitionResetRef.current);
      }

      if (pulseResetRef.current !== null) {
        window.clearTimeout(pulseResetRef.current);
      }
    };
  }, []);

  const updateIndex = (delta: number) => {
    const nextIndex = changeIndex(activeIndex, delta);
    const direction = delta > 0 ? 1 : -1;
    setPulsingIndex(nextIndex);
    setTransitionDirection(direction);
    setTransitionKey((current) => current + 1);

    if (transitionResetRef.current !== null) {
      window.clearTimeout(transitionResetRef.current);
    }

    transitionResetRef.current = window.setTimeout(() => {
      setTransitionDirection(0);
      transitionResetRef.current = null;
    }, 480);

    if (pulseResetRef.current !== null) {
      window.clearTimeout(pulseResetRef.current);
    }

    pulseResetRef.current = window.setTimeout(() => {
      setPulsingIndex(null);
      pulseResetRef.current = null;
    }, 300);

    startTransition(() => {
      setActiveIndex((current) => changeIndex(current, delta));
    });
  };

  const openFilm = (film: Film) => {
    if (!film.filmUrl) {
      return;
    }

    window.open(film.filmUrl, "_blank", "noopener,noreferrer");
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (wheelLockRef.current) {
      return;
    }

    const axis = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

    if (Math.abs(axis) < 12) {
      return;
    }

    wheelLockRef.current = true;
    updateIndex(axis > 0 ? 1 : -1);

    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 430);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      updateIndex(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateIndex(-1);
    }

    if ((event.key === "Enter" || event.key === " ") && activeFilm.filmUrl) {
      event.preventDefault();
      openFilm(activeFilm);
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;

    if (startX === null || endX === undefined) {
      return;
    }

    const delta = endX - startX;

    if (Math.abs(delta) < 35) {
      return;
    }

    updateIndex(delta < 0 ? 1 : -1);
  };

  const visibleFilms = films
    .map((film, index) => ({
      film,
      index,
      offset: getShortestOffset(index, activeIndex, films.length),
    }))
    .filter((item) => Math.abs(item.offset) <= geometry.range);

  const leftFilms = visibleFilms
    .filter((item) => item.offset < 0)
    .sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));

  const rightFilms = visibleFilms
    .filter((item) => item.offset > 0)
    .sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));

  const activeTapeClassName = useMemo(() => {
    if (transitionDirection < 0) {
      return `${styles.activeTape} ${styles.activeTapeFromLeft}`;
    }

    if (transitionDirection > 0) {
      return `${styles.activeTape} ${styles.activeTapeFromRight}`;
    }

    return styles.activeTape;
  }, [transitionDirection]);

  const sceneWidth = getSceneWidth(
    geometry.range,
    geometry.silhouetteWidth,
    geometry.spineWidth,
    geometry.gap,
  );

  const sceneStyle = {
    ["--scene-width" as string]: `${sceneWidth}rem`,
    ["--scene-height" as string]: `${geometry.sceneHeight}rem`,
    ["--scene-bottom" as string]: `${geometry.sceneBottom}rem`,
    ["--silhouette-width" as string]: `${geometry.silhouetteWidth}rem`,
    ["--active-width" as string]: `${geometry.activeWidth}rem`,
    ["--active-height" as string]: `${geometry.activeHeight}rem`,
    ["--spine-width" as string]: `${geometry.spineWidth}rem`,
    ["--spine-height" as string]: `${geometry.spineHeight}rem`,
    ["--spine-gap" as string]: `${geometry.gap}rem`,
  } as CSSProperties;

  return (
    <main className={styles.page}>
      <section className={styles.stage}>
        <div className={styles.frame}>
          <Header />

          <div className={styles.shelfWrap}>
            <div
              ref={viewportRef}
              className={styles.shelfViewport}
              tabIndex={0}
              aria-label="Карусель документальных фильмов"
              onKeyDown={handleKeyDown}
              onTouchEnd={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onWheel={handleWheel}
            >
              <div
                className={styles.shelfScale}
                style={{ ...sceneStyle, transform: `translateX(-50%) scale(${shelfScale})` }}
              >
                <div ref={sceneRef} className={styles.shelfScene}>
                  {leftFilms.map(({ film, index, offset }, slotIndex) => (
                    <button
                      key={film.id}
                      type="button"
                      className={`${styles.spineButton} ${styles.leftSpine} ${pulsingIndex === index ? styles.spinePulse : ""}`.trim()}
                      style={
                        {
                          ["--slot-index" as string]: slotIndex,
                          ["--slot-direction" as string]: -1,
                          ...getSpineStyle(index),
                        } as CSSProperties
                      }
                      aria-label={`Показать фильм ${film.title}`}
                      onClick={() => {
                        updateIndex(offset);
                      }}
                    >
                      <SpineFace film={film} index={index} />
                    </button>
                  ))}

                  <button
                    type="button"
                    className={`${styles.tapeButton} ${styles.activeButton}`.trim()}
                    aria-label={`Открыть фильм ${activeFilm.title}`}
                    onClick={() => {
                      openFilm(activeFilm);
                    }}
                  >
                    <div className={styles.activeSilhouette}>
                      <div key={transitionKey} className={activeTapeClassName}>
                        <div className={styles.caseBody} aria-hidden="true">
                          <Image
                            className={styles.caseTexture}
                            src={withBasePath("/textures/vhs.png")}
                            alt=""
                            fill
                            priority
                            sizes="(max-width: 640px) 48vw, 14rem"
                          />
                        </div>
                        <div className={styles.posterCard}>
                          <Image
                            className={styles.posterImage}
                            src={activeFilm.posterSrc}
                            alt={`Постер фильма ${activeFilm.title}`}
                            fill
                            priority
                            sizes="(max-width: 640px) 48vw, 14rem"
                          />
                        </div>
                      </div>
                    </div>
                  </button>

                  {rightFilms.map(({ film, index, offset }, slotIndex) => (
                    <button
                      key={film.id}
                      type="button"
                      className={`${styles.spineButton} ${styles.rightSpine} ${pulsingIndex === index ? styles.spinePulse : ""}`.trim()}
                      style={
                        {
                          ["--slot-index" as string]: slotIndex,
                          ["--slot-direction" as string]: 1,
                          ...getSpineStyle(index),
                        } as CSSProperties
                      }
                      aria-label={`Показать фильм ${film.title}`}
                      onClick={() => {
                        updateIndex(offset);
                      }}
                    >
                      <SpineFace film={film} index={index} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <footer className={styles.footerRow}>
              <FilmMeta
                film={activeFilm}
                onPrevious={() => updateIndex(-1)}
                onNext={() => updateIndex(1)}
              />
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
