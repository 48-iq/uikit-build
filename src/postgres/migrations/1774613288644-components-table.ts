import { MigrationInterface, QueryRunner } from 'typeorm';

export class ComponentsTable1774613288644 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TYPE "components_framework_enum" AS ENUM ('react', 'vue', 'vanilla');

      CREATE TYPE "components_tags_enum" AS ENUM (
        'кнопка', 'поле_ввода', 'форма', 'модальное_окно', 'выпадающий_список',
        'таблица', 'карточка', 'список', 'вкладки', 'аккордеон', 'карусель',
        'подсказка', 'бейдж', 'аватар', 'иконка', 'загрузчик', 'скелетон',
        'уведомление', 'предупреждение', 'хлебные_крошки', 'пагинация', 'пошаговый',
        'боковая_панель', 'навигационная_панель', 'подвал', 'шапка', 'меню', 'чип',
        'переключатель', 'ползунок', 'выбор_даты', 'чекбокс', 'радиокнопка', 'селект',
        'текстовое_поле', 'загрузка_файла', 'прогресс', 'разделитель', 'тег',
        'всплывающее_окно', 'выдвижная_панель', 'таймлайн', 'дерево', 'график',
        'карта', 'видео', 'аудио', 'изображение', 'редактор', 'календарь', 'рейтинг',
        'комментарий',
        'навигация', 'отображение_данных', 'ввод_данных', 'обратная_связь',
        'компоновка', 'оверлей', 'медиа', 'типографика', 'анимация', 'утилита',
        'веб', 'мобильный', 'десктоп', 'адаптивный', 'кроссплатформенный',
        'стабильный', 'бета', 'экспериментальный', 'устаревший', 'черновик',
        'на_ревью', 'утверждён',
        'простой', 'средний', 'сложный',
        'темизированный', 'тёмная_тема', 'светлая_тема', 'настраиваемый',
        'минималистичный', 'насыщенный',
        'доступный', 'поддержка_aria', 'клавиатурная_навигация', 'скринридер',
        'высокий_контраст',
        'интерактивный', 'статичный', 'анимированный', 'перетаскиваемый', 'сортируемый',
        'фильтруемый', 'с_поиском', 'редактируемый', 'только_чтение', 'отключён',
        'размер_xs', 'размер_sm', 'размер_md', 'размер_lg', 'размер_xl',
        'критичный', 'высокий_приоритет', 'низкий_приоритет',
        'переиспользуемый', 'составной', 'атомарный', 'сторонний', 'внутренний',
        'открытый_исходный_код', 'протестирован', 'задокументирован',
        'нужен_рефакторинг', 'производительность', 'готов_к_ssr', 'seo_оптимизирован',
        'интернационализация', 'поддержка_rtl'
      );

      CREATE TABLE "components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying NOT NULL,
        "username" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP DEFAULT NULL,
        "framework" "components_framework_enum" NOT NULL,
        "tags" "components_tags_enum"[] NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_component_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "components";
      DROP TYPE "components_tags_enum";
      DROP TYPE "components_framework_enum";
    `);
  }
}
