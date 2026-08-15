import { createFileRoute } from "@tanstack/react-router";
import { company } from "@/content/site";
import { useCompany } from "@/hooks/useCompany";
import { Section } from "@/components/public/sections";
import { LegalDocsDownload } from "@/components/public/LegalDocsDownload";

const TITLE = "Политика конфиденциальности — Людиновокабель";
const DESCRIPTION =
  "Политика обработки и защиты персональных данных пользователей платформы обучения «Людиновокабель».";

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const company = useCompany();
  return (
    <Section title="Политика конфиденциальности">
      <div className="max-w-3xl space-y-6 text-muted-foreground">
        <LegalDocsDownload slugs={["site-privacy-policy"]} />
        <p className="text-foreground">
          Настоящая политика описывает порядок обработки персональных данных в корпоративной
          платформе обучения {company.legalName}.
        </p>
        <div>
          <h2 className="text-lg font-semibold text-foreground">1. Оператор</h2>
          <p className="mt-2">
            Оператором персональных данных является {company.legalName}, адрес: {company.address},
            e-mail: {company.email}.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">2. Состав данных</h2>
          <p className="mt-2">
            Обрабатываются: фамилия, имя, отчество, служебная электронная почта, подразделение и
            должность, профессия и разряд, результаты обучения и тестирования, сведения об
            обращениях, отправленных через сайт.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">3. Цели обработки</h2>
          <p className="mt-2">
            Организация профессионального обучения и аттестации работников, учёт результатов
            обучения, формирование протоколов, обратная связь по обращениям.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">4. Правовые основания</h2>
          <p className="mt-2">
            Согласие субъекта персональных данных, трудовые отношения и требования законодательства
            Российской Федерации в области подготовки и аттестации персонала.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">5. Хранение и защита</h2>
          <p className="mt-2">
            Данные хранятся в защищённой информационной системе с разграничением доступа по ролям.
            Доступ к результатам обучения имеют работник, его руководитель, специалисты по персоналу
            и администраторы системы. Срок хранения — период трудовых отношений и установленные
            нормативные сроки хранения кадровых документов.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">6. Права субъекта</h2>
          <p className="mt-2">
            Субъект вправе получить сведения об обработке своих данных, потребовать их уточнения,
            блокирования или уничтожения, а также отозвать согласие, направив обращение на{" "}
            {company.email}.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">7. Передача третьим лицам</h2>
          <p className="mt-2">
            Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных
            законодательством Российской Федерации.
          </p>
        </div>
      </div>
    </Section>
  );
}
