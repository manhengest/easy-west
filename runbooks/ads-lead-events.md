# Події ліда для реклами

Форма шле `lead_submit_success` у браузері і, окремо, один POST ліда на Stape. Кваліфікація і бронь картки `Лід N` йдуть із KeyCRM на сервер напряму в GA4, Meta і Google Ads. Чати `Чат з …` у рекламу не потрапляють: на них немає click id.

Маршрут: `POST /api/keycrm/lead-status`.

## 1. GTM (близько 15 хвилин)

Контейнер `GTM-WQ2XF2QK`. Теги лишаються за згодою, як зараз.

1. Тригер: подія dataLayer `lead_submit_success`.
2. Тег GA4 Event: назва події `generate_lead`. Параметр `event_id` береться з dataLayer (`event_id`, той самий що `leadId`).
3. Тег Meta Pixel: стандартна подія `Lead`, той самий `event_id`.
4. Клік по Telegram, WhatsApp або Viber тегом ліда не є.

## 1a. Stape (контейнер EasyWest)

Сервер шле лід форми на `{NUXT_STAPE_TAGGING_URL}/lead` після прийнятої заявки. Порожній URL нічого не шле. Збій Stape не ламає форму. Повтор того самого idempotency key не шле вдруге. Банер cookie цей POST не зупиняє.

Контейнер уже називається EasyWest. Tagging URL: `https://itzsizcx.eug.stape.io`. Серверний контейнер: `GTM-5LRKSDC6`. Опубліковано версію 3: клієнт `Lead` (Data Client, шлях `/lead`), тригер `generate_lead`, тег `GA4 generate_lead` (потік `G-BJH3W31G0X`, усі параметри event data) і тег `Meta Lead` (Facebook Conversion API, піксель `1139187785353404`, токен у тегу, подія успадковується: `generate_lead` → `Lead`). Тіло POST кладе GA client id у `client_id`, телефон у `phone`, клік у `fbc`, IP у `ip_override`, браузер у `user_agent`. Тег хешує телефон і підставляє `event_id` сам.

Вебконтейнер `GTM-WQ2XF2QK`, версія 28: тег `lead_submit_success` шле в GA4 подію `generate_lead` з параметром `event_id` зі змінної рівня даних `event_id` (той самий id, що в POST). Тригер лишається `lead_submit_success`. Секрети живуть у тегах, не в другому серверному виклику. Кваліфікація і бронь сюди не йдуть. Окремий піддомен не додаємо.

## 2. GA4 і Google Ads (близько 15 хвилин)

1. `generate_lead` — key event і основна конверсія Google Ads. Її забирає зв’язка GA4 → Google Ads. У офлайн-імпорт форму не дублюємо.
2. `qualified_lead` і `booked_move` — key events. У Google Ads вони вторинні.
3. Дві дії конверсії Google Ads із джерелом **Website → Import from clicks** (тип `UPLOAD_CLICKS`): одна на кваліфікацію, одна на бронь.

Офлайн-імпорт іде через [Data Manager API](https://developers.google.com/data-manager/api/devguides/events/google-ads/offline/send-events). Токен розробника не потрібен. OAuth-клієнт має scope `https://www.googleapis.com/auth/datamanager`. Поки refresh token немає, кваліфікація і бронь усе одно йдуть у GA4 і Meta.

## 3. Поля KeyCRM (близько 10 хвилин)

У воронці Переїзди створіть два текстові поля:

1. `Реклама: кваліфіковано`
2. `Реклама: заброньовано`

Скопіюйте їхні uuid (вигляд `LD_…`) у `NUXT_KEYCRM_ADS_QUALIFIED_FIELD` і `NUXT_KEYCRM_ADS_BOOKED_FIELD`. Поле пишеться після успішної відправки, тож повторний вебхук ту саму подію не шле. Порожній uuid відповідає 502 і нічого не шле: KeyCRM повторить запит, коли поле з’явиться.

## 4. Тригери KeyCRM (близько 10 хвилин)

Налаштування → Додатково → Автоматизація. Два тригери, дія «Відправити HTTP запит»:

1. Статус «Кваліфіковано».
2. Статус «Заброньовано».

Назва колонки має збігатися з цими словами. URL: `https://easy-west.com/api/keycrm/lead-status`. Метод POST. Заголовок `x-keycrm-webhook-secret` дорівнює `NUXT_KEYCRM_WEBHOOK_SECRET`. Власні параметри тіла не вмикайте: маршрут сам читає картку за `context.id`.

Дію «Надіслати конверсію у Facebook» не вмикайте. Вона вміє лише Lead і Purchase, вимагає телефон або пошту і не шле `fbclid`.

Картку, перетягнуту одразу в «Заброньовано», сервер рахує тільки як `booked_move`.

## 5. Секрети

Порожнє значення вимикає лише цей напрямок. Решта сайту стартує як раніше. Якщо не заданий жоден напрямок, вебхук відповідає 502, щоб KeyCRM повторив його після появи секретів.

| Змінна | Куди |
| --- | --- |
| `NUXT_KEYCRM_WEBHOOK_SECRET` | Заголовок вебхука. Порожнє — маршрут відповідає 401 |
| `NUXT_KEYCRM_API_KEY` | Читання картки. Уже є для форми |
| `NUXT_STAPE_TAGGING_URL` | Походження контейнера Stape для ліда форми. Порожнє вимикає POST `/lead` |
| `NUXT_GA4_MEASUREMENT_ID`, `NUXT_GA4_API_SECRET` | GA4 Measurement Protocol для кваліфікації і броні |
| `NUXT_META_PIXEL_ID`, `NUXT_META_CAPI_TOKEN` | Meta Conversions API |
| `NUXT_GOOGLE_ADS_CUSTOMER_ID` | ID акаунта без дефісів |
| `NUXT_GOOGLE_ADS_LOGIN_CUSTOMER_ID` | ID менеджера, якщо вхід через MCC. Інакше порожнє |
| `NUXT_GOOGLE_ADS_CLIENT_ID`, `NUXT_GOOGLE_ADS_CLIENT_SECRET`, `NUXT_GOOGLE_ADS_REFRESH_TOKEN` | OAuth Data Manager |
| `NUXT_GOOGLE_ADS_QUALIFIED_ACTION_ID`, `NUXT_GOOGLE_ADS_BOOKED_ACTION_ID` | ID двох дій конверсії |

Час події — `status_changed_at`. Без цього часу маршрут відповідає 200 і нічого не шле. Сума додається, коли на картці є сума товарів або оплат, і валюта події завжди UAH.

Meta приймає подію не старшу за 7 днів. Пізніша кваліфікація лишається в GA4 і Google Ads.

## Правило для менеджера

У рекламу потрапляє статус картки `Лід N`. Картку `Чат з …` у «Кваліфіковано» і «Заброньовано» не переносьте, якщо це не та сама заявка з форми: у чата немає click id, і реклама його не побачить.

«Оплачено» — це оплата, не бронь і не завершений переїзд. «Перевезено» цим маршрутом не шлеться.
