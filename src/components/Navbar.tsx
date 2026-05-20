import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, Menu, MessageCircle } from "lucide-react";

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
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-[13px] font-semibold transition-colors ${
    isActive ? "text-primary" : "text-foreground/70 hover:text-foreground"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-base font-semibold transition-colors py-2 ${
    isActive ? "text-primary" : "text-foreground hover:text-primary"
  }`;

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isAboutActive = ["/about", "/team", "/products", "/updates"].includes(location.pathname);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/88 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {t("nav.skipToContent")}
      </a>

      <div className="container mx-auto flex h-[72px] items-center justify-between px-4 py-2">
        <Link
          to="/"
          aria-label="Jawafdehi home"
          className="hidden items-center xl:flex"
        >
          <img
            src="/assets/logo.png"
            alt="Jawafdehi"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <NavLink to="/our-process" className={navLinkClass}>
            {t("nav.ourProcess")}
          </NavLink>
          <NavLink to="/volunteer" className={navLinkClass}>
            {t("nav.volunteer")}
          </NavLink>
          <NavLink to="/commitment" className={navLinkClass}>
            {t("nav.ourCommitment")}
          </NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={`inline-flex items-center gap-1 rounded-sm py-1 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isAboutActive ? "text-primary" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {t("nav.about")}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem asChild>
                <Link to="/about">{t("nav.about")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/team">{t("nav.team")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/products">{t("nav.products")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/updates">{t("nav.updates")}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <div className="[&_button]:h-8 [&_button]:rounded-[3px]">
            <LanguageToggle />
          </div>
          <div className="[&_button]:h-8 [&_button]:w-8 [&_button]:rounded-[3px]">
            <ThemeToggle />
          </div>
          <Button
            asChild
            variant="primary"
            className="h-9 rounded-[3px] px-4 text-[13px] font-semibold"
          >
            <Link to="/ask">
              <MessageCircle className="h-3.5 w-3.5" />
              {t("header.askJawafdehi")}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-[3px] border-primary px-4 text-[13px] font-semibold"
          >
            <Link to="/cases">{t("header.viewCases")}</Link>
          </Button>
        </div>

        <div className="flex w-full items-center justify-between lg:hidden">
          <Link
            to="/"
            aria-label="Jawafdehi home"
            className="flex items-center"
          >
            <img
              src="/assets/logo.png"
              alt="Jawafdehi"
              className="h-9 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            <div className="[&_button]:h-8 [&_button]:rounded-[3px]">
              <LanguageToggle />
            </div>
            <div className="[&_button]:h-8 [&_button]:w-8 [&_button]:rounded-[3px]">
              <ThemeToggle />
            </div>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-[3px]">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">{t("nav.menu")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[380px]">
                <SheetHeader>
                  <SheetTitle>Jawafdehi</SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-3">
                  <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
                    {t("nav.home")}
                  </NavLink>
                  <NavLink to="/our-process" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
                    {t("nav.ourProcess")}
                  </NavLink>
                  <NavLink to="/volunteer" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
                    {t("nav.volunteer")}
                  </NavLink>
                  <NavLink to="/commitment" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
                    {t("nav.ourCommitment")}
                  </NavLink>
                  <NavLink to="/about" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
                    {t("nav.about")}
                  </NavLink>
                  <Link to="/team" className="py-1 pl-4 text-sm font-semibold text-muted-foreground" onClick={() => setIsOpen(false)}>
                    {t("nav.team")}
                  </Link>
                  <Link to="/products" className="py-1 pl-4 text-sm font-semibold text-muted-foreground" onClick={() => setIsOpen(false)}>
                    {t("nav.products")}
                  </Link>
                  <Link to="/updates" className="py-1 pl-4 text-sm font-semibold text-muted-foreground" onClick={() => setIsOpen(false)}>
                    {t("nav.updates")}
                  </Link>
                  <div className="mt-4 grid gap-3 border-t border-border pt-5">
                    <Button asChild variant="primary" className="rounded-[3px]" onClick={() => setIsOpen(false)}>
                      <Link to="/ask">
                        <MessageCircle className="h-4 w-4" />
                        {t("header.askJawafdehi")}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-[3px]" onClick={() => setIsOpen(false)}>
                      <Link to="/cases">{t("header.viewCases")}</Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
