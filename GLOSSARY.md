# EASY WEST

Language for a relocation enquiry, from the website form through the sales pipeline.

## Language

**Lead**:
One request for a move submitted through the website form. A later submission from the same person is another lead.
_Avoid_: order, замовлення

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
The pipeline card name `Лід {id}`, where `{id}` is the KeyCRM card id. The route stays in the Звідки and Куди fields.

**Messenger intent**:
A pipeline card created from a WhatsApp, Telegram, or Viber button click, before a conversation exists. It is off until `NUXT_KEYCRM_MESSENGER_PIPELINE_ID` is set.
