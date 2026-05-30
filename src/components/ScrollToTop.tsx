import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
    const { pathname, search } = useLocation();

    useLayoutEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });
    }, [pathname, search]);

    return null;
}