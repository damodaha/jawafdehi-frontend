export function SupportingPartner() {
  return (
    <section
      aria-labelledby="supporting-partners-title"
      className="bg-background py-10 md:py-12"
    >
      <div className="container mx-auto flex flex-col items-center  px-4">
        <h2
          id="supporting-partners-title"
          className="text-center text-sm font-bold uppercase tracking-[0.22em] text-accent"
        >
          Supporting Partners
        </h2>
        <img
          src="/assets/monal.svg"
          alt="Monal"
          className="h-32 w-auto object-contain md:h-44"
        />
      </div>
    </section>
  );
}
