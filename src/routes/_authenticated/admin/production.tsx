import { createFileRoute } from "@tanstack/react-router";
import { EntityManager } from "@/components/admin/EntityManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/production")({
  head: () => ({
    meta: [
      { title: "Производственные данные — Академия «Людиновокабель»" },
      {
        name: "description",
        content:
          "Продукция, рабочие центры, маршруты изготовления, конструкция кабеля, материалы, дефекты и 3D-ресурсы.",
      },
      { property: "og:title", content: "Производственные данные платформы обучения" },
      {
        property: "og:description",
        content: "Паспорт производственных данных для тренажёров и виртуального завода.",
      },
    ],
  }),
  component: ProductionPage,
});

function ProductionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Производственные данные</h1>
        <p className="text-sm text-muted-foreground">
          Паспорт производственных данных: используется тренажёрами, виртуальным заводом и
          аналитикой ошибок. Загружается из Excel в разделе «Импорт».
        </p>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="products">Продукция</TabsTrigger>
          <TabsTrigger value="centers">Рабочие центры</TabsTrigger>
          <TabsTrigger value="routes">Маршруты</TabsTrigger>
          <TabsTrigger value="constructions">Конструкция 3D</TabsTrigger>
          <TabsTrigger value="materials">Материалы</TabsTrigger>
          <TabsTrigger value="defects">Дефекты</TabsTrigger>
          <TabsTrigger value="assets">3D-ресурсы</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <EntityManager
            table="production_products"
            title="Продукция"
            description="Марки и наименования выпускаемой кабельной продукции."
            orderBy="code"
            searchKeys={["code", "name", "brand", "category"]}
            fields={[
              { name: "code", label: "Код продукции", required: true },
              { name: "name", label: "Наименование", required: true },
              { name: "brand", label: "Марка" },
              { name: "category", label: "Категория" },
              { name: "default_area", label: "Участок по умолчанию" },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "is_active", label: "Активна", type: "boolean" },
            ]}
            columns={[
              { key: "code", label: "Код" },
              { key: "brand", label: "Марка" },
              { key: "name", label: "Наименование" },
              { key: "category", label: "Категория" },
            ]}
          />
        </TabsContent>

        <TabsContent value="centers" className="mt-6">
          <EntityManager
            table="work_centers"
            title="Рабочие центры"
            description="Оборудование производственных участков."
            orderBy="code"
            searchKeys={["code", "name", "process", "equipment_type"]}
            fields={[
              { name: "code", label: "Код РЦ", required: true },
              { name: "name", label: "Наименование", required: true },
              { name: "process", label: "Процесс" },
              { name: "equipment_type", label: "Тип оборудования" },
              { name: "area", label: "Участок" },
              { name: "site", label: "Площадка" },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "is_active", label: "Активен", type: "boolean" },
            ]}
            columns={[
              { key: "code", label: "Код" },
              { key: "name", label: "Наименование" },
              { key: "process", label: "Процесс" },
              { key: "area", label: "Участок" },
            ]}
          />
        </TabsContent>

        <TabsContent value="routes" className="mt-6">
          <EntityManager
            table="production_routes"
            title="Маршруты изготовления"
            description="Допустимые сочетания этапа, процесса и рабочего центра."
            orderBy="product_code"
            searchKeys={["product_code", "process", "work_center_code"]}
            fields={[
              { name: "product_code", label: "Код продукции", required: true },
              { name: "step_number", label: "№ этапа", type: "number", required: true },
              { name: "process", label: "Процесс", required: true },
              { name: "work_center_code", label: "Код РЦ", required: true },
              { name: "is_allowed", label: "Допустим", type: "boolean" },
              { name: "is_required_step", label: "Обязательный этап", type: "boolean" },
              { name: "trainer_comment", label: "Комментарий для тренажёра", type: "textarea" },
              { name: "is_active", label: "Активен", type: "boolean" },
            ]}
            columns={[
              { key: "product_code", label: "Продукция" },
              { key: "step_number", label: "Этап" },
              { key: "process", label: "Процесс" },
              { key: "work_center_code", label: "РЦ" },
            ]}
          />
        </TabsContent>

        <TabsContent value="constructions" className="mt-6">
          <EntityManager
            table="cable_constructions"
            title="Конструкция кабеля (3D)"
            description="Слои конструкции для тренажёров «Собери кабель» и «Разбери кабель»."
            orderBy="product_code"
            searchKeys={["product_code", "element_code", "element_name"]}
            fields={[
              { name: "product_code", label: "Код продукции", required: true },
              { name: "layer_number", label: "№ слоя", type: "number", required: true },
              { name: "element_code", label: "Код элемента", required: true },
              { name: "element_name", label: "Элемент", required: true },
              { name: "process", label: "Процесс" },
              { name: "asset_code", label: "Код 3D-элемента" },
              { name: "material_code", label: "Материал (код)" },
              { name: "visual_type", label: "Тип визуализации" },
              { name: "layer_description", label: "Описание слоя", type: "textarea" },
              { name: "show_in_learning", label: "Показывать в учебном режиме", type: "boolean" },
              { name: "is_active", label: "Активен", type: "boolean" },
            ]}
            columns={[
              { key: "product_code", label: "Продукция" },
              { key: "layer_number", label: "Слой" },
              { key: "element_name", label: "Элемент" },
              { key: "asset_code", label: "3D-элемент" },
            ]}
          />
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <EntityManager
            table="production_materials"
            title="Материалы"
            description="Справочник материалов слоёв кабеля."
            orderBy="code"
            searchKeys={["code", "name", "category"]}
            fields={[
              { name: "code", label: "Код материала", required: true },
              { name: "name", label: "Наименование", required: true },
              { name: "category", label: "Категория" },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "is_active", label: "Активен", type: "boolean" },
            ]}
            columns={[
              { key: "code", label: "Код" },
              { key: "name", label: "Наименование" },
              { key: "category", label: "Категория" },
            ]}
          />
        </TabsContent>

        <TabsContent value="defects" className="mt-6">
          <EntityManager
            table="defects"
            title="Дефекты"
            description="Каталог дефектов для контроля качества и производственных квестов."
            orderBy="code"
            searchKeys={["code", "name", "process"]}
            fields={[
              { name: "code", label: "Код дефекта", required: true },
              { name: "name", label: "Название дефекта", required: true },
              { name: "process", label: "Процесс" },
              { name: "product_category", label: "Категория продукции" },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "possible_cause", label: "Возможная причина", type: "textarea" },
              { name: "corrective_action", label: "Корректирующее действие", type: "textarea" },
              { name: "image_url", label: "Изображение или файл" },
              { name: "is_active", label: "Активен", type: "boolean" },
            ]}
            columns={[
              { key: "code", label: "Код" },
              { key: "name", label: "Дефект" },
              { key: "process", label: "Процесс" },
            ]}
          />
        </TabsContent>

        <TabsContent value="assets" className="mt-6">
          <EntityManager
            table="model_assets"
            title="3D-ресурсы"
            description="Модели GLB/GLTF и другие ресурсы 3D-тренажёра."
            orderBy="code"
            searchKeys={["code", "name", "format"]}
            fields={[
              { name: "code", label: "Код 3D-элемента", required: true },
              { name: "name", label: "Название", required: true },
              { name: "format", label: "Формат" },
              { name: "file_url", label: "Имя файла или URL" },
              { name: "version", label: "Версия" },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "is_active", label: "Активен", type: "boolean" },
            ]}
            columns={[
              { key: "code", label: "Код" },
              { key: "name", label: "Название" },
              { key: "format", label: "Формат" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
