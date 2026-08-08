import { createFileRoute } from "@tanstack/react-router";
import { company } from "@/content/site";
import { Section } from "@/components/public/sections";

const TITLE = "Согласие на обработку персональных данных — Людиновокабель";
const DESCRIPTION =
  "Текст согласия на обработку персональных данных пользователей платформы обучения «Людиновокабель».";

export const Route = createFileRoute("/_public/consent")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/consent" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/consent" }],
  }),
  component: ConsentPage,
});

function ConsentPage() {
  return (
    <Section title="Согласие на обработку персональных данных">
      <div className="max-w-3xl space-y-6 text-muted-foreground">
        <p className="text-foreground">
          Отправляя форму на сайте или регистрируясь в системе обучения, пользователь даёт{" "}
          {company.legalName} согласие на обработку своих персональных данных на условиях ниже.
        </p>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Перечень данных</h2>
          <p className="mt-2">
            Фамилия, имя, отчество; подразделение и должность; адрес электронной почты; номер
            телефона; содержание обращения; сведения об обучении и результатах тестирования.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Действия с данными</h2>
          <p className="mt-2">
            Сбор, запись, систематизация, накопление, хранение, уточнение, использование, передача
            внутри организации, обезличивание, блокирование, удаление и уничтожение — с
            использованием средств автоматизации и без них.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Цель</h2>
          <p className="mt-2">
            Организация обучения и аттестации, учёт результатов, обратная связь по обращениям.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Срок и отзыв согласия</h2>
          <p className="mt-2">
            Согласие действует до его отзыва. Отзыв оформляется письменным обращением на{" "}
            {company.email} или по адресу: {company.address}.
          </p>
        </div>
      </div>
    </Section>
  );
}
