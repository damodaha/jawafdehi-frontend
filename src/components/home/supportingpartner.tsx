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
      </div>
    </section>
  );
}