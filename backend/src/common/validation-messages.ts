import type { ValidationError } from 'class-validator';

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  password: 'Пароль',
  name: "Ім'я",
  refreshToken: 'Токен оновлення',
  productId: 'Товар',
  qty: 'Кількість',
  shippingName: "Ім'я отримувача",
  shippingEmail: 'Email для доставки',
  shippingPhone: 'Телефон',
  shippingAddress: 'Адреса доставки',
  shippingCity: 'Місто',
  shippingPostal: 'Поштовий індекс',
  categoryId: 'Категорія',
  price: 'Ціна',
  stock: 'Кількість на складі',
  description: 'Опис',
  slug: 'URL-слаг',
  imageUrl: 'Посилання на зображення',
  status: 'Статус',
  page: 'Сторінка',
  limit: 'Ліміт',
  days: 'Кількість днів',
  search: 'Пошук',
  minPrice: 'Мінімальна ціна',
  maxPrice: 'Максимальна ціна',
  sort: 'Сортування',
  from: 'Дата початку',
  to: 'Дата закінчення',
};

function fieldLabel(property: string): string {
  return FIELD_LABELS[property] ?? property;
}

function fieldError(property: string, text: string): string {
  return `Поле «${fieldLabel(property)}»: ${text}`;
}

/**
 * class-validator (0.14.4) bakes the actual decorator args (min length, enum values, etc.)
 * into the generated English message text — we pull them back out via regex instead of
 * re-declaring every field's constraints here, so translation stays in sync automatically.
 */
function translateConstraint(property: string, constraintKey: string, message: string): string {
  switch (constraintKey) {
    case 'isEmail':
      return fieldError(property, 'введіть коректну електронну адресу');
    case 'isString':
      return fieldError(property, 'значення повинно бути текстом');
    case 'isNumber':
      return fieldError(property, 'значення повинно бути числом');
    case 'isInt':
      return fieldError(property, 'значення повинно бути цілим числом');
    case 'isUUID':
      return fieldError(property, 'некоректний ідентифікатор');
    case 'isUrl':
      return fieldError(property, 'введіть коректне посилання (URL)');
    case 'isDateString':
      return fieldError(property, 'дата має бути у форматі ISO 8601 (РРРР-ММ-ДД)');
    case 'minLength': {
      const n = Number(message.match(/equal to (\d+)/)?.[1] ?? 0);
      return n <= 1 ? fieldError(property, "обов'язкове для заповнення") : fieldError(property, `мінімальна довжина — ${n} символів`);
    }
    case 'maxLength': {
      const n = message.match(/equal to (\d+)/)?.[1];
      return fieldError(property, `максимальна довжина — ${n} символів`);
    }
    case 'min': {
      const n = message.match(/less than (-?[\d.]+)/)?.[1];
      return fieldError(property, `значення не може бути меншим за ${n}`);
    }
    case 'max': {
      const n = message.match(/greater than (-?[\d.]+)/)?.[1];
      return fieldError(property, `значення не може бути більшим за ${n}`);
    }
    case 'isEnum':
    case 'isIn': {
      const values = message.split(':')[1]?.trim();
      return fieldError(property, `припустимі значення — ${values}`);
    }
    case 'matches':
      // Matches decorators in this codebase always carry an explicit, already human-written
      // (and already Ukrainian) `message`, so forward it as-is instead of a generic label.
      return message;
    case 'whitelistValidation':
      return fieldError(property, 'непідтримуване поле');
    default:
      return fieldError(property, message);
  }
}

export function translateValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      for (const [constraintKey, message] of Object.entries(error.constraints)) {
        messages.push(translateConstraint(error.property, constraintKey, message));
      }
    }
    if (error.children?.length) {
      messages.push(...translateValidationErrors(error.children));
    }
  }
  return messages;
}
