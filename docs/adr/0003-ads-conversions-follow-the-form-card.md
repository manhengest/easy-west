# Ads conversions follow the form card

A qualified lead and a booked move are status changes on the pipeline card `Лід N`, because that card carries the click id. A click on Telegram, WhatsApp, or Viber is that card too ([0005](0005-messenger-click-is-a-lead.md)). A completed move is a move already carried out; the pipeline has no status for it yet. A chat card (`Чат з …`) has no click id: the personal Telegram link cannot pass a start code, the KeyCRM webhook has no message text, and the built-in Facebook action only sends Lead or Purchase, requires a phone or email, and does not send the click id. Moving a card straight to «Заброньовано» sends the booked move only. «Оплачено» stays a payment.

Offline Google Ads conversions go through the Data Manager API. Google closed new `UploadClickConversions` clients and no longer issues a developer token for this upload. Until the Ads OAuth credentials exist, the same status still goes to GA4 and Meta.
