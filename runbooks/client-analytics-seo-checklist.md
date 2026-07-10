# Чеклист для замовника: аналітика та SEO

Після деплою останніх змін виконайте ці кроки.

## Google Analytics / GTM (конверсії)

1. Відкрийте сайт у **інкогніто** (чисті cookies).
2. Натисніть **«Прийняти всі»** на cookie-банері — без цього GTM не завантажується, і конверсії не потрапляють у GA4.
3. У GTM увімкніть **Preview** для контейнера `GTM-WQ2XF2QK`.
4. Відправте тестову заявку через форму.
5. У GTM Preview перевірте:
   - подія `lead_submit_success` у dataLayer;
   - спрацьовує тег GA4 Event (назва має збігатися з Key event у GA4).
6. У GA4 → **Admin → Events** переконайтеся, що `lead_submit_success` позначено як **Key event** (конверсія).

Якщо подія є в Preview, але немає в GA4 — проблема в налаштуванні тега/конверсії в GTM/GA4, не на сайті.

## Google Search Console (canonical / індексація)

1. **URL Inspection** → `https://easy-west.com/` → **Request indexing**.
2. Перевірте, що canonical у HTML:  
   `curl -s https://easy-west.com/ | grep canonical`  
   Очікується: `<link rel="canonical" href="https://easy-west.com">`
3. Переконайтеся, що `https://storebuilderkz.com/` **не відкривається** (nginx має відкидати з'єднання).
4. Старий Google-selected canonical (`storebuilderkz.com`) оновиться після re-crawl (зазвичай кілька днів).

## Sitemap

1. У GSC → **Sitemaps** додайте або оновіть:  
   `https://easy-west.com/sitemap_index.xml`
2. Перевірте, що RU-сторінки є в sitemap:  
   `curl -sL https://easy-west.com/__sitemap__/ru-RU.xml`  
   Мають бути `/ru`, `/ru/privacy`, `/ru/cookies`, `/ru/terms`, `/ru/accessibility`.

## UTM у Telegram

Після деплою надішліть тестову заявку з URL на кшталт:  
`https://easy-west.com/?utm_source=test&utm_medium=check&utm_campaign=qa`

У Telegram-повідомленні мають з’явитися рядки UTM source / medium / campaign.
