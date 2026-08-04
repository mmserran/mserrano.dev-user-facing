"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { mdiEmailEdit } from "@mdi/js";
import type { IconBaseProps, IconType } from "react-icons";
import { MdAssignment, MdDashboard, MdLink, MdMenu } from "react-icons/md";
import { HEADER_LINK_ICONS, type HeaderLink, type Project } from "@/lib/content";
import StarField from "@/components/illustration/StarField";

const DESKTOP_BREAKPOINT = "(min-width: 1264px)";

function subscribeToDesktopBreakpoint(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_BREAKPOINT);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getIsDesktop() {
  return window.matchMedia(DESKTOP_BREAKPOINT).matches;
}

function getIsDesktopServerSnapshot() {
  return false;
}

// Mirrors the drawer's CSS cascade: forced open/closed wins; otherwise the
// min-[1264px] default.
function getDrawerOpenState(manualOpen: boolean | null, isDesktop: boolean) {
  if (manualOpen !== null) return manualOpen;
  return isDesktop;
}

// Same cascade as the drawer transform classes, evaluated against live DOM +
// matchMedia so a first toggle never flips the wrong way from a stale SSR snapshot.
function getIsDrawerCascadeOpen(drawer: HTMLElement | null) {
  const forced = drawer?.getAttribute("data-forced");
  if (forced === "open") return true;
  if (forced === "closed") return false;
  return window.matchMedia(DESKTOP_BREAKPOINT).matches;
}

function EmailEditIcon(props: IconBaseProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d={mdiEmailEdit} />
    </svg>
  );
}

const SITE_LINKS: { href: string; label: string; Icon: IconType }[] = [
  { href: "/contact/", label: "Contact", Icon: EmailEditIcon },
  { href: "/resume/", label: "Resume", Icon: MdAssignment },
  { href: "/projects/", label: "Portfolio", Icon: MdDashboard },
];

// Visual open/closed cascade mirrored for pointer-events and visibility so the
// drawer stays first-paint-safe for hit-testing and AT even when JS attrs lag.
const DRAWER_VISUAL_CLASS =
  "shadow-nav-drawer bg-nav-sidebar fixed top-16 left-0 z-40 h-[calc(100dvh-6.25rem)] w-64 -translate-x-full overflow-y-auto overscroll-y-contain pb-[max(1rem,env(safe-area-inset-bottom))] transition-transform duration-200 motion-reduce:transition-none " +
  "pointer-events-none invisible " +
  "min-[1264px]:translate-x-0 min-[1264px]:shadow-none min-[1264px]:pointer-events-auto min-[1264px]:visible " +
  "data-[forced=closed]:!-translate-x-full data-[forced=closed]:!pointer-events-none data-[forced=closed]:!invisible " +
  "data-[forced=open]:!translate-x-0 data-[forced=open]:!pointer-events-auto data-[forced=open]:!visible";

