# EASY WEST

Language for a relocation enquiry, from the website form through the sales pipeline.

## Language

**Lead**:
A conversation in Telegram, WhatsApp, or Viber in the Переїзди pipeline, or a request through the website form. A call or an email from the site is not a lead.
_Avoid_: order, замовлення, messenger click

**Messenger click**:
A tap on Telegram, WhatsApp, or Viber on the site. It is not a lead. It carries attribution for the chat card.
_Avoid_: lead

**Form consent**:
The checkbox on the lead form. The form cannot be submitted without it. It covers processing that enquiry, including the measurement described in the privacy policy.
_Avoid_: analytics consent, cookie banner

**Analytics consent**:
The choice on the cookie banner. It governs browser tags only. Rejecting it does not stop the form lead.
_Avoid_: form consent

**Qualified lead**:
A lead on the pipeline card named `Лід {id}` that a manager has moved to «Кваліфіковано».
_Avoid_: chat, запит на розрахунок

**Booked move**:
A lead on that same card that a manager has moved to «Заброньовано». This is the lead that converts.
_Avoid_: оплачено, qualified lead

**Completed move**:
A move that has already been carried out. The pipeline has no status for it yet.
_Avoid_: оплачено, booked move

**Оплачено**:
Money received for a lead. It is not a booked move and not a completed move.
_Avoid_: booked move, completed move

**Pipeline card**:
The sales-pipeline record of one lead.
_Avoid_: order, замовлення

**Contact channel**:
How the person asked to be reached: Telegram, WhatsApp, Viber, or phone.
_Avoid_: traffic source

**First touch**:
The first landing recorded for a browser within 30 days.
_Avoid_: last touch

**Last touch**:
The latest landing in that 30-day window that carried a campaign tag or a click id. A later direct visit does not replace it.
_Avoid_: first touch

**Click id**:
A gclid, gbraid, wbraid, or fbclid on the landing URL. The GA client id (`_ga`) and Meta browser id (`_fbp`) travel with the lead for a later ads import.

**Lead title**:
`Лід {id}` on a pipeline card that has website data. `{id}` is the KeyCRM card id. A chat with no matching website data stays «Чат з …».
