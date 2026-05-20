import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Menu,
  MessageCircle,
  Search,
} from "lucide-react";

import { AppSearchCommand } from "@/components/AppSearchCommand";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  key: string;
  label: string;
  to: string;
  exact?: boolean;
};

type PillStyle = {
  opacity: number;
  transform: string;
  width: number;
};

const utilityButtonClass =
  "h-10 w-10 rounded-full border border-border/70 bg-background/70 text-foreground/75 shadow-sm shadow-foreground/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:bg-background hover:text-foreground hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const desktopNavWidthClass: Record<string, string> = {
  process: "min-w-[7.25rem]",
  cases: "min-w-[4.75rem]",
  volunteer: "min-w-[6.25rem]",
  commitment: "min-w-[8.75rem]",
  about: "min-w-[5.75rem]",
};

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-2xl px-4 py-3 text-base font-semibold transition-all duration-200",
    isActive
      ? "bg-secondary text-secondary-foreground"
      : "text-foreground/75 hover:bg-secondary/70 hover:text-foreground",
  );

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [pillStyle, setPillStyle] = useState<PillStyle>({
    opacity: 0,
    transform: "translateX(0px)",
    width: 0,
  });
  const navRefs = useRef<Record<string, HTMLElement | null>>({});

  const navItems = useMemo<NavItem[]>(
    () => [
      { key: "process", label: t("nav.ourProcess"), to: "/our-process" },
      { key: "cases", label: t("nav.cases"), to: "/cases" },
      { key: "volunteer", label: t("nav.volunteer"), to: "/volunteer" },
      { key: "commitment", label: t("nav.ourCommitment"), to: "/commitment" },
    ],
    [t],
  );

  const activeKey = useMemo(() => {
    const path = location.pathname;

    if (["/about", "/team", "/products", "/updates"].includes(path)) {
      return "about";
    }

    return navItems.find((item) => path === item.to || path.startsWith(`${item.to}/`))?.key ?? null;
  }, [location.pathname, navItems]);

  const pillKey = hoveredKey ?? activeKey;

  useLayoutEffect(() => {
    if (!pillKey) {
      setPillStyle((current) => ({ ...current, opacity: 0 }));
      return;
    }

    const node = navRefs.current[pillKey];
    if (!node) {
      return;
    }

    setPillStyle({
      opacity: 1,
      transform: `translateX(${node.offsetLeft}px)`,
      width: node.offsetWidth,
    });
  }, [pillKey, location.pathname]);

  const setNavRef = (key: string) => (node: HTMLElement | null) => {
    navRefs.current[key] = node;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((open) => !open);
        return;
      }

      if (!isTyping && event.key === "/") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-50 w-full bg-background/82 backdrop-blur-[12px] supports-[backdrop-filter]:bg-background/72">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {t("nav.skipToContent")}
      </a>

      <div className="container mx-auto grid h-[76px] grid-cols-[1fr_auto] items-center gap-3 px-4 lg:grid-cols-[minmax(150px,1fr)_auto_minmax(310px,1fr)]">
        <Link
          to="/"
          aria-label="Jawafdehi home"
          className="flex min-w-0 items-center justify-self-start rounded-full pr-3 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <img
            src="/assets/logo.png"
            alt="Jawafdehi"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <nav
          aria-label="Primary"
          onPointerLeave={() => setHoveredKey(null)}
          className="relative hidden items-center justify-self-center rounded-full border border-border/70 bg-background/58 p-1 shadow-sm shadow-foreground/5 lg:flex"
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-1 h-10 rounded-full bg-secondary shadow-sm transition-[transform,width,opacity] duration-300 ease-out motion-reduce:transition-none"
            style={pillStyle}
          />

          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              ref={setNavRef(item.key)}
              onPointerEnter={() => setHoveredKey(item.key)}
              className={({ isActive }) =>
                cn(
                  "relative z-10 inline-flex h-10 items-center justify-center rounded-full px-3 text-center text-[13px] font-semibold text-foreground/68 transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  desktopNavWidthClass[item.key],
                  isActive && "text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}

          <DropdownMenu open={aboutOpen} onOpenChange={setAboutOpen}>
            <DropdownMenuTrigger
              ref={setNavRef("about")}
              onPointerEnter={() => setHoveredKey("about")}
              className={cn(
                "relative z-10 inline-flex h-10 items-center justify-center gap-1 rounded-full px-3 text-center text-[13px] font-semibold text-foreground/68 transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                desktopNavWidthClass.about,
                (activeKey === "about" || aboutOpen) && "text-foreground",
              )}
            >
              {t("nav.about")}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 opacity-60 transition-transform duration-200",
                  aboutOpen && "rotate-180",
                )}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="mt-3 w-48 rounded-2xl border-border/70 bg-background/95 p-2 shadow-xl shadow-foreground/10 backdrop-blur-[12px]"
            >
              <DropdownMenuItem asChild className="rounded-xl font-medium">
                <Link to="/about">{t("nav.about")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl font-medium">
                <Link to="/team">{t("nav.team")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl font-medium">
                <Link to="/products">{t("nav.products")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl font-medium">
                <Link to="/updates">{t("nav.updates")}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden min-w-[310px] items-center justify-end gap-2 justify-self-end lg:flex">
          <LanguageToggle />

          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/58 p-1 shadow-sm shadow-foreground/5">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className={utilityButtonClass}
              aria-label={t("searchCommand.open")}
              title={t("searchCommand.open")}
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>

          <Button
            asChild
            variant="primary"
            className="h-11 min-w-[9.5rem] rounded-full bg-primary px-5 text-[13px] font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors duration-200 hover:bg-primary/85"
          >
            <Link to="/cases">
              <Search className="h-4 w-4" />
              {t("header.browseCases")}
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 justify-self-end lg:hidden">
          <LanguageToggle />
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full border border-border/70 bg-background/70 text-foreground shadow-sm"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("nav.menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] border-border/70 bg-background/95 p-5 backdrop-blur-[12px] sm:w-[390px]">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-3 text-base">
                  <img
                    src="/assets/logo.png"
                    alt="Jawafdehi"
                    className="h-10 w-auto object-contain"
                  />
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-8 flex flex-col gap-2">
                <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
                  {t("nav.home")}
                </NavLink>
                {navItems.map((item) => (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    className={mobileNavLinkClass}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
                <NavLink to="/about" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
                  {t("nav.about")}
                </NavLink>
                <Link to="/team" className="rounded-2xl px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground" onClick={() => setIsOpen(false)}>
                  {t("nav.team")}
                </Link>
                <Link to="/products" className="rounded-2xl px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground" onClick={() => setIsOpen(false)}>
                  {t("nav.products")}
                </Link>
                <Link to="/updates" className="rounded-2xl px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground" onClick={() => setIsOpen(false)}>
                  {t("nav.updates")}
                </Link>
              </nav>

              <div className="mt-8 grid gap-3 rounded-[1.75rem] border border-border/70 bg-secondary/45 p-3">
                <Button
                  asChild
                  variant="primary"
                  className="h-11 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/cases">
                    <Search className="h-4 w-4" />
                    {t("header.browseCases")}
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="h-11 rounded-full font-bold" onClick={() => setIsOpen(false)}>
                  <Link to="/ask">
                    <MessageCircle className="h-4 w-4" />
                    {t("header.askJawafdehi")}
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    <AppSearchCommand open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
