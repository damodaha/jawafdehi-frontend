export function SupportingPartner() {
  return (
    <section
      aria-labelledby="supporting-partners-title"
      className="bg-background py-10 md:py-12"
    >
      <div className="container mx-auto flex flex-col items-center px-4">
        <h2
          id="supporting-partners-title"
          className="text-center text-sm font-bold uppercase tracking-[0.22em] text-accent"
        >
          Supporting Partners
        </h2>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-12">

        <a
          href="https://monal.cloud"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Monal Cloud"
        >
          <img
            src="/assets/monal.svg"
            alt="Monal"
            className="h-24 w-auto object-contain"
          />
        </a>

        <a
          href="https://letsbuildnepal.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Let's Build Nepal"
        >
          <img
            src="/assets/lbn.png"
            alt="Let's Build Nepal"
            className="h-16 w-auto object-contain"
          />
        </a>
        </div>
      </div>
    </section>
  );
}