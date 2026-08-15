import { Link } from "@tanstack/react-router";
import { brandLogos } from "@/lib/brand";
import { company } from "@/content/site";
import { useCompany } from "@/hooks/useCompany";

export function PublicFooter() {
  const company = useCompany();
  return (
    <footer className="brand-pattern-blue mt-auto text-secondary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <img
            src={brandLogos.fullCompactWhite}
            alt={brandLogos.alt}
            className="h-14 w-auto object-contain sm:hidden"
            width={54}
            height={56}
          />
          <img
            src={brandLogos.fullWhite}
            alt={brandLogos.alt}
            className="hidden h-10 w-auto max-w-[200px] object-contain sm:block"
            width={112}
            height={40}
          />
          <p className="mt-4 text-sm opacity-80">{company.legalName}</p>
          <p className="mt-1 text-sm opacity-80">{company.tagline}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Контакты</h2>
          <address className="mt-4 space-y-1 text-sm not-italic opacity-90">
            <p>{company.address}</p>
            <p>
              Телефон: <a className="underline underline-offset-4" href={`tel:${company.phone.replace(/[^+\d]/g, "")}`}>{company.phone}</a>
            </p>
            <p>Внутренние телефоны отдела персонала: {company.internalPhones}</p>
            <p>
              E-mail: <a className="underline underline-offset-4" href={`mailto:${company.email}`}>{company.email}</a>
            </p>
            <p className="opacity-75">{company.unit}</p>
          </address>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Документы</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="underline underline-offset-4 opacity-90 hover:opacity-100" to="/privacy">Политика конфиденциальности</Link></li>
            <li><Link className="underline underline-offset-4 opacity-90 hover:opacity-100" to="/consent">Согласие на обработку персональных данных</Link></li>
            <li><Link className="underline underline-offset-4 opacity-90 hover:opacity-100" to="/privacy" hash="documents">Скачать документы</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs opacity-70">
          © {new Date().getFullYear()} {company.legalName}. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
