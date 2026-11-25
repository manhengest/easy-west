# Події ліда для реклами

Форма шле `lead_submit_success` у браузері і, окремо, один POST ліда на Stape. Кваліфікація і бронь картки `Лід N` йдуть із KeyCRM на сервер напряму в GA4, Meta і Google Ads. Чат без даних сайту лишається «Чат з …» і в рекламу не йде: на ньому немає click id.

Маршрут: `POST /api/keycrm/lead-status`.

## 1. GTM (близько 15 хвилин)

Контейнер `GTM-WQ2XF2QK`. Теги лишаються за згодою, як зараз.

1. Тригер: подія dataLayer `lead_submit_success`.
2. Тег GA4 Event: назва події `generate_lead`. Параметр `event_id` береться з dataLayer (`event_id`, той самий що `leadId`).
3. Тег Meta Pixel: стандартна подія `Lead`, той самий `event_id`.
4. Клік по Telegram, WhatsApp або Viber не шле `lead_submit_success` і тегом `generate_lead` не є.

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

Налаштування → Додатково → Автоматизація. На кожен статус воронки Переїзди, включно з «Нова заявка», дія «Відправити HTTP запит».

Назва колонки має збігатися зі статусом на картці. URL: `https://easy-west.com/api/keycrm/lead-status`. Метод POST. Заголовок `x-keycrm-webhook-secret` дорівнює `NUXT_KEYCRM_WEBHOOK_SECRET`. Власні параметри тіла не вмикайте: маршрут сам читає картку за `context.id`.

Дію «Надіслати конверсію у Facebook» не вмикайте. Вона вміє лише Lead і Purchase, вимагає телефон або пошту і не шле `fbclid`.

Картку, перетягнуту одразу в «Заброньовано», сервер рахує тільки як `booked_move`.

Картки чату вже потрапляють у «Нова заявка» (перевірено 2026-11-25: Telegram `source_id` 4, статус id 1). API не показує, чи вебхук спрацьовує на вході в цей статус. Щохвилинна задача додатково читає картки за останні 2 хвилини.

## 4a. Картка чату

Клік по WhatsApp, Telegram або Viber картку не створює. Він зберігається на сервері до 30 днів. Форма з месенджером теж чекає чат 15 хвилин і лише тоді створює `Лід N`. Телефонна форма створює картку одразу. Клік не йде на Stape, email і Telegram-бот команди.

У каналах Telegram, WhatsApp і Viber: «Зв’язок з воронками» = Так, воронка Переїзди, режим «Повторюваний».

Джерела, зчитані з API: WhatsApp `2`, Viber `3`, Telegram `4`. Сайт лишається `1`.

Створіть п’ять текстових полів і звірте uuid з `KEYCRM_FIELDS` у `server/utils/keycrm-map.ts`. Якщо KeyCRM видасть інші uuid, замініть константи.

1. `Останнє джерело` — `LD_1025`
2. `Останній канал` — `LD_1026`
3. `Остання кампанія` — `LD_1027`
4. `Останній вміст` — `LD_1028`
5. `Остання фраза` — `LD_1029`

Закрийте порожні картки `Лід 519`–`Лід 522`.

`NUXT_PENDING_LEADS_DIR` — абсолютний шлях поза `.output`, наприклад `/var/www/easy-west/.data/pending-leads`. У production без нього збірка не стартує.

## Правило для менеджера

Якщо чат лишився «Чат з …», візьміть у першому повідомленні рядок «Номер заявки» і вставте його в поле Lead ID, потім змініть статус. Сервер допише решту полів. Якщо в людини дві картки, натисніть «Об’єднати картки». У рекламу ведіть картку `Лід N`, не «Чат з …».

«Оплачено» — це оплата, не бронь і не завершений переїзд. «Перевезено» цим маршрутом не шлеться.

## 5. Секрети

Порожнє значення вимикає лише цей напрямок. Решта сайту стартує як раніше. Якщо не заданий жоден напрямок, вебхук відповідає 502, щоб KeyCRM повторив його після появи секретів.

| Змінна | Куди |
| --- | --- |
| `NUXT_KEYCRM_WEBHOOK_SECRET` | Заголовок вебхука. Порожнє — маршрут відповідає 401 |
| `NUXT_KEYCRM_API_KEY` | Читання картки. Уже є для форми |
| `NUXT_PENDING_LEADS_DIR` | Каталог неприв’язаних кліків і форм. Поза `.output` |
| `NUXT_STAPE_TAGGING_URL` | Походження контейнера Stape для ліда форми. Порожнє вимикає POST `/lead` |
| `NUXT_GA4_MEASUREMENT_ID`, `NUXT_GA4_API_SECRET` | GA4 Measurement Protocol для кваліфікації і броні |
| `NUXT_META_PIXEL_ID`, `NUXT_META_CAPI_TOKEN` | Meta Conversions API |
| `NUXT_GOOGLE_ADS_CUSTOMER_ID` | ID акаунта без дефісів |
| `NUXT_GOOGLE_ADS_LOGIN_CUSTOMER_ID` | ID менеджера, якщо вхід через MCC. Інакше порожнє |
| `NUXT_GOOGLE_ADS_CLIENT_ID`, `NUXT_GOOGLE_ADS_CLIENT_SECRET`, `NUXT_GOOGLE_ADS_REFRESH_TOKEN` | OAuth Data Manager |
| `NUXT_GOOGLE_ADS_QUALIFIED_ACTION_ID`, `NUXT_GOOGLE_ADS_BOOKED_ACTION_ID` | ID двох дій конверсії |

Час події — `status_changed_at`. Без цього часу маршрут відповідає 200 і нічого не шле. Сума додається, коли на картці є сума товарів або оплат, і валюта події завжди UAH.

Meta приймає подію не старшу за 7 днів. Пізніша кваліфікація лишається в GA4 і Google Ads.