export default function AppShell({
  headerLinks,
  projects = [],
  children,
}: {
  headerLinks: HeaderLink[];
  projects?: Project[];
  children: ReactNode;
}) {
  // Tracks the viewport breakpoint via the browser's matchMedia change event -
  // useSyncExternalStore keeps the SSR pass and first client render in sync
  // (both see `false`) so there's no hydration mismatch.
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopBreakpoint,
    getIsDesktop,
    getIsDesktopServerSnapshot,
  );
  // null means "no manual choice yet" - the drawer follows the breakpoint
  // (open on desktop, closed on mobile) until the user explicitly toggles it,
  // after which their choice sticks regardless of further resizing.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  // Server snapshot and first hydrated render always report isDesktop=false.
  // Until the client layout pass runs, treat media-default a11y as open so a
  // CSS-open desktop drawer is never inert / aria-hidden / labeled "Open".
  // After layout, attributes track the real cascade (forced or matchMedia).
  const [mediaReady, setMediaReady] = useState(false);
  const isOpen = getDrawerOpenState(manualOpen, isDesktop);
  const isInteractiveOpen =
    manualOpen !== null ? manualOpen : mediaReady ? isDesktop : true;
  // Drives the CSS override below - undefined leaves the drawer's default,
  // media-query-only open/closed state (see className) alone so a desktop
  // visitor sees it open on the very first paint, with no JS/hydration wait.
  const forcedState = manualOpen === null ? undefined : manualOpen ? "open" : "closed";

  const pathname = usePathname();
  const activePath = pathname.replace(/\/+$/, "") || "/";
  const isProjectDetailRoute = activePath.startsWith("/projects/") && activePath !== "/projects";
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    setMediaReady(true);
  }, []);

  useEffect(() => {
    if (!isInteractiveOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setManualOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isInteractiveOpen]);

  function handleMenuToggle() {
    setManualOpen(!getIsDrawerCascadeOpen(drawerRef.current));
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded focus-visible:bg-white focus-visible:px-4 focus-visible:py-2 focus-visible:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue"
      >
        Skip to content
      </a>

      <header className="shadow-app-bar border-b-8 border-brand-yellow bg-brand-blue sticky top-0 z-50 flex h-16 items-center justify-between px-1 text-white">
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={isInteractiveOpen}
          aria-controls="site-drawer"
          aria-label={isInteractiveOpen ? "Close navigation" : "Open navigation"}
          onClick={handleMenuToggle}
          className="flex size-12 items-center justify-center rounded-full text-2xl transition-colors hover:cursor-pointer hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <MdMenu aria-hidden="true" />
        </button>

        <ul className="flex items-center">
          {headerLinks.map((link) => {
            const Icon = HEADER_LINK_ICONS[link.title] ?? MdLink;
            const isExternal = !link.url.startsWith("/");
            const href = isExternal || link.url.endsWith("/") ? link.url : `${link.url}/`;
            return (
              <li key={link.id}>
                <a
                  href={href}
                  {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  title={link.title}
                  aria-label={isExternal ? `${link.title} (opens in a new tab)` : link.title}
                  className="flex h-9 min-w-16 items-center justify-center rounded text-2xl hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <Icon aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>
      </header>

      {isOpen && (
        <div
          aria-hidden="true"
          onClick={() => setManualOpen(false)}
          className="fixed top-16 right-0 bottom-0 left-0 z-30 bg-black/40 min-[1264px]:hidden"
        />
      )}

      <nav
        id="site-drawer"
        ref={drawerRef}
        aria-label="Primary"
        aria-hidden={!isInteractiveOpen}
        inert={!isInteractiveOpen}
        data-forced={forcedState}
        className={DRAWER_VISUAL_CLASS}
      >
        <Link href="/" className="flex h-[97px] flex-col justify-center border-b border-black/10 px-4">
          <span className="block whitespace-nowrap text-[19px] leading-6 font-medium text-black">
            Mark Anthony Serrano
          </span>
          <span className="block text-sm leading-[1.2] text-black/60">Software Engineer</span>
        </Link>
        <ul className="py-2">
          {SITE_LINKS.map(({ href, label, Icon }) => {
            const isActiveSection =
              href === "/projects/"
                ? activePath === "/projects" || activePath.startsWith("/projects/")
                : activePath === href.replace(/\/+$/, "");
            const isCurrentPage =
              activePath === href.replace(/\/+$/, "");
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isCurrentPage ? "page" : undefined}
                  className={`relative mx-2 flex h-14 items-center justify-end gap-3 pl-2 text-right leading-[1.2] transition-colors ${
                    isActiveSection
                      ? "pr-8 text-brand-blue font-semibold after:absolute after:right-4 after:top-1/2 after:h-5 after:w-1 after:-translate-y-1/2 after:bg-brand-yellow"
                      : "pr-4 text-black/80 hover:bg-black/5"
                  }`}
                >
                  <span>{label}</span>
                  <Icon
                    aria-hidden="true"
                    className={`shrink-0 text-[22px] text-black/55 ${
                      isActiveSection ? "" : label === "Resume" ? "translate-x-[3px]" : "translate-x-0.5"
                    }`}
                  />
                </Link>
                {href === "/projects/" && isProjectDetailRoute && projects.length > 0 && (
                  <ul className="py-1 text-right" aria-label="Projects">
                    {projects.map((project) => {
                      const isProjectActive = activePath === `/projects/${project.slug}`;
                      return (
                        <li key={project.slug}>
                          <Link
                            href={`/projects/${project.slug}/`}
                            aria-current={isProjectActive ? "page" : undefined}
                            className={`relative block py-1.5 pr-6 pl-2 text-xs leading-tight transition-colors ${
                              isProjectActive
                                ? "text-brand-blue font-semibold pr-10 after:absolute after:right-6 after:top-1/2 after:h-5 after:w-1 after:-translate-y-1/2 after:bg-brand-yellow"
                                : "text-black/80 hover:bg-black/5 hover:text-black"
                            }`}
                          >
                            {project.general.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        id="main-content"
        data-forced={forcedState}
        className="relative isolate flex flex-1 flex-col bg-[radial-gradient(ellipse_at_bottom,#1b2735_0%,#090a0f_100%)] transition-[padding] duration-200 motion-reduce:transition-none min-[1264px]:pl-64 data-[forced=closed]:min-[1264px]:!pl-0"
      >
        <StarField />
        {children}
      </div>
    </>
  );
}
